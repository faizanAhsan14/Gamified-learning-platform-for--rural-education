const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  subject: { type: String, required: true }, // biology, python, algebra, etc.
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  estimatedTime: { type: Number, required: true }, // in minutes
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
  content: [{
    type: { type: String, enum: ['text', 'video', 'interactive', 'simulation'] },
    title: String,
    content: String, // HTML content or URL
    duration: Number // in minutes
  }],
  learningObjectives: [String],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Module = mongoose.model('Module', moduleSchema);

module.exports = Module;
