const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Leaderboard = require('../models/Leaderboard');

router.get('/', authenticateToken, async (req, res) => {
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

module.exports = router;
