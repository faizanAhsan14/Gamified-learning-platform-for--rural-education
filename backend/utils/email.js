// utils/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

const sendWelcomeEmail = async (userEmail, userName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(90deg, #38e07b, #2fbb64); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Welcome to Stitch Learning!</h1>
      </div>
      <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hi ${userName}!</h2>
        <p style="color: #666; line-height: 1.6;">
          Welcome to your personalized STEM learning adventure! We're excited to have you join our community of curious minds.
        </p>
        <p style="color: #666; line-height: 1.6;">
          Your learning journey is just beginning. Here's what you can explore:
        </p>
        <ul style="color: #666; line-height: 1.8;">
          <li>🧪 Interactive STEM modules</li>
          <li>🏆 Gamified quizzes and challenges</li>
          <li>🎖️ Achievement badges and rewards</li>
          <li>📈 Progress tracking and analytics</li>
          <li>🏅 Leaderboards to compete with peers</li>
        </ul>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background: #38e07b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Start Learning Now
          </a>
        </div>
      </div>
    </div>
  `;
  
  return sendEmail(userEmail, 'Welcome to Stitch Learning Platform!', html);
};

const sendBadgeNotification = async (userEmail, userName, badgeName, badgeType) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(90deg, #38e07b, #2fbb64); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🏆 Congratulations!</h1>
      </div>
      <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px; text-align: center;">
        <h2 style="color: #333;">Hi ${userName}!</h2>
        <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <div style="font-size: 60px; margin-bottom: 10px;">🎖️</div>
          <h3 style="color: #38e07b; margin: 10px 0;">${badgeName}</h3>
          <p style="color: #666; text-transform: capitalize;">${badgeType} Badge Earned</p>
        </div>
        <p style="color: #666; line-height: 1.6;">
          You've achieved a new milestone in your learning journey! Keep up the excellent work.
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/badges" 
             style="background: #38e07b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View All Badges
          </a>
        </div>
      </div>
    </div>
  `;
  
  return sendEmail(userEmail, `🏆 New Badge Earned: ${badgeName}`, html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendBadgeNotification
};