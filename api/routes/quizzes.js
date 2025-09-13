
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Leaderboard = require('../models/Leaderboard');

// Get quiz categories (grouped by subject and grade)
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await Quiz.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: { subject: '$subject', grade: '$grade' },
          quizCount: { $sum: 1 },
        }
      },
      {
        $project: {
          _id: 0,
          id: { $concat: ['$_id.subject', '_', { $toString: '$_id.grade' }] },
          name: '$_id.subject',
          subject: '$_id.subject',
          grade: { $concat: ['Grade ', { $toString: '$_id.grade' }] },
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

// Get quizzes with filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const { subject, grade, difficulty } = req.query;

    // Build filter object
    const filter = { isActive: true };
    if (subject && subject !== 'undefined') filter.subject = subject;
    if (grade && grade !== 'undefined') {
      // Handle both "Grade 11" and "11" formats
      const gradeNumber = grade.replace('Grade ', '');
      filter.grade = { $in: [grade, gradeNumber, parseInt(gradeNumber)] };
    }
    if (difficulty && difficulty !== 'undefined') filter.difficulty = difficulty;
    
    console.log('Querying quizzes with filter:', filter);
    const quizzes = await Quiz.find(filter).populate('moduleId');
    console.log('Quizzes found from DB:', quizzes);
    console.log('Found quizzes:', quizzes.length);

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

// Get specific quiz by ID
router.get('/:id', authenticateToken, async (req, res) => {
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
        explanation: q.explanation,
        points: q.points
      }))
    };

    res.json(safeQuiz);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit quiz answers
router.post('/:id/submit', authenticateToken, async (req, res) => {
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

    res.json({
      score: scorePercentage,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      pointsAwarded,
      detailedResults: detailedResults
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
