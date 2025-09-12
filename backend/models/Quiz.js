const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
  subject: { type: String, required: true },
  grade: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  timeLimit: { type: Number, required: true }, // in minutes
  questions: [{
    question: { type: String, required: true },
    type: { type: String, enum: ['multiple-choice', 'true-false', 'short-answer'], default: 'multiple-choice' },
    options: [String],
    correctAnswer: { type: String, required: true },
    explanation: String,
    points: { type: Number, default: 1 }
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
