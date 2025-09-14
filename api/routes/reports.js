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
    console.log('Testing QuizResult model...');
    console.log('QuizResult model:', QuizResult);
    console.log('QuizResult.modelName:', QuizResult.modelName);
    console.log('QuizResult.schema:', QuizResult.schema);
    
    const count = await QuizResult.countDocuments();
    res.json({ 
      message: 'QuizResult model is working!', 
      totalRecords: count,
      modelName: QuizResult.modelName,
      hasFindMethod: typeof QuizResult.find === 'function',
      hasCountDocumentsMethod: typeof QuizResult.countDocuments === 'function'
    });
  } catch (error) {
    console.error('QuizResult model error:', error);
    res.status(500).json({ 
      message: 'QuizResult model error', 
      error: error.message,
      stack: error.stack
    });
  }
});

// Test user quizResults array
router.get('/test-user-quizresults', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate('quizResults.quizId', 'title subject');
    
    res.json({
      message: 'User quizResults test',
      userId: userId,
      quizResultsCount: user.quizResults.length,
      quizResults: user.quizResults.map(result => ({
        quizId: result.quizId,
        score: result.score,
        totalQuestions: result.totalQuestions,
        correctAnswers: Math.round((result.score / 100) * result.totalQuestions),
        timeSpent: result.timeSpent,
        pointsAwarded: result.pointsAwarded,
        completedAt: result.completedAt,
        subject: result.quizId?.subject || 'Unknown'
      }))
    });
  } catch (error) {
    console.error('User quizResults test error:', error);
    res.status(500).json({ 
      message: 'User quizResults test error', 
      error: error.message
    });
  }
});

