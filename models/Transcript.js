const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dependencies: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['ready', 'blocked', 'error', 'completed'],
    default: 'ready'
  },
  errorMessage: String
});

const TranscriptSchema = new mongoose.Schema({
  transcriptId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  originalTranscript: {
    type: String,
    required: true
  },
  transcriptHash: {
    type: String,
    required: true,
    index: true
  },
  tasks: [TaskSchema],
  hasCycles: {
    type: Boolean,
    default: false
  },
  cycleDetails: [String],
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  errorMessage: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

module.exports = mongoose.model('Transcript', TranscriptSchema);
