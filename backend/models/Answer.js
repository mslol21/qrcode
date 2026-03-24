const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  exercicio_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  resposta: { type: String, required: true },
  correto: { type: Boolean, required: true },
  aluno_nome: { type: String, default: 'Anônimo' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Answer', answerSchema);