// Test quiz answer matching logic
router.post('/test-answer-matching', authenticateToken, async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    const userId = req.user.userId;
    
    console.log('Testing answer matching for quiz:', quizId);
    console.log('User answers:', answers);
    
    // Get quiz details
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    console.log('Quiz questions:', quiz.questions.map((q, idx) => ({
      index: idx,
      question: q.question,
      correctAnswer: q.correctAnswer,
      options: q.options
    })));
    
    // Test answer matching - use same logic as main submission endpoint
    let correctAnswers = 0;
    const results = quiz.questions.map((question, index) => {
      const userAnswer = answers[index];
      // Handle both field names (correctAnswer from backend, correct_answer from frontend mapping)
      const correctAnswer = question.correctAnswer || question.correct_answer;
      
      // Normalize answers for comparison (trim whitespace and handle case sensitivity)
      const normalizedUserAnswer = userAnswer ? userAnswer.toString().trim() : '';
      const normalizedCorrectAnswer = correctAnswer ? correctAnswer.toString().trim() : '';
      
      let isCorrect = false;
      
      // First try direct comparison
      if (normalizedUserAnswer === normalizedCorrectAnswer) {
        isCorrect = true;
      } else if (question.options && question.options.length > 0) {
        // If direct match fails, check if both answers exist in the options and are the same
        const correctAnswerInOptions = question.options.find(option => 
          option && option.toString().trim() === normalizedCorrectAnswer
        );
        const userAnswerInOptions = question.options.find(option => 
          option && option.toString().trim() === normalizedUserAnswer
        );
        
        // If both answers are found in options and they're the same option, it's correct
        if (correctAnswerInOptions && userAnswerInOptions && correctAnswerInOptions === userAnswerInOptions) {
          isCorrect = true;
        }
      }
      
      if (isCorrect) {
        correctAnswers++;
      }
      
      return {
        questionIndex: index,
        question: question.question,
        userAnswer,
        correctAnswer,
        isCorrect,
        options: question.options,
        normalizedUserAnswer,
        normalizedCorrectAnswer
      };
    });
    
    const scorePercentage = Math.round((correctAnswers / quiz.questions.length) * 100);
    
    res.json({
      message: 'Answer matching test completed',
      quizId,
      totalQuestions: quiz.questions.length,
      correctAnswers,
      scorePercentage,
      results
    });
    
  } catch (error) {
    console.error('Answer matching test error:', error);
    res.status(500).json({ 
      message: 'Answer matching test error', 
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

    console.log('=== QUIZ SUBMISSION DEBUG ===');
    console.log('Quiz questions:', quiz.questions.map((q, idx) => ({ 
      index: idx, 
      question: q.question, 
      correctAnswer: q.correctAnswer,
      correct_answer: q.correct_answer,
      options: q.options 
    })));
    console.log('User answers:', answers);
    console.log('User answers types:', answers.map(a => typeof a));
    console.log('Answers length:', answers.length);
    console.log('Questions length:', quiz.questions.length);
    
    // Check if answers array has the right length
    if (answers.length !== quiz.questions.length) {
      console.error('MISMATCH: Answers length does not match questions length!');
      console.error('Answers:', answers);
      console.error('Questions:', quiz.questions.map(q => q.question));
    }

    const detailedResults = quiz.questions.map((question, index) => {
      const userAnswer = answers[index];
      // Handle both field names (correctAnswer from backend, correct_answer from frontend mapping)
      const correctAnswer = question.correctAnswer || question.correct_answer;
      
      // Normalize answers for comparison (trim whitespace and handle case sensitivity)
      const normalizedUserAnswer = userAnswer ? userAnswer.toString().trim() : '';
      const normalizedCorrectAnswer = correctAnswer ? correctAnswer.toString().trim() : '';
      
      let isCorrect = false;
      
      console.log(`\n--- Question ${index} ---`);
      console.log(`Question: "${question.question}"`);
      console.log(`User answer: "${userAnswer}" (type: ${typeof userAnswer}, normalized: "${normalizedUserAnswer}")`);
      console.log(`Correct answer: "${correctAnswer}" (type: ${typeof correctAnswer}, normalized: "${normalizedCorrectAnswer}")`);
      console.log(`Options:`, question.options);
      
      // First try direct comparison
      if (normalizedUserAnswer === normalizedCorrectAnswer) {
        isCorrect = true;
        console.log(`✅ Direct match: ${isCorrect}`);
      } else {
        console.log(`❌ Direct match failed`);
        
        // Try case-insensitive comparison
        if (normalizedUserAnswer.toLowerCase() === normalizedCorrectAnswer.toLowerCase()) {
          isCorrect = true;
          console.log(`✅ Case-insensitive match: ${isCorrect}`);
        } else if (question.options && question.options.length > 0) {
          console.log(`❌ Case-insensitive match failed, checking options`);
          
          // If direct match fails, check if both answers exist in the options and are the same
          const correctAnswerInOptions = question.options.find(option => 
            option && option.toString().trim() === normalizedCorrectAnswer
          );
          const userAnswerInOptions = question.options.find(option => 
            option && option.toString().trim() === normalizedUserAnswer
          );
          
          console.log(`Correct answer in options: "${correctAnswerInOptions}"`);
          console.log(`User answer in options: "${userAnswerInOptions}"`);
          
          // If both answers are found in options and they're the same option, it's correct
          if (correctAnswerInOptions && userAnswerInOptions && correctAnswerInOptions === userAnswerInOptions) {
            isCorrect = true;
            console.log(`✅ Found matching answers in options, marking as correct`);
          } else {
            console.log(`❌ No match found in options`);
          }
        }
      }
      
      console.log(`Final result: ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
      
      if (isCorrect) {
        correctAnswers++;
      }

      return {
        question: question.question,
        userAnswer,
        correctAnswer: correctAnswer,
        isCorrect,
        explanation: question.explanation,
        points: isCorrect ? 1 : 0
      };
    });

    console.log(`\n=== SCORING SUMMARY ===`);
    console.log(`Total correct answers: ${correctAnswers}/${totalQuestions}`);
    console.log(`Correct answers percentage: ${totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0}%`);

    // Calculate percentage based on correct answers (consistent with frontend)
    const scorePercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    console.log(`Final score percentage: ${scorePercentage}%`);
    
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
    console.log('Checking for existing results...');
    console.log('QuizResult model available:', !!QuizResult);
    console.log('QuizResult.find available:', typeof QuizResult.find === 'function');
    
    let existingResults = [];
    try {
      existingResults = await QuizResult.find({ userId, quizId }).sort({ completedAt: -1 });
      console.log('Found existing results:', existingResults.length);
    } catch (findError) {
      console.error('Error finding existing results:', findError);
      // Continue with empty results
    }
    
    const attemptNumber = existingResults.length + 1;

    // Create quiz result record
    console.log('Creating QuizResult document...');
    console.log('QuizResult constructor available:', typeof QuizResult === 'function');
    
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
      attemptNumber
    });

    console.log('QuizResult document created:', quizResult);
    
    await quizResult.save();
    console.log('QuizResult saved successfully:', quizResult._id);

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
        existingQuizResult.pointsAwarded = pointsAwarded;
        
        // Award bonus points for improvement (only if score improved significantly)
        if (scorePercentage - existingQuizResult.score >= 10) {
          pointsAwarded += 5; // Bonus for significant improvement
          existingQuizResult.pointsAwarded = pointsAwarded;
        }
      }
    } else {
      // Add new result
      user.quizResults.push({
        quizId: quiz._id,
        score: scorePercentage,
        totalQuestions: quiz.questions.length,
        timeSpent,
        completedAt: new Date(),
        pointsAwarded: pointsAwarded
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
      attemptNumber
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
      // First, let's check if there are any QuizResult documents at all
      const totalCount = await QuizResult.countDocuments();
      console.log('Total QuizResult documents in database:', totalCount);
      
      // Check if there are any results for this user
      const userCount = await QuizResult.countDocuments({ userId });
      console.log(`QuizResult documents for user ${userId}:`, userCount);
      
      results = await QuizResult.find(filter)
        .populate('quizId', 'title subject difficulty timeLimit')
        .sort({ completedAt: -1 })
        .limit(parseInt(limit));
      console.log('Found results:', results.length);
      
      if (results.length > 0) {
        console.log('First result:', results[0]);
      }
    } catch (findError) {
      console.error('Error finding quiz results:', findError);
      // If QuizResult collection doesn't exist yet, return empty results
      results = [];
    }

    // If no QuizResult documents found, try to get data from user's quizResults array
    if (results.length === 0) {
      console.log('No QuizResult documents found, trying to get from user quizResults array');
      const user = await User.findById(userId).populate('quizResults.quizId', 'title subject difficulty timeLimit');
      if (user && user.quizResults && user.quizResults.length > 0) {
        results = user.quizResults
          .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
          .slice(0, parseInt(limit))
          .map(result => {
            // Calculate correct answers properly
            const correctAnswers = Math.round((result.score / 100) * result.totalQuestions);
            return {
              quizId: result.quizId,
              score: result.score,
              totalQuestions: result.totalQuestions,
              correctAnswers: correctAnswers,
              timeSpent: result.timeSpent,
              completedAt: result.completedAt,
              subject: result.quizId?.subject || 'Unknown',
              grade: user.grade,
              pointsAwarded: result.pointsAwarded || 0
            };
          });
        console.log('Found results from user quizResults array:', results.length);
        if (results.length > 0) {
          console.log('First result from user array:', results[0]);
        }
      }
    }

    // Calculate performance statistics after we have the results
    let stats = [];
    try {
      // First try to get stats from QuizResult collection
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
      console.log('Stats calculated from QuizResult:', stats);
    } catch (statsError) {
      console.error('Error calculating stats from QuizResult:', statsError);
    }

    // If no QuizResult stats, calculate from the results we have (either QuizResult or user array)
    if (stats.length === 0 && results.length > 0) {
      console.log('Calculating stats from available results');
      console.log('Results data:', results.map(r => ({ score: r.score, pointsAwarded: r.pointsAwarded, timeSpent: r.timeSpent })));
      
      const totalQuizzes = results.length;
      const totalScore = results.reduce((sum, result) => sum + (result.score || 0), 0);
      const averageScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;
      const bestScore = results.length > 0 ? Math.max(...results.map(result => result.score || 0)) : 0;
      const totalPoints = results.reduce((sum, result) => sum + (result.pointsAwarded || 0), 0);
      const totalTimeSpent = results.reduce((sum, result) => sum + (result.timeSpent || 0), 0);
      
      stats = [{
        totalQuizzes,
        averageScore,
        bestScore,
        totalPoints,
        totalTimeSpent
      }];
      console.log('Stats calculated from available results:', stats[0]);
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

    // Add rank to each entry, filtering out entries with null userId
    const rankedLeaderboard = leaderboard
      .filter(entry => entry.userId) // Filter out entries with null userId
      .map((entry, index) => ({
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
