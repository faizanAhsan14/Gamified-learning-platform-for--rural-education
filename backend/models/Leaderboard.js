const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grade: { type: String, required: true },
  totalPoints: { type: Number, required: true },
  badgeCount: { type: Number, required: true },
  weeklyPoints: { type: Number, default: 0 },
  monthlyPoints: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

module.exports = Leaderboard;
