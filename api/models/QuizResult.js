const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  quizId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quiz', 
    required: true 
  },
  grade: { 
    type: String, 
    required: true 
  },
  subject: { 
    type: String, 
    required: true 
  },
  score: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100
  },
  totalQuestions: { 
    type: Number, 
    required: true 
  },
  correctAnswers: { 
    type: Number, 
    required: true 
  },
  timeSpent: { 
    type: Number, 
    required: true // in seconds
  },
  pointsAwarded: { 
    type: Number, 
    required: true 
  },
  detailedResults: [{
    question: String,
    userAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean,
    explanation: String,
    points: Number
  }],
  completedAt: { 
    type: Date, 
    default: Date.now 
  },
  attemptNumber: { 
    type: Number, 
    default: 1 
  }
});

// Index for efficient queries
quizResultSchema.index({ userId: 1, quizId: 1 });
quizResultSchema.index({ grade: 1, score: -1 });
quizResultSchema.index({ userId: 1, grade: 1 });

const QuizResult = mongoose.model('QuizResult', quizResultSchema);

module.exports = QuizResult;
