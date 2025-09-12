
// middleware/validation.js
const joi = require('joi');

const schemas = {
  register: joi.object({
    name: joi.string().min(2).max(50).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).max(128).required(),
    grade: joi.string().valid('Grade 9', 'Grade 10', 'Grade 11', 'Grade 12').required()
  }),

  login: joi.object({
    email: joi.string().email().required(),
    password: joi.string().required()
  }),

  updateProgress: joi.object({
    progress: joi.number().min(0).max(100).required()
  }),

  submitQuiz: joi.object({
    answers: joi.array().items(joi.string()).required(),
    timeSpent: joi.number().min(0).required()
  }),

  updateSettings: joi.object({
    name: joi.string().min(2).max(50).optional(),
    grade: joi.string().valid('Grade 9', 'Grade 10', 'Grade 11', 'Grade 12').optional(),
    profilePicture: joi.string().uri().optional(),
    settings: joi.object({
      dailyReminders: joi.boolean().optional(),
      soundEffects: joi.boolean().optional(),
      darkMode: joi.boolean().optional()
    }).optional()
  })
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details[0].message
      });
    }
    next();
  };
};

module.exports = { schemas, validate };