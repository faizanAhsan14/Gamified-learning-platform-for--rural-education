const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  grade: {
    type: String,
    required: true,
  },
});

categorySchema.index({ name: 1, grade: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
