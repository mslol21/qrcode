import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { Volume2, Smile, Frown, Check, Send } from 'lucide-react';

const API_URL = '/api';

function StudentView() {
  const { id } = useParams();
  const [exercise, setExercise] = useState(null);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [alunoNome, setAlunoNome] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    fetchExercise();
  }, [id]);

  const fetchExercise = async () => {
    try {
      const res = await axios.get(`${API_URL}/exercises/${id}`);
      // Shuffle alternatives for fun
      const ex = res.data;
      ex.alternativas = [...ex.alternativas].sort(() => Math.random() - 0.5);
      setExercise(ex);
    } catch (err) {
      console.error(err);
    }
  };

  const handleListen = () => {
    if (!exercise) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(exercise.pergunta);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9; // slightly slower for kids
    utterance.pitch = 1.1; // slightly higher pitch

    window.speechSynthesis.speak(utterance);
  };

  const handleSelect = (alt) => {
    if (submitted) return;
    setSelected(alt);
  };

  const handleSubmit = async () => {
    if (!selected) return;

    const correct = selected === exercise.resposta_correta;
    setIsCorrect(correct);
    setSubmitted(true);

    if (correct) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#51CF66', '#FCC419', '#4ECDC4', '#FF6B6B']
      });
    } else {
      // Small vibration maybe?
      if (navigator.vibrate) navigator.vibrate(200);
    }

    try {
      await axios.post(`${API_URL}/answers`, {
        exercicio_id: exercise._id,
        resposta: selected,
        correto: correct,
        aluno_nome: alunoNome || 'Herói Misterioso'
      });
    } catch (err) {
      console.error('Error saving answer:', err);
    }
  };

  if (!exercise) {
    return <div style={{ textAlign: 'center', marginTop: '5rem', fontSize: '2rem' }}>Carregando... 🚀</div>;
  }

  if (!started) {
    return (
      <div className="student-container">
        <div className="card student-card" style={{ maxWidth: '400px' }}>
          <Smile size={80} color="#FF6B6B" style={{ margin: '0 auto', marginBottom: '1rem', display: 'block' }} />
          <h1 className="title">Quem é você?</h1>
          <input
            className="form-input"
            style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '1.5rem' }}
            placeholder="Seu nome"
            value={alunoNome}
            onChange={(e) => setAlunoNome(e.target.value)}
          />
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setStarted(true)}>
            Começar! 🎮
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-container">
      <div className="card student-card">
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span className="pill" style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}>{exercise.categoria}</span>
        </div>

        <h1 className="question-text">{exercise.pergunta}</h1>
        
        <button className="listen-btn" onClick={handleListen} title="Ouvir Pergunta">
          <Volume2 size={40} />
        </button>

        <div className="options-grid">
          {exercise.alternativas.map((alt, i) => {
            let className = "option-btn";
            if (submitted) {
              if (alt === exercise.resposta_correta) className += " correct";
              else if (alt === selected) className += " wrong";
            } else if (alt === selected) {
              className += " selected";
            }

            return (
              <button
                key={i}
                className={className}
                onClick={() => handleSelect(alt)}
                disabled={submitted}
              >
                {alt}
              </button>
            );
          })}
        </div>

        {!submitted && (
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', fontSize: '1.8rem', padding: '1.2rem' }}
            onClick={handleSubmit}
            disabled={!selected}
          >
            <Send size={30} style={{ marginRight: '10px' }} /> RESPONDER
          </button>
        )}

      </div>

      {submitted && (
        <div className="feedback-overlay">
          <div className="feedback-card">
            {isCorrect ? (
              <>
                <Smile size={100} color="#51CF66" style={{ margin: '0 auto' }} className="feedback-icon" />
                <h1 className="feedback-title" style={{ color: '#2b8a3e' }}>Uau, PARABÉNS!</h1>
                <p style={{ fontSize: '1.5rem', color: '#495057' }}>Você acertou! 🎉</p>
                <p style={{ fontSize: '1.2rem', color: '#868e96', marginTop: '1rem' }}>Resposta: {exercise.resposta_correta}</p>
              </>
            ) : (
              <>
                <Frown size={100} color="#FF6B6B" style={{ margin: '0 auto' }} className="feedback-icon" />
                <h1 className="feedback-title" style={{ color: '#e03131' }}>Quase lá!</h1>
                <p style={{ fontSize: '1.5rem', color: '#495057' }}>A resposta certa era:</p>
                <p style={{ fontSize: '2rem', color: '#51CF66', fontWeight: 'bold', margin: '1rem 0' }}>{exercise.resposta_correta}</p>
                <p style={{ fontSize: '1.2rem', color: '#868e96' }}>Não desista, tente de novo numa próxima! 💪</p>
              </>
            )}
            
            <button 
              className="btn btn-secondary" 
              style={{ marginTop: '2rem', width: '100%', fontSize: '1.5rem' }}
              onClick={() => window.location.reload()}
            >
              <Check size={24} style={{ marginRight: '10px' }} /> TENTAR OUTRA VEZ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentView;
