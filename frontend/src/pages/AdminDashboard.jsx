import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react'; 
import { Trash2, Link as LinkIcon, PlusCircle, LayoutDashboard } from 'lucide-react';

function AdminDashboard() {
  const [exercises, setExercises] = useState([]);
  const [formData, setFormData] = useState({
    pergunta: '',
    alternativas: ['', '', '', ''],
    resposta_correta: '',
    categoria: '',
    nivel: 'fácil'
  });

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        return;
      }
      setExercises(data || []);
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setExercises([]);
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
        .insert([formData]);
      
      if (error) throw error;

      setFormData({
        pergunta: '',
        alternativas: ['', '', '', ''],
        resposta_correta: '',
        categoria: '',
        nivel: 'fácil'
      });
      fetchExercises();
    } catch (err) {
      console.error('Error adding exercise:', err);
      alert('Erro ao adicionar: Verifique se as tabelas foram criadas no Supabase.');
    }
  };

  const handleDelete = async (id) => {
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

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1 className="title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LayoutDashboard size={40} /> Teacher Zone
        </h1>
      </div>

      <div className="admin-grid">
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', color: '#343a40' }}>Criar Novo Desafio</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Pergunta</label>
              <input 
                required 
                className="form-input" 
                value={formData.pergunta} 
                onChange={e => setFormData({...formData, pergunta: e.target.value})} 
                placeholder="Ex: Quanto é 2 + 2?"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Alternativas</label>
              {formData.alternativas.map((alt, i) => (
                <input 
                  key={i} 
                  required 
                  className="form-input" 
                  style={{ marginBottom: '0.5rem' }} 
                  value={alt} 
                  onChange={e => handleAltChange(i, e.target.value)} 
                  placeholder={`Alternativa ${i + 1}`}
                />
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Resposta Correta</label>
              <select 
                required 
                className="form-select" 
                value={formData.resposta_correta} 
                onChange={e => setFormData({...formData, resposta_correta: e.target.value})}
              >
                <option value="" disabled>Selecione a resposta certa</option>
                {formData.alternativas.map((alt, i) => (
                  <option key={i} value={alt} disabled={!alt}>{alt || `Alternativa ${i + 1}`}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Categoria</label>
                <input 
                  required 
                  className="form-input" 
                  value={formData.categoria} 
                  onChange={e => setFormData({...formData, categoria: e.target.value})} 
                  placeholder="Ex: Matemática"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Nível</label>
                <select 
                  className="form-select" 
                  value={formData.nivel} 
                  onChange={e => setFormData({...formData, nivel: e.target.value})}
                >
                  <option value="fácil">Fácil</option>
                  <option value="médio">Médio</option>
                  <option value="difícil">Difícil</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <PlusCircle /> Adicionar Exercício
            </button>
          </form>
        </div>

        <div className="exercise-list">
          <h2 style={{ color: '#343a40' }}>Desafios Ativos ({exercises.length})</h2>
          {exercises.map(ex => (
            <div key={ex.id} className="exercise-item">
              <div className="exercise-header">
                <div>
                  <h3 style={{ fontSize: '1.4rem', color: '#1864ab', marginBottom: '0.5rem' }}>{ex.pergunta}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span className="pill">{ex.categoria}</span>
                    <span className={`pill pill-${ex.nivel.replace('í', 'i')}`}>{ex.nivel}</span>
                  </div>
                </div>
                <div className="exercise-actions">
                  <button onClick={() => handleDelete(ex.id)} className="btn btn-danger" style={{ borderRadius: '8px' }}>
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div className="qr-container">
                  <QRCodeSVG 
                    value={`${window.location.protocol}//${window.location.host}/qr/${ex.id}`} 
                    size={120} 
                  />
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#868e96' }}>ID: {ex.id.substring(0,8)}...</div>
                </div>
                <div style={{ flex: 1 }}>
                  <strong>Alternativas:</strong>
                  <ul style={{ listStylePosition: 'inside', marginTop: '0.5rem', color: '#495057' }}>
                    {ex.alternativas.map((a, i) => (
                      <li key={i} style={{ fontWeight: a === ex.resposta_correta ? 'bold' : 'normal', color: a === ex.resposta_correta ? '#2b8a3e' : 'inherit' }}>
                        {a} {a === ex.resposta_correta && '✅'}
                      </li>
                    ))}
                  </ul>
                  <a href={`/qr/${ex.id}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: '#1c7ed6', textDecoration: 'none', fontWeight: 'bold' }}>
                    <LinkIcon size={16} /> Ver página do aluno
                  </a>
                </div>
              </div>
            </div>
          ))}
          {exercises.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#adb5bd', fontSize: '1.2rem', background: 'white', borderRadius: '16px', border: '2px dashed #dee2e6' }}>
              Nenhum exercício criado ainda. Crie o primeiro ao lado! 🎉
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
