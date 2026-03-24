const express = require('express');
const router = express.Router();
const Answer = require('../models/Answer');

// Get all answers for a specific exercise
router.get('/:exerciseId', async (req, res) => {
  try {
    const answers = await Answer.find({ exercicio_id: req.params.exerciseId }).sort({ timestamp: -1 });
    res.json(answers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit a new answer
router.post('/', async (req, res) => {
  const { exercicio_id, resposta, correto, aluno_nome } = req.body;
  
  const answer = new Answer({
    exercicio_id,
    resposta,
    correto,
    aluno_nome
  });

  try {
    const newAnswer = await answer.save();
    res.status(201).json(newAnswer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
