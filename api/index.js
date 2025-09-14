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
app.set('trust proxy', true);
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
const User = require('./models/User');
const Module = require('./models/Module');
const Quiz = require('./models/Quiz');
const Leaderboard = require('./models/Leaderboard');
const Category = require('./models/Category');

// JWT middleware
const { authenticateToken } = require('./middleware/auth');

// Routes
const quizRoutes = require('./routes/quizzes');
const reportsRoutes = require('./routes/reports');
app.use('/api/quizzes', quizRoutes);
app.use('/api/reports', reportsRoutes);

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

const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);

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

    // Get all quizzes for the quizzes page
    const allQuizzes = await Quiz.find({ isActive: true }).populate('moduleId');
    const allQuizzesWithResults = allQuizzes.map(quiz => {
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

    // Get all badges with status
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

    // Get leaderboard data
    const leaderboardEntries = await Leaderboard.find()
      .populate('userId', 'name email')
      .sort({ totalPoints: -1, badgeCount: -1 })
      .limit(10);

    const leaderboard = leaderboardEntries.map((entry, index) => ({
      rank: index + 1,
      user: entry.userId,
      totalPoints: entry.totalPoints,
      badgeCount: entry.badgeCount,
      isCurrentUser: entry.userId._id.toString() === user._id.toString()
    }));

    // Get user settings
    const userSettings = {
      name: user.name,
      email: user.email,
      grade: user.grade,
      profilePicture: user.profilePicture,
      settings: user.settings || { dailyReminders: true, soundEffects: true, darkMode: true }
    };

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        grade: user.grade,
        profilePicture: user.profilePicture,
        totalPoints: user.totalPoints
      },
      overallProgress,
      modules: availableModules, // All modules for the modules page
      featuredModules: availableModules.slice(0, 3), // Featured modules for dashboard
      quizzes: allQuizzesWithResults, // All quizzes for the quizzes page
      featuredQuizzes: quizzesWithResults.slice(0, 2), // Recent quizzes for dashboard
      badges: badgesWithStatus, // All badges with status
      featuredBadges: user.badges.slice(-3), // Recent badges for dashboard
      totalBadges: user.badges.length,
      leaderboard: leaderboard,
      settings: userSettings
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

// Quiz routes are now handled in /api/routes/quizzes.js

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
const leaderboardRoutes = require('./routes/leaderboard');
app.use('/api/leaderboard', leaderboardRoutes);

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
/* app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); */

module.exports = app;