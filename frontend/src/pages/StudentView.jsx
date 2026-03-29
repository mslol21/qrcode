import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';
import { Volume2, Smile, Frown, Check, Send, Users, Star, FileText, ExternalLink } from 'lucide-react';

function StudentView() {
  const { id } = useParams();
  const [exercise, setExercise] = useState(null);
  const [selected, setSelected] = useState(null);
  const [builtWord, setBuiltWord] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [alunoNome, setAlunoNome] = useState('');
  const [grupo, setGrupo] = useState('');
  const [groupNames, setGroupNames] = useState({
    'Grupo A': 'Grupo A 🦁',
    'Grupo B': 'Grupo B 🦅'
  });
  const [started, setStarted] = useState(false);

  useEffect(() => {
    fetchGroupNames();
    
    const savedNome = localStorage.getItem('aluno_nome');
    const savedGrupo = localStorage.getItem('aluno_grupo');
    if (savedNome) setAlunoNome(savedNome);
    if (savedGrupo) setGrupo(savedGrupo);
    if (savedNome && savedGrupo) setStarted(true);
    
    fetchExercise();
  }, [id]);

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
      console.log('Using default group names');
    }
  };

  const handleStart = () => {
    if (!alunoNome || !grupo) return;
    localStorage.setItem('aluno_nome', alunoNome);
    localStorage.setItem('aluno_grupo', grupo);
    setStarted(true);
  };

  const fetchExercise = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;

      if (data && data.alternativas) {
        // Only shuffle if it's multiple choice, keep others as specified
        const ex = data;
        if (ex.tipo === 'escolha') {
          ex.alternativas = [...ex.alternativas].sort(() => Math.random() - 0.5);
        }
        setExercise(ex);
      }
    } catch (err) {
      console.error('Error fetching exercise:', err);
    }
  };

  const handleListen = () => {
    if (!exercise) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(exercise.pergunta);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9; 
    window.speechSynthesis.speak(utterance);
  };

  const handleSelect = (alt) => {
    if (submitted) return;
    setSelected(alt);
  };

  const handleAddSyllable = (syl) => {
    if (submitted) return;
    setBuiltWord([...builtWord, syl]);
  };

  const handleSubmit = async () => {
    let currentAnswer = selected;
    
    // For syllable building, join the pieces
    if (exercise.tipo === 'silabas') {
      currentAnswer = builtWord.join('');
    }

    if (!currentAnswer && exercise.tipo !== 'silabas') return;

    const correct = exercise.tipo === 'pdf' ? (currentAnswer && currentAnswer.trim().length > 0) : (currentAnswer?.toLowerCase() === exercise.resposta_correta?.toLowerCase());
    setIsCorrect(correct);
    setSubmitted(true);

    if (correct) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#51CF66', '#FCC419', '#4ECDC4', '#FF6B6B']
      });
    }

    try {
      const { error } = await supabase
        .from('answers')
        .insert([{
          exercicio_id: exercise.id,
          resposta: currentAnswer || '',
          correto: correct,
          aluno_nome: alunoNome || 'Herói Misterioso',
          grupo: grupo || 'Nenhum'
        }]);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error saving answer:', err);
    }
  };

  if (!exercise) {
    return <div style={{ textAlign: 'center', marginTop: '5rem', fontSize: '2rem' }}>Carregando Missão... 🚀</div>;
  }

  if (!started) {
    return (
      <div className="student-container">
        <div className="card student-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <Star size={70} color="#FFD43B" fill="#FFD43B" style={{ margin: '0 auto', marginBottom: '1rem' }} />
          <h1 className="title" style={{ fontSize: '1.8rem' }}>Partiu Gincana? 🏆</h1>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Qual o seu grupo?</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
              <button 
                className={`btn ${grupo === 'Grupo A' ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ flex: 1, padding: '1.5rem', minWidth: '150px' }}
                onClick={() => setGrupo('Grupo A')}
              >
                {groupNames['Grupo A']}
              </button>
              <button 
                className={`btn ${grupo === 'Grupo B' ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ flex: 1, padding: '1.5rem', minWidth: '150px', background: grupo === 'Grupo B' ? '#e03131' : '#f8f9fa' }}
                onClick={() => setGrupo('Grupo B')}
              >
                {groupNames['Grupo B']}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label className="form-label">Qual seu nome?</label>
            <input
              className="form-input"
              style={{ textAlign: 'center', fontSize: '1.2rem' }}
              placeholder="Digite aqui..."
              value={alunoNome}
              onChange={(e) => setAlunoNome(e.target.value)}
            />
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1.5rem', fontSize: '1.5rem' }} 
            onClick={handleStart}
            disabled={!grupo || !alunoNome}
          >
            Vamos lá! 🦁🔥
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-container">
      <div className="card student-card" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-15px', right: '20px', background: '#339af0', color: 'white', padding: '5px 15px', borderRadius: '15px', fontWeight: 'bold' }}>
          {groupNames[grupo] || grupo} ⚔️
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <span className="pill" style={{ background: '#339af0', fontSize: '1.1rem', padding: '0.4rem 1.2rem' }}>{exercise.categoria}</span>
        </div>

        {exercise.image_url && exercise.tipo !== 'pdf' && (
          <div className="exercise-media-container" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <img 
              src={exercise.image_url} 
              alt="Referência" 
              style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '15px', border: '5px solid #f8f9fa' }} 
            />
          </div>
        )}

        {exercise.tipo === 'pdf' && (
          <div className="pdf-container" style={{ textAlign: 'center', marginBottom: '1rem' }}>
             <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '15px', border: '2px solid #dee2e6', marginBottom: '1rem' }}>
                <p style={{ fontWeight: 'bold', color: '#1c7ed6', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <FileText size={20} /> Visualize a atividade abaixo:
                </p>
                <div style={{ position: 'relative', width: '100%', height: '400px', background: '#e9ecef', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <iframe 
                    src={exercise.image_url} 
                    title={exercise.pergunta}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '10px', border: 'none', zIndex: 1 }}
                  />
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <p style={{ color: '#868e96', fontSize: '0.9rem' }}>Se o arquivo não carregar sozinho:</p>
                    <a href={exercise.image_url} target="_blank" rel="noreferrer" className="btn" style={{ background: '#339af0', color: 'white', textDecoration: 'none', marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <ExternalLink size={18} /> ABRIR PDF AGORA
                    </a>
                  </div>
                </div>
             </div>
             
             <div className="form-group" style={{ textAlign: 'left', marginTop: '1.5rem', background: '#e7f5ff', padding: '1.5rem', borderRadius: '15px', border: '2px solid #339af0' }}>
                <label className="form-label" style={{ fontSize: '1.2rem', color: '#1864ab', fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>✏️ ESCREVA SUA RESPOSTA AQUI:</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="O que você descobriu?"
                  style={{ fontSize: '1.6rem', padding: '1.2rem', textAlign: 'center', border: '3px solid #339af0' }}
                  value={selected || ''}
                  onChange={(e) => setSelected(e.target.value)}
                  disabled={submitted}
                />
             </div>
          </div>
        )}

        <h1 className="question-text" style={{ fontSize: (exercise.image_url || exercise.tipo === 'pdf') ? '1.8rem' : '2.4rem' }}>
          {exercise.tipo === 'completar' ? exercise.pergunta.replace('__', ' ___ ') : exercise.pergunta}
        </h1>
        
        {exercise.tipo !== 'pdf' && (
          <button className="listen-btn" onClick={handleListen} style={{ width: '60px', height: '60px', margin: '0 auto 1.5rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Volume2 size={32} />
          </button>
        )}

        {exercise.tipo === 'silabas' && (
          <div className="display-built-word" style={{ fontSize: '2.5rem', minHeight: '60px', border: '4px dashed #dee2e6', borderRadius: '15px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 'bold', color: '#1c7ed6' }}>
            {builtWord.join('-')}
            {!submitted && builtWord.length > 0 && <span onClick={() => setBuiltWord(builtWord.slice(0, -1))} style={{ cursor: 'pointer', marginLeft: '10px', color: '#fa5252' }}>×</span>}
          </div>
        )}

        {exercise.tipo !== 'pdf' && (
          <div className={exercise.tipo === 'silabas' ? "syllables-grid" : "options-grid"}>
            {exercise.alternativas.map((alt, i) => {
              let className = exercise.tipo === 'silabas' ? "syllable-btn" : "option-btn";
              
              if (submitted) {
                if (exercise.tipo === 'silabas') {
                  className += " disabled";
                } else {
                  if (alt === exercise.resposta_correta) className += " correct";
                  else if (alt === selected) className += " wrong";
                }
              } else if (alt === selected) {
                className += " selected";
              }

              return (
                <button
                  key={i}
                  className={className}
                  onClick={() => exercise.tipo === 'silabas' ? handleAddSyllable(alt) : handleSelect(alt)}
                  disabled={submitted}
                  style={exercise.tipo === 'silabas' ? { fontSize: '1.5rem', padding: '1.2rem', background: '#f1f3f5', border: '2px solid #ced4da', borderRadius: '12px' } : {}}
                >
                  {alt}
                </button>
              );
            })}
          </div>
        )}

        {!submitted && (
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', fontSize: '1.8rem', padding: '1.5rem', marginTop: '1.5rem' }}
            onClick={handleSubmit}
            disabled={exercise.tipo === 'silabas' ? builtWord.length === 0 : !selected}
          >
            <Send size={30} style={{ marginRight: '10px' }} /> RESPONDER E GANHAR PONTO
          </button>
        )}
      </div>

      {submitted && (
        <div className="feedback-overlay">
          <div className="feedback-card">
            {isCorrect || exercise.tipo === 'pdf' ? (
              <>
                <Smile size={100} color="#51CF66" className="feedback-icon" />
                <h1 className="feedback-title" style={{ color: '#2b8a3e' }}>{exercise.tipo === 'pdf' ? 'Bom estudo!' : 'TEMA GANHA PONTO!'} 🎉</h1>
                <p style={{ fontSize: '1.5rem' }}>{exercise.tipo === 'pdf' ? 'Você completou a leitura!' : `+1 para o ${grupo}! Show de bola!`}</p>
                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '1rem' }}>
                  {[1,2,3].map(s => <Star key={s} fill="#FCC419" color="#FCC419" size={30} strokeWidth={3} />)}
                </div>
              </>
            ) : (
              <>
                <Frown size={100} color="#FF6B6B" className="feedback-icon" />
                <h1 className="feedback-title" style={{ color: '#e03131' }}>Quase lá!</h1>
                <p style={{ fontSize: '1.4rem' }}>A resposta era: <strong>{exercise.resposta_correta}</strong></p>
                <p style={{ marginTop: '1rem', color: '#868e96' }}>Não desanime, {grupo}! Na próxima vocês arrasam! 💪</p>
              </>
            )}
            
            <button className="btn btn-secondary" style={{ marginTop: '2rem', width: '100%', fontSize: '1.5rem' }} onClick={() => window.location.reload()}>
              <Check size={24} style={{ marginRight: '10px' }} /> PRÓXIMO QR CODE
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        .syllables-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 1rem; }
        .disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

export default StudentView;
