// utils/analytics.js
const mongoose = require('mongoose');

// Analytics schema for tracking user engagement
const analyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: String, required: true }, // login, module_start, quiz_complete, etc.
  data: { type: mongoose.Schema.Types.Mixed }, // Additional event data
  timestamp: { type: Date, default: Date.now },
  sessionId: String,
  userAgent: String,
  ipAddress: String
});

const Analytics = mongoose.model('Analytics', analyticsSchema);

const trackEvent = async (userId, event, data = {}, req = null) => {
  try {
    const analyticsData = {
      userId,
      event,
      data,
      sessionId: req?.sessionID || 'unknown',
      userAgent: req?.get('User-Agent') || 'unknown',
      ipAddress: req?.ip || 'unknown'
    };

    await Analytics.create(analyticsData);
  } catch (error) {
    console.error('Analytics tracking failed:', error);
    // Don't throw error to prevent disrupting main application flow
  }
};

const getAnalytics = async (userId, startDate, endDate) => {
  try {
    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          timestamp: {
            $gte: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default 30 days
            $lte: endDate || new Date()
          }
        }
      },
      {
        $group: {
          _id: {
            event: '$event',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          count: { $sum: 1 },
          lastOccurrence: { $max: '$timestamp' }
        }
      },
      { $sort: { '_id.date': -1, '_id.event': 1 } }
    ];

    const results = await Analytics.aggregate(pipeline);
    return results;
  } catch (error) {
    console.error('Analytics retrieval failed:', error);
    return [];
  }
};

module.exports = {
  Analytics,
  trackEvent,
  getAnalytics
};