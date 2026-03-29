import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react'; 
import { Trash2, Link as LinkIcon, PlusCircle, LayoutDashboard, Image as ImageIcon, Upload, Loader2, Edit3, X } from 'lucide-react';

function AdminDashboard() {
  const [exercises, setExercises] = useState([]);
  const [scoreboard, setScoreboard] = useState({ 'Grupo A': 0, 'Grupo B': 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [groupNames, setGroupNames] = useState({
    'Grupo A': localStorage.getItem('group_A_name') || 'Grupo A 🦁',
    'Grupo B': localStorage.getItem('group_B_name') || 'Grupo B 🦅'
  });
  
  const [formData, setFormData] = useState({
    pergunta: '',
    alternativas: ['', '', '', ''],
    resposta_correta: '',
    categoria: '',
    nivel: 'fácil',
    tipo: 'escolha', 
    image_url: ''
  });

  useEffect(() => {
    fetchExercises();
    fetchScoreboard();
    fetchGroupNames();
  }, []);

  const fetchGroupNames = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('categoria', '_config')
        .eq('pergunta', 'GROUP_NAMES')
        .single();
      
      if (data && data.alternativas) {
        setGroupNames({
          'Grupo A': data.alternativas[0],
          'Grupo B': data.alternativas[1]
        });
      }
    } catch (err) {
      console.log('Group names not set in DB yet');
    }
  };

  const updateGroupNames = async (group, name) => {
    const newNames = { ...groupNames, [group]: name };
    setGroupNames(newNames);
    
    // Sync with DB
    try {
      const { data: existing } = await supabase
        .from('exercises')
        .select('*')
        .eq('categoria', '_config')
        .eq('pergunta', 'GROUP_NAMES')
        .single();

      const payload = {
        pergunta: 'GROUP_NAMES',
        alternativas: [newNames['Grupo A'], newNames['Grupo B']],
        resposta_correta: 'CONFIG',
        categoria: '_config',
        nivel: 'fácil',
        tipo: 'config'
      };

      if (existing) {
        await supabase.from('exercises').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('exercises').insert([payload]);
      }
    } catch (err) {
      console.error('Error syncing group names:', err);
    }
  };
  
  const handleEdit = (ex) => {
    setIsEditing(true);
    setEditingId(ex.id);
    setFormData({
      pergunta: ex.pergunta,
      alternativas: ex.alternativas && ex.alternativas.length > 0 ? [...ex.alternativas, '', '', '', ''].slice(0, 4) : ['', '', '', ''],
      resposta_correta: ex.resposta_correta,
      categoria: ex.categoria,
      nivel: ex.nivel,
      tipo: ex.tipo,
      image_url: ex.image_url || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      pergunta: '',
      alternativas: ['', '', '', ''],
      resposta_correta: '',
      categoria: '',
      nivel: 'fácil',
      tipo: 'escolha',
      image_url: ''
    });
  };

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setExercises((data || []).filter(ex => ex.categoria !== '_config'));
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `exercicios/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('imagens-gincana')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('imagens-gincana')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
      alert('Imagem carregada com sucesso! ⭐');
    } catch (err) {
      console.error('Erro no upload:', err);
      alert('Erro ao subir imagem! Verifique se você criou o Bucket "imagens-gincana" como PÚBLICO no Supabase Storage.');
    } finally {
      setIsUploading(false);
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
      if (isEditing) {
        const { error } = await supabase
          .from('exercises')
          .update({
            ...formData,
            alternativas: formData.alternativas.filter(a => a.trim() !== '')
          })
          .eq('id', editingId);
        
        if (error) throw error;
        alert('Desafio atualizado com sucesso! 💎');
      } else {
        const { error } = await supabase
          .from('exercises')
          .insert([{
            ...formData,
            alternativas: formData.alternativas.filter(a => a.trim() !== '')
          }]);
        
        if (error) throw error;
      }

      setFormData({
        pergunta: '',
        alternativas: ['', '', '', ''],
        resposta_correta: '',
        categoria: '',
        nivel: 'fácil',
        tipo: 'escolha',
        image_url: ''
      });
      setIsEditing(false);
      setEditingId(null);
      fetchExercises();
    } catch (err) {
      console.error('Error saving exercise:', err);
      alert('Erro ao salvar no banco!');
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
    if (!window.confirm('Isso vai zerar o placar da gincana. Continuar?')) return;
    try {
       await supabase.from('answers').delete().not('id', 'is', null);
       setScoreboard({ 'Grupo A': 0, 'Grupo B': 0 });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LayoutDashboard size={40} /> Admin Gincana 🏆
        </h1>
        
        <div className="placar-display" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div className="placar-item" style={{ flex: 1, minWidth: '150px' }}>
            <input 
              className="form-input" 
              style={{ fontSize: '0.9rem', padding: '5px', marginBottom: '5px', fontWeight: 'bold' }} 
              value={groupNames['Grupo A']} 
              onChange={e => updateGroupNames('Grupo A', e.target.value)} 
            />
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1c7ed6' }}>{scoreboard['Grupo A']}</div>
          </div>
          <div className="placar-item" style={{ flex: 1, minWidth: '150px' }}>
            <input 
              className="form-input" 
              style={{ fontSize: '0.9rem', padding: '5px', marginBottom: '5px', fontWeight: 'bold' }} 
              value={groupNames['Grupo B']} 
              onChange={e => updateGroupNames('Grupo B', e.target.value)} 
            />
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#e03131' }}>{scoreboard['Grupo B']}</div>
          </div>
          <button onClick={resetScores} className="btn" style={{ background: '#f1f3f5', height: 'fit-content' }}>Zerar Placar</button>
        </div>
      </div>

      <div className="admin-grid">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>{isEditing ? 'Editar Desafio' : 'Novo Desafio'}</h2>
            {isEditing && (
              <button 
                onClick={cancelEditing} 
                className="btn btn-secondary" 
                style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <X size={16} /> Cancelar
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                <option value="escolha">Marcar Resposta</option>
                <option value="completar">Completar Lacuna</option>
                <option value="silabas">Montar com Sílabas</option>
                <option value="pdf">Material (PDF)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Pergunta/Enunciado</label>
              <input required className="form-input" value={formData.pergunta} onChange={e => setFormData({...formData, pergunta: e.target.value})} placeholder="Ex: Qual o nome da figura?" />
            </div>

            <div className="form-group">
              <label className="form-label">Imagem da Atividade</label>
              <div 
                style={{ 
                  border: '2px dashed #dee2e6', 
                  borderRadius: '12px', 
                  padding: '1.5rem', 
                  textAlign: 'center',
                  background: formData.image_url ? '#e7f5ff' : '#f8f9fa',
                  position: 'relative'
                }}
              >
                {isUploading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Loader2 className="animate-spin" size={30} />
                    <span>Enviando para o Supabase...</span>
                  </div>
                ) : formData.image_url ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img src={formData.image_url} alt="Preview" style={{ maxWidth: '100px', borderRadius: '8px', marginBottom: '8px' }} />
                    <span style={{ fontSize: '0.8rem', color: '#2b8a3e' }}>Imagem carregada! ✅</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                         <button type="button" onClick={() => setFormData({...formData, image_url: ''})} style={{ background: 'none', border: 'none', color: '#fa5252', textDecoration: 'underline', cursor: 'pointer', marginTop: '5px' }}>Remover</button>
                    </div>
                  </div>
                ) : (
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Upload size={30} color="#339af0" />
                    <span style={{ fontWeight: 'bold', color: '#339af0' }}>Clique para Carregar Foto</span>
                    <span style={{ fontSize: '0.8rem', color: '#868e96' }}>Formatos: JPG, PNG, WEBP, PDF</span>
                    <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} accept="image/*,application/pdf" />
                  </label>
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Opções/Elementos</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {formData.alternativas.map((alt, i) => (
                  <input key={i} required={i < 2} className="form-input" value={alt} onChange={e => handleAltChange(i, e.target.value)} placeholder={`Opção ${i + 1}`} />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Resposta Certa</label>
              {formData.tipo === 'escolha' ? (
                <select required className="form-select" value={formData.resposta_correta} onChange={e => setFormData({...formData, resposta_correta: e.target.value})}>
                  <option value="" disabled>Selecione a certa</option>
                  {formData.alternativas.map((alt, i) => (
                    <option key={i} value={alt} disabled={!alt}>{alt}</option>
                  ))}
                </select>
              ) : (
                <input 
                  required 
                  className="form-input" 
                  value={formData.resposta_correta} 
                  onChange={e => setFormData({...formData, resposta_correta: e.target.value})} 
                  placeholder="Digite a palavra correta para validação" 
                />
              )}
            </div>

            <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Categoria</label>
                <input required className="form-input" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} placeholder="Português" />
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

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={isUploading}>
              {isEditing ? <Edit3 size={24} style={{ marginRight: '8px' }} /> : <PlusCircle size={24} style={{ marginRight: '8px' }} />}
              {isEditing ? 'Atualizar Desafio' : 'Criar Atividade'}
            </button>
          </form>
        </div>

        <div className="exercise-list">
          <h2 style={{ color: '#343a40' }}>Desafios na Sala</h2>
          {exercises.map(ex => (
            <div key={ex.id} className={`exercise-item ${editingId === ex.id ? 'editing' : ''}`}>
              <div className="exercise-header">
                <div>
                  <span className="pill" style={{ opacity: 0.7 }}>{ex.tipo}</span>
                  <h3 style={{ margin: '5px 0' }}>{ex.pergunta}</h3>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEdit(ex)} className="btn" style={{ background: '#e7f5ff', color: '#1c7ed6', borderRadius: '8px', padding: '8px' }}><Edit3 size={16} /></button>
                    <button onClick={() => handleDelete(ex.id)} className="btn btn-danger" style={{ borderRadius: '8px', padding: '8px' }}><Trash2 size={16} /></button>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '10px' }}>
                  <QRCodeSVG value={`${window.location.protocol}//${window.location.host}/qr/${ex.id}`} size={80} />
                </div>
                {ex.image_url && (
                  ex.image_url.toLowerCase().endsWith('.pdf') || ex.tipo === 'pdf' ? (
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#fff5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ffc9c9' }}>
                       <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#e03131' }}>PDF</span>
                    </div>
                  ) : (
                    <img src={ex.image_url} alt="Recurso" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                  )
                )}
                <div style={{ flex: 1 }}>
                  <strong>Certa: {ex.resposta_correta}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#868e96' }}>ID: {ex.id.substring(0,8)}...</div>
                  <a href={`/qr/${ex.id}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem', color: '#339af0', textDecoration: 'none' }}>Ver Gincana</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .placar-display { background: white; padding: 1rem; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .exercise-item.editing { border: 2px solid #339af0; background: #f0f7ff; }
      `}</style>
    </div>
  );
}

export default AdminDashboard;
