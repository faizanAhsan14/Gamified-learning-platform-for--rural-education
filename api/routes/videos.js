const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const { authenticateToken } = require('../middleware/auth');

// Get all videos for a specific grade
router.get('/grade/:grade', authenticateToken, async (req, res) => {
  try {
    const { grade } = req.params;
    
    // Validate grade format
    const validGrades = ['grade_6', 'grade_7', 'grade_8', 'grade_9', 'grade_10', 'grade_11', 'grade_12'];
    if (!validGrades.includes(grade)) {
      return res.status(400).json({ 
        message: 'Invalid grade format. Use grade_6, grade_7, etc.' 
      });
    }

    const videos = await Video.find({ 
      grade: grade, 
      isActive: true 
    }).sort({ subject: 1, title: 1 });

    if (!videos.length) {
      return res.status(404).json({ 
        message: `No videos found for ${grade}`,
        videos: []
      });
    }

    // Group videos by subject for better organization
    const videosBySubject = videos.reduce((acc, video) => {
      if (!acc[video.subject]) {
        acc[video.subject] = [];
      }
      acc[video.subject].push(video);
      return acc;
    }, {});

    res.json({
      grade: grade,
      totalVideos: videos.length,
      videosBySubject: videosBySubject,
      allVideos: videos
    });

  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get videos by subject for a specific grade
router.get('/grade/:grade/subject/:subject', authenticateToken, async (req, res) => {
  try {
    const { grade, subject } = req.params;
    
    // Validate grade format
    const validGrades = ['grade_6', 'grade_7', 'grade_8', 'grade_9', 'grade_10', 'grade_11', 'grade_12'];
    if (!validGrades.includes(grade)) {
      return res.status(400).json({ 
        message: 'Invalid grade format. Use grade_6, grade_7, etc.' 
      });
    }

    // Validate subject
    const validSubjects = ['Mathematics', 'Biology', 'Chemistry', 'Physics', 'Computer Science', 'Engineering', 'Earth Science'];
    if (!validSubjects.includes(subject)) {
      return res.status(400).json({ 
        message: 'Invalid subject. Valid subjects: Mathematics, Biology, Chemistry, Physics, Computer Science, Engineering, Earth Science' 
      });
    }

    const videos = await Video.find({ 
      grade: grade, 
      subject: subject,
      isActive: true 
    }).sort({ title: 1 });

    res.json({
      grade: grade,
      subject: subject,
      totalVideos: videos.length,
      videos: videos
    });

  } catch (error) {
    console.error('Error fetching videos by subject:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get all videos (for admin purposes)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const videos = await Video.find({ isActive: true })
      .sort({ grade: 1, subject: 1, title: 1 });

    // Group by grade and subject
    const videosByGrade = videos.reduce((acc, video) => {
      if (!acc[video.grade]) {
        acc[video.grade] = {};
      }
      if (!acc[video.grade][video.subject]) {
        acc[video.grade][video.subject] = [];
      }
      acc[video.grade][video.subject].push(video);
      return acc;
    }, {});

    res.json({
      totalVideos: videos.length,
      videosByGrade: videosByGrade,
      allVideos: videos
    });

  } catch (error) {
    console.error('Error fetching all videos:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get video statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Video.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalVideos: { $sum: 1 },
          videosByGrade: {
            $push: {
              grade: '$grade',
              subject: '$subject'
            }
          }
        }
      }
    ]);

    // Get detailed statistics
    const gradeStats = await Video.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 },
          subjects: { $addToSet: '$subject' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const subjectStats = await Video.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 },
          grades: { $addToSet: '$grade' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalVideos: stats[0]?.totalVideos || 0,
      gradeStats: gradeStats,
      subjectStats: subjectStats,
      totalGrades: gradeStats.length,
      totalSubjects: subjectStats.length
    });

  } catch (error) {
    console.error('Error fetching video stats:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Search videos by title or topics
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, grade, subject } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        message: 'Search query is required' 
      });
    }

    // Build search criteria
    const searchCriteria = {
      isActive: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { topics: { $in: [new RegExp(q, 'i')] } },
        { source: { $regex: q, $options: 'i' } }
      ]
    };

    // Add grade filter if provided
    if (grade) {
      searchCriteria.grade = grade;
    }

    // Add subject filter if provided
    if (subject) {
      searchCriteria.subject = subject;
    }

    const videos = await Video.find(searchCriteria)
      .sort({ grade: 1, subject: 1, title: 1 })
      .limit(50); // Limit results to prevent overwhelming response

    res.json({
      query: q,
      filters: { grade, subject },
      totalResults: videos.length,
      videos: videos
    });

  } catch (error) {
    console.error('Error searching videos:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get a specific video by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ 
        message: 'Video not found' 
      });
    }

    if (!video.isActive) {
      return res.status(404).json({ 
        message: 'Video is not available' 
      });
    }

    res.json(video);

  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;

