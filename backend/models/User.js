const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  grade: { type: String, required: true },
  profilePicture: { type: String, default: '' },
  totalPoints: { type: Number, default: 0 },
      badges: [{
    name: { type: String },
    type: { type: String }, // gold, silver, bronze, special
    earnedAt: { type: Date, default: Date.now },
    description: { type: String }
  }],
  completedModules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
  moduleProgress: [{
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    progress: { type: Number, default: 0 }, // percentage
    lastAccessed: { type: Date, default: Date.now }
  }],
  quizResults: [{
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    score: Number,
    totalQuestions: Number,
    completedAt: { type: Date, default: Date.now },
    timeSpent: Number // in seconds
  }],
  settings: {
    dailyReminders: { type: Boolean, default: true },
    soundEffects: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
