// scripts/seedNewQuizzes.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected for seeding...');
  seedQuizzes();
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

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

const seedQuizzes = async () => {
  try {
    const jsonPath = path.join(__dirname, 'quizData.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const quizData = JSON.parse(jsonData);

    if (quizData.quizzes && quizData.quizzes.length > 0) {
      await Quiz.deleteMany({}); // Clear existing quizzes
      await Quiz.insertMany(quizData.quizzes);
      console.log(`${quizData.quizzes.length} quizzes have been successfully seeded!`)
    } else {
      console.log('No quizzes found in quizData.json');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding quiz data:', error);
    process.exit(1);
  }
};