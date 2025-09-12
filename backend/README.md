
# Stitch Learning Platform - Backend API

A comprehensive backend API for the Stitch Learning Platform, providing gamified STEM education features including user management, progress tracking, quizzes, badges, and leaderboards.

## Features

- **User Authentication**: JWT-based authentication with registration and login
- **Gamified Learning**: Progress tracking, badges, and points system
- **STEM Modules**: Interactive learning content with prerequisites
- **Quizzes**: Timed quizzes with detailed scoring and feedback
- **Leaderboards**: Competitive rankings by grade level
- **Analytics**: User engagement and learning analytics
- **File Uploads**: Profile picture uploads with Cloudinary integration
- **Email Notifications**: Welcome emails and badge notifications
- **Scheduled Tasks**: Daily reminders and leaderboard resets

## Tech Stack

- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Cloudinary** for image uploads
- **Nodemailer** for email notifications
- **Joi** for request validation
- **Jest** for testing
- **Cron** for scheduled tasks

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd stitch-learning-backend
```

2. Install dependencies
```bash
npm install
```

3. Create environment variables
```bash
cp .env.example .env
```

4. Configure your `.env` file with:
```env
NODE_ENV=development
PORT=8000
MONGODB_URI=mongodb://localhost:27017/stitch_learning
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:3000

# Email configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary configuration (optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

5. Start the server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

6. Seed sample data (optional)
```bash
npm run seed
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Dashboard
- `GET /api/dashboard` - Get dashboard data (requires auth)

### Modules
- `GET /api/modules` - Get all modules with user progress
- `GET /api/modules/:id` - Get specific module
- `POST /api/modules/:id/progress` - Update module progress

### Quizzes
- `GET /api/quizzes` - Get all quizzes with user results
- `GET /api/quizzes/:id` - Get specific quiz
- `POST /api/quizzes/:id/submit` - Submit quiz answers

### Badges
- `GET /api/badges` - Get user badges

### Leaderboard
- `GET /api/leaderboard` - Get grade-level leaderboard

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

### File Upload
- `POST /api/upload/profile-picture` - Upload profile picture

### Analytics
- `GET /api/analytics` - Get user analytics data
- `POST /api/analytics/track` - Track custom events

## Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Sample Data

The project includes a seed script that creates sample data:
- Sample user account (sophia@example.com / password123)
- Learning modules for Biology, Python, and Algebra
- Sample quizzes with questions
- Leaderboard with multiple users
- Achievement badges

Run the seed script:
```bash
npm run seed
```

## Project Structure

```
├── server.js              # Main server file
├── middleware/
│   ├── validation.js       # Request validation
│   ├── upload.js          # File upload handling
├── utils/
│   ├── email.js           # Email utilities
│   ├── analytics.js       # Analytics tracking
│   └── scheduler.js       # Scheduled tasks
├── routes/
│   ├── upload.js          # Upload routes
│   └── analytics.js       # Analytics routes
├── scripts/
│   └── seedData.js        # Database seeding
├── tests/
│   └── auth.test.js       # Authentication tests
└── README.md
```

## Security Features

- Rate limiting on API endpoints
- Helmet.js for security headers
- Password hashing with bcryptjs
- JWT token authentication
- Input validation with Joi
- File upload restrictions

## Deployment

The application is ready for deployment to platforms like:
- Heroku
- Railway
- DigitalOcean
- AWS

Make sure to:
1. Set all environment variables in production
2. Use a production MongoDB instance
3. Configure proper CORS origins
4. Enable SSL/HTTPS

