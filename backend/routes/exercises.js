const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');
const QRCode = require('qrcode');
const os = require('os');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Get all exercises
router.get('/', async (req, res) => {
  try {
    const exercises = await Exercise.find();
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a specific exercise
router.get('/:id', async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    res.json(exercise);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create an exercise
router.post('/', async (req, res) => {
  const { pergunta, alternativas, resposta_correta, categoria, nivel } = req.body;
  
  const exercise = new Exercise({
    pergunta,
    alternativas,
    resposta_correta,
    categoria,
    nivel
  });

  try {
    const newExercise = await exercise.save();
    
    // Generate QR code for the specific exercise URL
    // Assume frontend will run on port 5173 or similar, in prod we would use an environment var
    const ip = getLocalIp();
    const frontendUrl = process.env.FRONTEND_URL || `http://${ip}:5173`;
    const qrUrl = `${frontendUrl}/qr/${newExercise._id}`;
    
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl);
    newExercise.qr_code = qrCodeDataUrl;
    
    await newExercise.save();
    
    res.status(201).json(newExercise);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete an exercise
router.delete('/:id', async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    await Exercise.findByIdAndDelete(req.params.id);
    res.json({ message: 'Exercise deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
