const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamified-learning';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
}).then(async () => {
  console.log('✅ Connected to MongoDB');
  
  // Import models
  const User = require('./models/User');
  const Quiz = require('./models/Quiz');
  const Module = require('./models/Module');
  const Leaderboard = require('./models/Leaderboard');
  const Category = require('./models/Category');
  
  try {
    // Create a test user if none exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        grade: 'Grade 6',
        totalPoints: 0,
        badges: [],
        completedModules: [],
        moduleProgress: [],
        quizResults: [],
        settings: {
          dailyReminders: true,
          soundEffects: true,
          darkMode: true
        }
      });
      
      await testUser.save();
      console.log('✅ Test user created');
      
      // Create leaderboard entry
      const leaderboardEntry = new Leaderboard({
        userId: testUser._id,
        grade: testUser.grade,
        totalPoints: 0,
        badgeCount: 0,
        weeklyPoints: 0,
        monthlyPoints: 0
      });
      
      await leaderboardEntry.save();
      console.log('✅ Leaderboard entry created');
    } else {
      console.log('✅ Test user already exists');
    }
    
    // Create a sample quiz if none exists
    const existingQuiz = await Quiz.findOne({ title: 'Sample Mathematics Quiz' });
    if (!existingQuiz) {
      const sampleQuiz = new Quiz({
        title: 'Sample Mathematics Quiz',
        description: 'A sample quiz for testing',
        subject: 'Mathematics',
        grade: 'Grade 6',
        difficulty: 'easy',
        timeLimit: 10,
        questions: [
          {
            question: 'What is 2 + 2?',
            type: 'multiple-choice',
            options: ['3', '4', '5', '6'],
            correctAnswer: '4',
            explanation: '2 + 2 = 4',
            points: 1
          },
          {
            question: 'What is 5 × 3?',
            type: 'multiple-choice',
            options: ['12', '15', '18', '20'],
            correctAnswer: '15',
            explanation: '5 × 3 = 15',
            points: 1
          }
        ],
        isActive: true
      });
      
      await sampleQuiz.save();
      console.log('✅ Sample quiz created');
    } else {
      console.log('✅ Sample quiz already exists');
    }
    
    console.log('🎉 Database setup completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
  
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  console.log('💡 Please ensure MongoDB is running');
  process.exit(1);
});
