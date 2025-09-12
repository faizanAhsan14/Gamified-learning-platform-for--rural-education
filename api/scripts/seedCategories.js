const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Category = require('../models/Category');

// Load environment variables from .env file
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('Error: MONGODB_URI is not defined in the .env file.');
  process.exit(1);
}

console.log('MONGODB_URI before connect:', mongoURI);
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected for seeding categories...'))
.catch(err => console.error('MongoDB connection error:', err));

const seedCategories = async () => {
  console.log('Starting seedCategories function...');
  try {
    const quizDataPath = path.join(__dirname, 'quizData.json');
    const quizData = JSON.parse(fs.readFileSync(quizDataPath, 'utf-8'));

    const uniqueCategories = [];
    quizData.quizzes.forEach(quiz => {
      const existing = uniqueCategories.find(uc => uc.name === quiz.subject && uc.grade === quiz.grade);
      if (!existing) {
        uniqueCategories.push({ name: quiz.subject, grade: quiz.grade });
      }
    });

    console.log('Found unique categories with grades:', uniqueCategories);

    for (const categoryData of uniqueCategories) {
      await Category.findOneAndUpdate(
        { name: categoryData.name, grade: categoryData.grade },
        { $set: categoryData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log('Categories seeded successfully!');
  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    mongoose.disconnect();
  }
};

seedCategories();
