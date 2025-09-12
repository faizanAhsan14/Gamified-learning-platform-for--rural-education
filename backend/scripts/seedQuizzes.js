const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://isurajpanda_db_user:7Lz0FjUP3dr1GnMz@cluster0.yxm40fv.mongodb.net/newGame', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define schemas (must match server.js)
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
    // Clear existing quizzes
    await Quiz.deleteMany({});
    console.log('Existing quizzes cleared.');

    // Read quizData.json
    const quizDataPath = path.join(__dirname, 'quizData.json');
    const quizData = JSON.parse(fs.readFileSync(quizDataPath, 'utf-8'));

    const quizzesToInsert = quizData.quizzes.map(quiz => ({
      ...quiz,
      // Ensure the 'type' field is set for each question if it's missing
      questions: quiz.questions.map(q => ({
        ...q,
        type: q.type || 'multiple-choice',
        points: q.points || 1
      }))
    }));

    // Insert new quizzes
    await Quiz.insertMany(quizzesToInsert);

    console.log(`${quizData.quizzes.length} quizzes have been successfully seeded.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding quiz data:', error);
    process.exit(1);
  }
};

seedQuizzes();
