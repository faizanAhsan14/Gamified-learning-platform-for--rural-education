const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://isurajpanda_db_user:7Lz0FjUP3dr1GnMz@cluster0.yxm40fv.mongodb.net/newGame', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define quiz schema
const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  subject: { type: String, required: true },
  grade: { type: Number, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  timeLimit: { type: Number, default: 10 }, // in minutes
  questions: [{
    question: { type: String, required: true },
    type: { type: String, enum: ['multiple-choice'], default: 'multiple-choice' },
    options: [String],
    correctAnswer: { type: String, required: true },
    explanation: String,
    points: { type: Number, default: 1 }
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Quiz = mongoose.model('Quiz', quizSchema);

// Load quiz data from JSON file
const loadQuizData = () => {
  try {
    const quizDataPath = path.join(__dirname, '../../data/quiz_data.json');
    const quizData = JSON.parse(fs.readFileSync(quizDataPath, 'utf8'));
    return quizData;
  } catch (error) {
    console.error('Error loading quiz data:', error);
    return [];
  }
};

// Convert quiz data format
const convertQuizData = (quizData) => {
  return quizData.map(quiz => ({
    title: quiz.title,
    description: `${quiz.subject} quiz for Grade ${quiz.grade}`,
    subject: quiz.subject,
    grade: quiz.grade,
    difficulty: 'medium',
    timeLimit: 10,
    questions: quiz.questions.map(q => ({
      question: q.question_text,
      type: 'multiple-choice',
      options: q.options,
      correctAnswer: q.options[q.correct_option],
      explanation: `The correct answer is ${q.options[q.correct_option]}`,
      points: 1
    })),
    isActive: true
  }));
};

// Seed quiz data
const seedQuizData = async () => {
  try {
    console.log('Starting quiz data seeding...');
    
    // Clear existing quiz data
    await Quiz.deleteMany({});
    console.log('Cleared existing quiz data');
    
    // Load and convert quiz data
    const rawQuizData = loadQuizData();
    const convertedQuizData = convertQuizData(rawQuizData);
    
    console.log(`Loaded ${convertedQuizData.length} quizzes from JSON file`);
    
    // Insert quiz data
    const insertedQuizzes = await Quiz.insertMany(convertedQuizData);
    console.log(`Successfully inserted ${insertedQuizzes.length} quizzes`);
    
    // Log summary by subject and grade
    const summary = {};
    insertedQuizzes.forEach(quiz => {
      const key = `${quiz.subject} - Grade ${quiz.grade}`;
      if (!summary[key]) {
        summary[key] = 0;
      }
      summary[key]++;
    });
    
    console.log('\nQuiz Summary:');
    Object.entries(summary).forEach(([key, count]) => {
      console.log(`  ${key}: ${count} quiz(es)`);
    });
    
    console.log('\nQuiz data seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding quiz data:', error);
    process.exit(1);
  }
};

// Run the seeding
seedQuizData();
