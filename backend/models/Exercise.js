const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  pergunta: { type: String, required: true },
  alternativas: [{ type: String, required: true }],
  resposta_correta: { type: String, required: true },
  categoria: { type: String, required: true },
  nivel: { type: String, enum: ['fácil', 'médio', 'difícil'], required: true },
  qr_code: { type: String } // Contains the data URL for the generated QR code
});

module.exports = mongoose.model('Exercise', exerciseSchema);
