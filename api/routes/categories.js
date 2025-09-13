const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Quiz = require('../models/Quiz');

// Get quiz categories (grouped by subject and grade)
router.get('/', authenticateToken, async (req, res) => {
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

module.exports = router;
