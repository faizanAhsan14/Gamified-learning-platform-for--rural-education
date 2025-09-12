// routes/analytics.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getAnalytics, trackEvent } = require('../utils/analytics');

const router = express.Router();

// Get user analytics
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    const analytics = await getAnalytics(req.user.userId, start, end);
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve analytics', error: error.message });
  }
});

// Track custom event
router.post('/track', authenticateToken, async (req, res) => {
  try {
    const { event, data } = req.body;
    
    if (!event) {
      return res.status(400).json({ message: 'Event name is required' });
    }
    
    await trackEvent(req.user.userId, event, data, req);
    
    res.json({ message: 'Event tracked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to track event', error: error.message });
  }
});

module.exports = router;