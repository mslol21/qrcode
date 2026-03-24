require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// For MVP, we use a local MongoDB connection if URI is not provided
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/qrlearning';

mongoose.connect(MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

const exerciseRouter = require('./routes/exercises');
const answerRouter = require('./routes/answers');

app.use('/api/exercises', exerciseRouter);
app.use('/api/answers', answerRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
