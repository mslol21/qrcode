import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react'; 
import { Trash2, Link as LinkIcon, PlusCircle, LayoutDashboard, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

function AdminDashboard() {
  const [exercises, setExercises] = useState([]);
  const [scoreboard, setScoreboard] = useState({ 'Grupo A': 0, 'Grupo B': 0 });
  const [formData, setFormData] = useState({
    pergunta: '',
    alternativas: ['', '', '', ''],
    resposta_correta: '',
    categoria: '',
    nivel: 'fácil',
    tipo: 'escolha', // 'escolha', 'completar', 'silabas'
    image_url: ''
  });

  useEffect(() => {
    fetchExercises();
    fetchScoreboard();
  }, []);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setExercises(data || []);
    } catch (err) {
      console.error('Error fetching exercises:', err);
    }
  };

  const fetchScoreboard = async () => {
    try {
      const { data, error } = await supabase
        .from('answers')
        .select('grupo, correto');
      
      if (error) throw error;
      
      const scores = { 'Grupo A': 0, 'Grupo B': 0 };
      data.forEach(ans => {
        if (ans.correto && scores[ans.grupo] !== undefined) {
          scores[ans.grupo]++;
        }
      });
      setScoreboard(scores);
    } catch (err) {
      console.error('Error fetching scoreboard:', err);
    }
  };

  const handleAltChange = (index, value) => {
    const newAlts = [...formData.alternativas];
    newAlts[index] = value;
    setFormData({ ...formData, alternativas: newAlts });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('exercises')
        .insert([{
          ...formData,
          alternativas: formData.alternativas.filter(a => a.trim() !== '')
        }]);
      
      if (error) throw error;

      setFormData({
        pergunta: '',
        alternativas: ['', '', '', ''],
        resposta_correta: '',
        categoria: '',
        nivel: 'fácil',
        tipo: 'escolha',
        image_url: ''
      });
      fetchExercises();
    } catch (err) {
      console.error('Error adding exercise:', err);
      alert('Erro ao adicionar! Verifique se rodou o comando SQL sugerido no Supabase.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza?')) return;
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchExercises();
    } catch (err) {
      console.error('Error deleting exercise:', err);
    }
  };

  const resetScores = async () => {
    if (!window.confirm('Isso vai apagar todas as respostas e zerar o placar. Continuar?')) return;
    try {
      const { error } = await supabase
        .from('answers')
        .delete()
        .not('id', 'is', null);
      if (error) throw error;
      setScoreboard({ 'Grupo A': 0, 'Grupo B': 0 });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LayoutDashboard size={40} /> Gincana QR Learning 🏆
        </h1>
        
        <div className="placar-display" style={{ display: 'flex', gap: '2rem' }}>
          <div className="placar-item grupo-a">
            <span style={{ fontSize: '1rem', color: '#1c7ed6' }}>Grupo A</span>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{scoreboard['Grupo A']}</div>
          </div>
          <div className="placar-item grupo-b">
            <span style={{ fontSize: '1rem', color: '#e03131' }}>Grupo B</span>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{scoreboard['Grupo B']}</div>
          </div>
          <button onClick={resetScores} className="btn" style={{ height: 'fit-content', background: '#f1f3f5', padding: '0.5rem 1rem' }}>Zerar Placar</button>
        </div>
      </div>

      <div className="admin-grid">
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', color: '#343a40' }}>Criar Novo Exercício</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Tipo de Atividade</label>
              <select 
                className="form-select" 
                value={formData.tipo}
                onChange={e => setFormData({...formData, tipo: e.target.value})}
              >
                <option value="escolha">Marcar Resposta (Múltipla Escolha)</option>
                <option value="completar">Completar Lacuna (ex: PO__BA)</option>
                <option value="silabas">Formar Nome (ex: Sílabas do PDF)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Pergunta ou Nome do Objeto</label>
              <input 
                required 
                className="form-input" 
                value={formData.pergunta} 
                onChange={e => setFormData({...formData, pergunta: e.target.value})} 
                placeholder="Ex: Qual o nome desta figura?"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Link da Imagem (Opcional)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <ImageIcon size={20} color="#868e96" />
                <input 
                  className="form-input" 
                  value={formData.image_url} 
                  onChange={e => setFormData({...formData, image_url: e.target.value})} 
                  placeholder="Cole o link da imagem (ex: do ImgBB)"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">
                {formData.tipo === 'escolha' ? 'Opções de Resposta' : 'Sílabas/Letras Disponíveis'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {formData.alternativas.map((alt, i) => (
                  <input 
                    key={i} 
                    required={i < 2} 
                    className="form-input" 
                    value={alt} 
                    onChange={e => handleAltChange(i, e.target.value)} 
                    placeholder={`Opção ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Resposta Correta</label>
              <select 
                required 
                className="form-select" 
                value={formData.resposta_correta} 
                onChange={e => setFormData({...formData, resposta_correta: e.target.value})}
              >
                <option value="" disabled>Qual a certa?</option>
                {formData.alternativas.map((alt, i) => (
                  <option key={i} value={alt} disabled={!alt}>{alt || `Opção ${i + 1}`}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Matéria/Tag</label>
                <input required className="form-input" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} placeholder="Ex: Português" />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Nível</label>
                <select className="form-select" value={formData.nivel} onChange={e => setFormData({...formData, nivel: e.target.value})}>
                  <option value="fácil">Fácil</option>
                  <option value="médio">Médio</option>
                  <option value="difícil">Difícil</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
              <PlusCircle size={24} style={{ marginRight: '8px' }} /> Adicionar à Gincana
            </button>
          </form>
        </div>

        <div className="exercise-list">
          <h2 style={{ color: '#343a40', display: 'flex', alignItems: 'center', gap: '10px' }}>
             Itens Ativos ({exercises.length})
          </h2>
          {exercises.map(ex => (
            <div key={ex.id} className="exercise-item" style={{ borderLeft: `6px solid ${ex.tipo === 'escolha' ? '#1c7ed6' : ex.tipo === 'completar' ? '#fcc419' : '#51cf66'}` }}>
              <div className="exercise-header">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="pill" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>{ex.tipo}</span>
                    <h3 style={{ fontSize: '1.2rem', color: '#1864ab', margin: 0 }}>{ex.pergunta}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <span className="pill pill-fácil" style={{ background: '#e9ecef', color: '#495057' }}>{ex.categoria}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(ex.id)} className="btn btn-danger" style={{ borderRadius: '8px', padding: '0.5rem' }}>
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginTop: '1rem' }}>
                <div className="qr-container" style={{ padding: '10px', background: '#f8f9fa', borderRadius: '12px' }}>
                  <QRCodeSVG 
                    value={`${window.location.protocol}//${window.location.host}/qr/${ex.id}`} 
                    size={100} 
                  />
                </div>
                
                {ex.image_url && (
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #dee2e6' }}>
                    <img src={ex.image_url} alt="Referência" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                <div style={{ flex: 1, fontSize: '0.9rem' }}>
                  <strong>Resposta:</strong> <span style={{ color: '#2b8a3e', fontWeight: 'bold' }}>{ex.resposta_correta}</span>
                  <div style={{ marginTop: '0.3rem', color: '#868e96' }}>Opções: {ex.alternativas.join(', ')}</div>
                  <a href={`/qr/${ex.id}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', color: '#1c7ed6', textDecoration: 'none', fontWeight: 'bold' }}>
                    <LinkIcon size={14} /> Abrir Atividade
                  </a>
                </div>
              </div>
            </div>
          ))}
          {exercises.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#adb5bd', border: '2px dashed #dee2e6', borderRadius: '16px' }}>
              Nenhum exercício criado para a gincana ainda. 🎉
            </div>
          )}
        </div>
      </div>

      <style>{`
        .placar-display {
          background: white;
          padding: 1rem 2rem;
          border-radius: 20px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .placar-item {
          text-align: center;
          padding: 0 1rem;
        }
        .grupo-a { border-right: 2px solid #f1f3f5; }
        .grupo-a div { color: #1c7ed6; }
        .grupo-b div { color: #e03131; }
      `}</style>
    </div>
  );
}

export default AdminDashboard;
