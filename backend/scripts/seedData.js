

// scripts/seedData.js - Sample data seeding script
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://isurajpanda_db_user:7Lz0FjUP3dr1GnMz@cluster0.yxm40fv.mongodb.net/newGame', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define schemas (copy from server.js)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  grade: { type: String, required: true },
  profilePicture: { type: String, default: '' },
  totalPoints: { type: Number, default: 0 },
        badges: [{
    name: { type: String },
    type: { type: String },
    earnedAt: { type: Date, default: Date.now },
    description: { type: String }
  }],
  completedModules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
  moduleProgress: [{
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    progress: { type: Number, default: 0 },
    lastAccessed: { type: Date, default: Date.now }
  }],
  quizResults: [{
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    score: Number,
    totalQuestions: Number,
    completedAt: { type: Date, default: Date.now },
    timeSpent: Number
  }],
  settings: {
    dailyReminders: { type: Boolean, default: true },
    soundEffects: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  subject: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  estimatedTime: { type: Number, required: true },
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
  content: [{
    type: { type: String, enum: ['text', 'video', 'interactive', 'simulation'] },
    title: String,
    content: String,
    duration: Number
  }],
  learningObjectives: [String],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
  subject: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  timeLimit: { type: Number, required: true },
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

const leaderboardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grade: { type: String, required: true },
  totalPoints: { type: Number, required: true },
  badgeCount: { type: Number, required: true },
  weeklyPoints: { type: Number, default: 0 },
  monthlyPoints: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Module = mongoose.model('Module', moduleSchema);
const Quiz = mongoose.model('Quiz', quizSchema);
const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Module.deleteMany({});
    await Quiz.deleteMany({});
    await Leaderboard.deleteMany({});

    console.log('Creating sample modules...');

    // Create sample modules
    const biologyModule = await Module.create({
      title: 'Biology: The Cell',
      description: 'Explore the building blocks of life through interactive simulations and discover cellular mysteries.',
      subject: 'biology',
      difficulty: 'medium',
      estimatedTime: 45,
      prerequisites: [],
      content: [
        {
          type: 'text',
          title: 'Introduction to Cells',
          content: '<h2>What is a Cell?</h2><p>Cells are the basic structural and functional units of all living organisms...</p>',
          duration: 10
        },
        {
          type: 'interactive',
          title: 'Cell Structure Explorer',
          content: 'Interactive 3D cell model',
          duration: 20
        },
        {
          type: 'video',
          title: 'Cell Division Process',
          content: 'https://example.com/cell-division-video',
          duration: 15
        }
      ],
      learningObjectives: [
        'Identify the main components of a cell',
        'Understand the function of each cellular organelle',
        'Explain the process of cell division'
      ]
    });

    const pythonModule = await Module.create({
      title: 'Intro to Python',
      description: 'Learn the basics of programming with fun coding challenges and build your first programs.',
      subject: 'programming',
      difficulty: 'easy',
      estimatedTime: 60,
      prerequisites: [],
      content: [
        {
          type: 'text',
          title: 'Python Basics',
          content: '<h2>Getting Started with Python</h2><p>Python is a versatile programming language...</p>',
          duration: 15
        },
        {
          type: 'interactive',
          title: 'Code Editor',
          content: 'Interactive Python coding environment',
          duration: 30
        },
        {
          type: 'text',
          title: 'Variables and Data Types',
          content: '<h2>Understanding Variables</h2><p>Variables are containers for storing data...</p>',
          duration: 15
        }
      ],
      learningObjectives: [
        'Write basic Python syntax',
        'Understand variables and data types',
        'Create simple programs'
      ]
    });

    const algebraModule = await Module.create({
      title: 'Algebraic Adventures',
      description: 'Solve mythical quests using the power of equations and unlock mathematical secrets.',
      subject: 'mathematics',
      difficulty: 'medium',
      estimatedTime: 50,
      prerequisites: [pythonModule._id],
      content: [
        {
          type: 'text',
          title: 'Introduction to Algebra',
          content: '<h2>The Language of Mathematics</h2><p>Algebra uses symbols to represent numbers...</p>',
          duration: 15
        },
        {
          type: 'interactive',
          title: 'Equation Solver',
          content: 'Interactive equation solving game',
          duration: 25
        },
        {
          type: 'text',
          title: 'Linear Equations',
          content: '<h2>Solving Linear Equations</h2><p>Linear equations form straight lines when graphed...</p>',
          duration: 10
        }
      ],
      learningObjectives: [
        'Solve basic algebraic equations',
        'Understand the concept of variables',
        'Apply algebra to real-world problems'
      ]
    });

    console.log('Creating sample quizzes...');

    // Create sample quizzes
    const chemistryQuiz = await Quiz.create({
      title: 'Chemistry Challenge',
      description: 'Test your understanding of basic chemistry concepts',
      moduleId: null,
      subject: 'chemistry',
      difficulty: 'medium',
      timeLimit: 15,
      questions: [
        {
          question: 'What is the chemical symbol for water?',
          type: 'multiple-choice',
          options: ['H2O', 'CO2', 'NaCl', 'C6H12O6'],
          correctAnswer: 'H2O',
          explanation: 'Water consists of two hydrogen atoms and one oxygen atom, hence H2O.',
          points: 1
        },
        {
          question: 'What is the atomic number of carbon?',
          type: 'multiple-choice',
          options: ['6', '12', '14', '8'],
          correctAnswer: '6',
          explanation: 'Carbon has 6 protons in its nucleus, giving it an atomic number of 6.',
          points: 1
        },
        {
          question: 'Acids have a pH less than 7.',
          type: 'true-false',
          options: ['True', 'False'],
          correctAnswer: 'True',
          explanation: 'The pH scale ranges from 0-14, with values less than 7 being acidic.',
          points: 1
        }
      ]
    });

    const geometryQuiz = await Quiz.create({
      title: 'Geometry Basics',
      description: 'Master fundamental geometric principles',
      moduleId: null,
      subject: 'mathematics',
      difficulty: 'easy',
      timeLimit: 20,
      questions: [
        {
          question: 'What is the sum of angles in a triangle?',
          type: 'multiple-choice',
          options: ['90°', '180°', '270°', '360°'],
          correctAnswer: '180°',
          explanation: 'The sum of all interior angles in any triangle is always 180 degrees.',
          points: 1
        },
        {
          question: 'A square has how many sides?',
          type: 'multiple-choice',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          explanation: 'A square is a quadrilateral with four equal sides and four right angles.',
          points: 1
        }
      ]
    });

    const pythonQuiz = await Quiz.create({
      title: 'Python Fundamentals',
      description: 'Test your programming knowledge',
      moduleId: pythonModule._id,
      subject: 'programming',
      difficulty: 'easy',
      timeLimit: 18,
      questions: [
        {
          question: 'Which symbol is used for comments in Python?',
          type: 'multiple-choice',
          options: ['//', '#', '/*', '--'],
          correctAnswer: '#',
          explanation: 'In Python, the # symbol is used to create single-line comments.',
          points: 1
        },
        {
          question: 'Python is case-sensitive.',
          type: 'true-false',
          options: ['True', 'False'],
          correctAnswer: 'True',
          explanation: 'Python distinguishes between uppercase and lowercase letters in variable names and keywords.',
          points: 1
        }
      ]
    });

    const biologyQuiz = await Quiz.create({
      title: 'Biology: Cell Structure',
      description: 'Explore cellular components and functions',
      moduleId: biologyModule._id,
      subject: 'biology',
      difficulty: 'medium',
      timeLimit: 25,
      questions: [
        {
          question: 'What is the powerhouse of the cell?',
          type: 'multiple-choice',
          options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Endoplasmic Reticulum'],
          correctAnswer: 'Mitochondria',
          explanation: 'Mitochondria produce ATP, the energy currency of cells, earning them the nickname "powerhouse of the cell".',
          points: 1
        },
        {
          question: 'Plant cells have cell walls.',
          type: 'true-false',
          options: ['True', 'False'],
          correctAnswer: 'True',
          explanation: 'Plant cells have rigid cell walls made of cellulose that provide structure and protection.',
          points: 1
        }
      ]
    });

    console.log('Creating sample users...');

    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 12);

    const sophia = await User.create({
      name: 'Sophia',
      email: 'sophia@example.com',
      password: hashedPassword,
      grade: 'Grade 10',
      totalPoints: 1250,
      badges: [
        {
          name: 'Biology Pro',
          type: 'gold',
          description: 'Completed all biology modules with 90%+ scores',
          earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        },
        {
          name: 'Algebra Ace',
          type: 'silver',
          description: 'Solved 50+ algebraic problems',
          earnedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
        },
        {
          name: 'Coding Starter',
          type: 'bronze',
          description: 'Completed first programming module',
          earnedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000) // 21 days ago
        },
        {
          name: 'Quiz Master',
          type: 'special',
          description: 'Perfect scores on 5 consecutive quizzes',
          earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        }
      ],
      completedModules: [biologyModule._id],
      moduleProgress: [
        {
          moduleId: biologyModule._id,
          progress: 100,
          lastAccessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          moduleId: pythonModule._id,
          progress: 60,
          lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      ],
      quizResults: [
        {
          quizId: biologyQuiz._id,
          score: 92,
          totalQuestions: 2,
          timeSpent: 420, // 7 minutes
          completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        {
          quizId: geometryQuiz._id,
          score: 85,
          totalQuestions: 2,
          timeSpent: 360, // 6 minutes
          completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
        }
      ]
    });

    // Create additional sample users for leaderboard
    const alex = await User.create({
      name: 'Alex Johnson',
      email: 'alex@example.com',
      password: hashedPassword,
      grade: 'Grade 10',
      totalPoints: 1180,
      badges: [
        {
          name: 'Coding Starter',
          type: 'bronze',
          description: 'Completed first programming module'
        },
        {
          name: 'Algebra Ace',
          type: 'silver',
          description: 'Solved 50+ algebraic problems'
        },
        {
          name: 'Biology Pro',
          type: 'gold',
          description: 'Completed all biology modules with 90%+ scores'
        }
      ]
    });

    const emma = await User.create({
      name: 'Emma Wilson',
      email: 'emma@example.com',
      password: hashedPassword,
      grade: 'Grade 10',
      totalPoints: 1150,
      badges: [
        {
          name: 'Coding Starter',
          type: 'bronze',
          description: 'Completed first programming module'
        },
        {
          name: 'Quiz Master',
          type: 'special',
          description: 'Perfect scores on 5 consecutive quizzes'
        },
        {
          name: 'Algebra Ace',
          type: 'silver',
          description: 'Solved 50+ algebraic problems'
        }
      ]
    });

    const michael = await User.create({
      name: 'Michael Chen',
      email: 'michael@example.com',
      password: hashedPassword,
      grade: 'Grade 10',
      totalPoints: 1050,
      badges: [
        {
          name: 'Coding Starter',
          type: 'bronze',
          description: 'Completed first programming module'
        },
        {
          name: 'Algebra Ace',
          type: 'silver',
          description: 'Solved 50+ algebraic problems'
        }
      ]
    });

    const sarah = await User.create({
      name: 'Sarah Davis',
      email: 'sarah@example.com',
      password: hashedPassword,
      grade: 'Grade 10',
      totalPoints: 980,
      badges: [
        {
          name: 'Coding Starter',
          type: 'bronze',
          description: 'Completed first programming module'
        },
        {
          name: 'Biology Pro',
          type: 'gold',
          description: 'Completed all biology modules with 90%+ scores'
        }
      ]
    });

    console.log('Creating leaderboard entries...');

    // Create leaderboard entries
    await Leaderboard.create([
      {
        userId: sophia._id,
        grade: 'Grade 10',
        totalPoints: sophia.totalPoints,
        badgeCount: sophia.badges.length
      },
      {
        userId: alex._id,
        grade: 'Grade 10',
        totalPoints: alex.totalPoints,
        badgeCount: alex.badges.length
      },
      {
        userId: emma._id,
        grade: 'Grade 10',
        totalPoints: emma.totalPoints,
        badgeCount: emma.badges.length
      },
      {
        userId: michael._id,
        grade: 'Grade 10',
        totalPoints: michael.totalPoints,
        badgeCount: michael.badges.length
      },
      {
        userId: sarah._id,
        grade: 'Grade 10',
        totalPoints: sarah.totalPoints,
        badgeCount: sarah.badges.length
      }
    ]);

    console.log('Sample data created successfully!');
    console.log('Test user credentials:');
    console.log('Email: sophia@example.com');
    console.log('Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();