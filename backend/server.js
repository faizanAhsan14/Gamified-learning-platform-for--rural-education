// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*', // Allow all origins
  credentials: false, // Set to false when using wildcard origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Additional CORS headers for maximum compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://isurajpanda_db_user:7Lz0FjUP3dr1GnMz@cluster0.yxm40fv.mongodb.net/newGame', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Models
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

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
  subject: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  timeLimit: { type: Number, required: true }, // in minutes
  questions: [{
    question: { type: String, required: true },
    type: { type: String, enum: ['multiple-choice', 'true-false', 'short-answer'], default: 'multiple-choice' },
    options: [String], // for multiple choice
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

// Create models
const User = mongoose.model('User', userSchema);
const Module = mongoose.model('Module', moduleSchema);
const Quiz = mongoose.model('Quiz', quizSchema);
const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to calculate overall progress
const calculateOverallProgress = async (userId) => {
  const user = await User.findById(userId).populate('moduleProgress.moduleId');
  if (!user || !user.moduleProgress.length) return 0;
  
  const totalProgress = user.moduleProgress.reduce((sum, progress) => sum + progress.progress, 0);
  return Math.round(totalProgress / user.moduleProgress.length);
};

// Helper function to award badges
const checkAndAwardBadges = async (userId) => {
  const user = await User.findById(userId).populate('completedModules quizResults');
  const newBadges = [];

  // Biology Pro badge - complete biology modules with 90%+ average
  const biologyQuizzes = user.quizResults.filter(quiz => quiz.score >= 90);
  if (biologyQuizzes.length >= 3 && !user.badges.some(b => b.name === 'Biology Pro')) {
    newBadges.push({
      name: 'Biology Pro',
      type: 'gold',
      description: 'Completed all biology modules with 90%+ scores'
    });
  }

  // Quiz Master badge - 5 perfect scores
  const perfectScores = user.quizResults.filter(quiz => quiz.score === 100);
  if (perfectScores.length >= 5 && !user.badges.some(b => b.name === 'Quiz Master')) {
    newBadges.push({
      name: 'Quiz Master',
      type: 'special',
      description: 'Perfect scores on 5 consecutive quizzes'
    });
  }

  // Coding Starter badge - complete first programming module
  const codingModules = user.completedModules.filter(module => 
    module.subject.toLowerCase().includes('python') || module.subject.toLowerCase().includes('programming')
  );
  if (codingModules.length >= 1 && !user.badges.some(b => b.name === 'Coding Starter')) {
    newBadges.push({
      name: 'Coding Starter',
      type: 'bronze',
      description: 'Completed first programming module'
    });
  }

  if (newBadges.length > 0) {
    user.badges.push(...newBadges);
    await user.save();
  }

  return newBadges;
};

// Routes

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, grade } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      grade
    });

    await user.save();

    // Create initial leaderboard entry
    const leaderboard = new Leaderboard({
      userId: user._id,
      grade,
      totalPoints: 0,
      badgeCount: 0
    });
    await leaderboard.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        grade: user.grade
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        grade: user.grade,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Dashboard route
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('moduleProgress.moduleId')
      .populate('completedModules');

    const overallProgress = await calculateOverallProgress(req.user.userId);

    // Get available modules with prerequisites check
    const allModules = await Module.find({ isActive: true });
    const availableModules = [];
    
    for (const module of allModules) {
      const prerequisites = await Module.find({ _id: { $in: module.prerequisites } });
      const prerequisitesMet = prerequisites.every(prereq => 
        user.completedModules.some(completed => completed._id.toString() === prereq._id.toString())
      );
      
      const userProgress = user.moduleProgress.find(p => 
        p.moduleId && p.moduleId._id.toString() === module._id.toString()
      );
      
      availableModules.push({
        ...module.toObject(),
        isUnlocked: prerequisites.length === 0 || prerequisitesMet,
        progress: userProgress ? userProgress.progress : 0,
        isCompleted: user.completedModules.some(completed => 
          completed._id.toString() === module._id.toString()
        )
      });
    }

    // Get recent quiz results
    const recentQuizzes = await Quiz.find({ isActive: true })
      .limit(5)
      .sort({ createdAt: -1 });

    // Format quiz results
    const quizzesWithResults = recentQuizzes.map(quiz => {
      const userResult = user.quizResults.find(result => 
        result.quizId.toString() === quiz._id.toString()
      );
      
      return {
        ...quiz.toObject(),
        isCompleted: !!userResult,
        score: userResult ? userResult.score : null,
        lastAttempt: userResult ? userResult.completedAt : null
      };
    });

    res.json({
      user: {
        name: user.name,
        grade: user.grade,
        profilePicture: user.profilePicture,
        totalPoints: user.totalPoints
      },
      overallProgress,
      modules: availableModules.slice(0, 3), // Featured modules
      quizzes: quizzesWithResults.slice(0, 2), // Recent quizzes
      badges: user.badges.slice(-3), // Recent badges
      totalBadges: user.badges.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Modules routes
app.get('/api/modules', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('completedModules');
    const modules = await Module.find({ isActive: true });

    const modulesWithStatus = [];
    for (const module of modules) {
      const prerequisites = await Module.find({ _id: { $in: module.prerequisites } });
      const prerequisitesMet = prerequisites.every(prereq => 
        user.completedModules.some(completed => completed._id.toString() === prereq._id.toString())
      );
      
      const userProgress = user.moduleProgress.find(p => 
        p.moduleId && p.moduleId._id.toString() === module._id.toString()
      );

      modulesWithStatus.push({
        ...module.toObject(),
        isUnlocked: prerequisites.length === 0 || prerequisitesMet,
        progress: userProgress ? userProgress.progress : 0,
        isCompleted: user.completedModules.some(completed => 
          completed._id.toString() === module._id.toString()
        ),
        prerequisiteNames: prerequisites.map(p => p.title)
      });
    }

    res.json(modulesWithStatus);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/modules/:id', authenticateToken, async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const user = await User.findById(req.user.userId);
    const userProgress = user.moduleProgress.find(p => 
      p.moduleId && p.moduleId._id.toString() === module._id.toString()
    );

    res.json({
      ...module.toObject(),
      progress: userProgress ? userProgress.progress : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/modules/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { progress } = req.body;
    const moduleId = req.params.id;

    const user = await User.findById(req.user.userId);
    
    // Find or create progress entry
    let progressEntry = user.moduleProgress.find(p => 
      p.moduleId && p.moduleId.toString() === moduleId
    );

    if (progressEntry) {
      progressEntry.progress = progress;
      progressEntry.lastAccessed = new Date();
    } else {
      user.moduleProgress.push({
        moduleId,
        progress,
        lastAccessed: new Date()
      });
    }

    // If module completed (100% progress)
    if (progress >= 100) {
      if (!user.completedModules.includes(moduleId)) {
        user.completedModules.push(moduleId);
        user.totalPoints += 100; // Award points for completion
      }
    }

    await user.save();

    // Update leaderboard
    await Leaderboard.findOneAndUpdate(
      { userId: user._id },
      { 
        totalPoints: user.totalPoints,
        badgeCount: user.badges.length,
        lastUpdated: new Date()
      }
    );

    // Check for new badges
    const newBadges = await checkAndAwardBadges(user._id);

    res.json({
      message: 'Progress updated successfully',
      progress,
      newBadges,
      totalPoints: user.totalPoints
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Quiz routes
app.get('/api/quizzes', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const { subject, grade, difficulty } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    if (subject) filter.subject = subject;
    if (grade) filter.grade = parseInt(grade);
    if (difficulty) filter.difficulty = difficulty;
    
    const quizzes = await Quiz.find(filter).populate('moduleId');

    const quizzesWithResults = quizzes.map(quiz => {
      const userResult = user.quizResults.find(result => 
        result.quizId.toString() === quiz._id.toString()
      );
      
      return {
        ...quiz.toObject(),
        isCompleted: !!userResult,
        score: userResult ? userResult.score : null,
        lastAttempt: userResult ? userResult.completedAt : null,
        bestScore: userResult ? Math.max(...user.quizResults
          .filter(r => r.quizId.toString() === quiz._id.toString())
          .map(r => r.score)) : null
      };
    });

    res.json(quizzesWithResults);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get quiz categories (grouped by subject and grade)
app.get('/api/quiz-categories', authenticateToken, async (req, res) => {
  try {
    const categories = await Quiz.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: { subject: '$subject', grade: '$grade' },
          quizCount: { $sum: 1 },
          title: { $first: '$title' }
        }
      },
      {
        $project: {
          _id: 0,
          id: { $concat: ['$_id.subject', ' - Grade ', { $toString: '$_id.grade' }] },
          name: { $concat: ['$_id.subject', ' - Grade ', { $toString: '$_id.grade' }] },
          subject: '$_id.subject',
          grade: '$_id.grade',
          quizCount: 1
        }
      },
      { $sort: { subject: 1, grade: 1 } }
    ]);

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/quizzes/:id', authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Remove correct answers from questions for security
    const safeQuiz = {
      ...quiz.toObject(),
      questions: quiz.questions.map(q => ({
        question: q.question,
        type: q.type,
        options: q.options,
        points: q.points
      }))
    };

    res.json(safeQuiz);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/quizzes/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { answers, timeSpent } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Calculate score
    let correctAnswers = 0;
    let totalPoints = 0;
    let maxPoints = 0;

    const detailedResults = quiz.questions.map((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        correctAnswers++;
        totalPoints += question.points;
      }
      maxPoints += question.points;

      return {
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
        points: isCorrect ? question.points : 0
      };
    });

    const scorePercentage = Math.round((totalPoints / maxPoints) * 100);

    // Save result
    const user = await User.findById(req.user.userId);
    user.quizResults.push({
      quizId: quiz._id,
      score: scorePercentage,
      totalQuestions: quiz.questions.length,
      timeSpent,
      completedAt: new Date()
    });

    // Award points based on score
    const pointsAwarded = Math.round(scorePercentage / 2); // Max 50 points per quiz
    user.totalPoints += pointsAwarded;

    await user.save();

    // Update leaderboard
    await Leaderboard.findOneAndUpdate(
      { userId: user._id },
      { 
        totalPoints: user.totalPoints,
        lastUpdated: new Date()
      }
    );

    // Check for new badges
    const newBadges = await checkAndAwardBadges(user._id);

    res.json({
      score: scorePercentage,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      pointsAwarded,
      newBadges,
      detailedResults: detailedResults
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Badges route
app.get('/api/badges', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    // Define all possible badges
    const allBadges = [
      { name: 'Biology Pro', type: 'gold', description: 'Completed all biology modules with 90%+ scores' },
      { name: 'Algebra Ace', type: 'silver', description: 'Solved 50+ algebraic problems' },
      { name: 'Coding Starter', type: 'bronze', description: 'Completed first programming module' },
      { name: 'Quiz Master', type: 'special', description: 'Perfect scores on 5 consecutive quizzes' },
      { name: 'Chemistry Champion', type: 'gold', description: 'Complete chemistry lab module' },
      { name: 'Physics Pioneer', type: 'silver', description: 'Master motion physics concepts' }
    ];

    const badgesWithStatus = allBadges.map(badge => ({
      ...badge,
      earned: user.badges.some(userBadge => userBadge.name === badge.name),
      earnedAt: user.badges.find(userBadge => userBadge.name === badge.name)?.earnedAt
    }));

    res.json(badgesWithStatus);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Leaderboard route
app.get('/api/leaderboard', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const leaderboard = await Leaderboard.find({ grade: currentUser.grade })
      .populate('userId', 'name profilePicture')
      .sort({ totalPoints: -1 })
      .limit(20);

    const leaderboardWithRanks = leaderboard
      .filter(entry => entry.userId) // Filter out entries with null userId
      .map((entry, index) => ({
        rank: index + 1,
        user: entry.userId,
        totalPoints: entry.totalPoints,
        badgeCount: entry.badgeCount,
        isCurrentUser: entry.userId._id.toString() === req.user.userId
      }));

    res.json(leaderboardWithRanks);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Settings routes
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json({
      name: user.name,
      email: user.email,
      grade: user.grade,
      profilePicture: user.profilePicture,
      settings: user.settings
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user.userId);

    // Update allowed fields
    if (updates.name) user.name = updates.name;
    if (updates.grade) user.grade = updates.grade;
    if (updates.profilePicture) user.profilePicture = updates.profilePicture;
    if (updates.settings) {
      user.settings = { ...user.settings, ...updates.settings };
    }

    await user.save();

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;