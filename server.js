const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/transcripts', require('./routes/transcripts'));
app.use('/api/jobs', require('./routes/jobs'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'InsightBoard API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
