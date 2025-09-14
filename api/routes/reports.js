const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const QuizResult = require('../models/QuizResult');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Leaderboard = require('../models/Leaderboard');

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Reports API is working!' });
});

// Test QuizResult model
router.get('/test-quizresult', async (req, res) => {
  try {
    const count = await QuizResult.countDocuments();
    res.json({ 
      message: 'QuizResult model is working!', 
      totalRecords: count,
      modelName: QuizResult.modelName
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'QuizResult model error', 
      error: error.message 
    });
  }
});

// Submit quiz result and store in reports
router.post('/submit-quiz', authenticateToken, async (req, res) => {
  try {
    console.log('Quiz submission endpoint called');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user.userId);
    
    const { quizId, answers, timeSpent } = req.body;
    const userId = req.user.userId;

    // Get quiz details
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate score - use consistent logic with frontend
    let correctAnswers = 0;
    let totalQuestions = quiz.questions.length;

    const detailedResults = quiz.questions.map((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        correctAnswers++;
      }

      return {
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
        points: isCorrect ? 1 : 0
      };
    });

    // Calculate percentage based on correct answers (consistent with frontend)
    const scorePercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    // Award points based on score percentage with better scaling
    let pointsAwarded = 0;
    if (scorePercentage >= 90) {
      pointsAwarded = 50; // Perfect/near perfect
    } else if (scorePercentage >= 80) {
      pointsAwarded = 40; // Excellent
    } else if (scorePercentage >= 70) {
      pointsAwarded = 30; // Good
    } else if (scorePercentage >= 60) {
      pointsAwarded = 20; // Pass
    } else {
      pointsAwarded = 10; // Attempt (encourage participation)
    }

    // Check if this is a retake
    const existingResults = await QuizResult.find({ userId, quizId }).sort({ completedAt: -1 });
    const attemptNumber = existingResults.length + 1;

    // Create quiz result record
    const quizResult = new QuizResult({
      userId,
      quizId,
      grade: user.grade,
      subject: quiz.subject,
      score: scorePercentage,
      totalQuestions: quiz.questions.length,
      correctAnswers,
      timeSpent,
      pointsAwarded,
      detailedResults,
      attemptNumber
    });

    await quizResult.save();

    // Update user's quiz results array (keep existing functionality)
    // Check if this quiz was already attempted and update the best score
    const existingQuizResult = user.quizResults.find(result => 
      result.quizId.toString() === quiz._id.toString()
    );

    if (existingQuizResult) {
      // Update existing result if this score is better
      if (scorePercentage > existingQuizResult.score) {
        existingQuizResult.score = scorePercentage;
        existingQuizResult.totalQuestions = quiz.questions.length;
        existingQuizResult.timeSpent = timeSpent;
        existingQuizResult.completedAt = new Date();
        
        // Award bonus points for improvement (only if score improved significantly)
        if (scorePercentage - existingQuizResult.score >= 10) {
          pointsAwarded += 5; // Bonus for significant improvement
        }
      }
    } else {
      // Add new result
      user.quizResults.push({
        quizId: quiz._id,
        score: scorePercentage,
        totalQuestions: quiz.questions.length,
        timeSpent,
        completedAt: new Date()
      });
    }

    // Award points
    user.totalPoints += pointsAwarded;
    await user.save();

    // Update leaderboard with proper upsert
    await Leaderboard.findOneAndUpdate(
      { userId: user._id },
      { 
        userId: user._id,
        grade: user.grade,
        totalPoints: user.totalPoints,
        badgeCount: user.badges.length,
        lastUpdated: new Date()
      },
      { 
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    console.log(`Updated leaderboard for user ${user._id} with ${user.totalPoints} total points`);

    res.json({
      success: true,
      score: scorePercentage,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      pointsAwarded,
      attemptNumber,
      detailedResults
    });

  } catch (error) {
    console.error('Error submitting quiz result:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's quiz performance report
router.get('/user-performance', authenticateToken, async (req, res) => {
  try {
    console.log('User performance endpoint called');
    const userId = req.user.userId;
    console.log('User ID:', userId);
    
    const { grade, subject, limit = 10 } = req.query;

    // Build filter
    const filter = { userId };
    if (grade) filter.grade = grade;
    if (subject) filter.subject = subject;

    console.log('Filter:', filter);

    let results = [];
    try {
      results = await QuizResult.find(filter)
        .populate('quizId', 'title subject difficulty timeLimit')
        .sort({ completedAt: -1 })
        .limit(parseInt(limit));
      console.log('Found results:', results.length);
    } catch (findError) {
      console.error('Error finding quiz results:', findError);
      // If QuizResult collection doesn't exist yet, return empty results
      results = [];
    }

    // Calculate performance statistics
    let stats = [];
    try {
      stats = await QuizResult.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalQuizzes: { $sum: 1 },
            averageScore: { $avg: '$score' },
            totalPoints: { $sum: '$pointsAwarded' },
            bestScore: { $max: '$score' },
            totalTimeSpent: { $sum: '$timeSpent' }
          }
        }
      ]);
      console.log('Stats calculated:', stats);
    } catch (statsError) {
      console.error('Error calculating stats:', statsError);
      // If stats fail, continue with empty stats
    }

    res.json({
      results,
      statistics: stats[0] || {
        totalQuizzes: 0,
        averageScore: 0,
        totalPoints: 0,
        bestScore: 0,
        totalTimeSpent: 0
      }
    });

  } catch (error) {
    console.error('Error fetching user performance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get grade-specific leaderboard
router.get('/leaderboard/:grade', authenticateToken, async (req, res) => {
  try {
    const { grade } = req.params;
    const { limit = 50 } = req.query;

    console.log(`Fetching leaderboard for grade: ${grade}`);

    const leaderboard = await Leaderboard.find({ grade })
      .populate('userId', 'name profilePicture badges')
      .sort({ totalPoints: -1, lastUpdated: -1 })
      .limit(parseInt(limit));

    console.log(`Found ${leaderboard.length} leaderboard entries for grade ${grade}`);

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId._id,
      name: entry.userId.name,
      profilePicture: entry.userId.profilePicture,
      totalPoints: entry.totalPoints,
      badgeCount: entry.badgeCount,
      weeklyPoints: entry.weeklyPoints,
      monthlyPoints: entry.monthlyPoints,
      lastUpdated: entry.lastUpdated
    }));

    console.log('Leaderboard data:', rankedLeaderboard.slice(0, 3)); // Log first 3 entries

    res.json({
      grade,
      leaderboard: rankedLeaderboard,
      totalParticipants: leaderboard.length
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all grades leaderboard summary
router.get('/leaderboard-summary', authenticateToken, async (req, res) => {
  try {
    const summary = await Leaderboard.aggregate([
      {
        $group: {
          _id: '$grade',
          topStudent: {
            $first: {
              userId: '$userId',
              totalPoints: '$totalPoints',
              name: '$name'
            }
          },
          totalStudents: { $sum: 1 },
          averagePoints: { $avg: '$totalPoints' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'topStudent.userId',
          foreignField: '_id',
          as: 'topStudentDetails'
        }
      },
      {
        $project: {
          grade: '$_id',
          topStudent: {
            $mergeObjects: [
              '$topStudent',
              { $arrayElemAt: ['$topStudentDetails', 0] }
            ]
          },
          totalStudents: 1,
          averagePoints: { $round: ['$averagePoints', 2] }
        }
      },
      { $sort: { grade: 1 } }
    ]);

    res.json(summary);

  } catch (error) {
    console.error('Error fetching leaderboard summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
