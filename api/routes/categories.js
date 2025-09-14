const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const User = require('../models/User');

// Get quiz categories (grouped by subject and grade) - filtered by user's grade
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get user's grade
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userGrade = user.grade;
    console.log('Filtering categories for user grade:', userGrade);

    // Extract grade number from "Grade X" format
    const gradeNumber = userGrade.replace('Grade ', '');
    
    const categories = await Quiz.aggregate([
      { 
        $match: { 
          isActive: true,
          // Filter by user's grade - handle both "Grade X" and numeric formats
          grade: { $in: [userGrade, gradeNumber, parseInt(gradeNumber)] }
        } 
      },
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

    console.log(`Found ${categories.length} categories for grade ${userGrade}`);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
