// utils/scheduler.js
const cron = require('cron');
const { User, Leaderboard } = require('../models');
const { sendEmail } = require('./email');

// Daily reminder job
const dailyReminderJob = new cron.CronJob('0 9 * * *', async () => {
  try {
    console.log('Running daily reminder job...');
    
    const users = await User.find({
      'settings.dailyReminders': true,
      lastActive: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Inactive for 24+ hours
    });

    for (const user of users) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(90deg, #38e07b, #2fbb64); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0;">Don't Break Your Learning Streak!</h2>
          </div>
          <div style="padding: 20px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
            <p style="color: #333;">Hi ${user.name}!</p>
            <p style="color: #666;">We missed you yesterday! Your learning journey is waiting for you.</p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL}/dashboard" 
                 style="background: #38e07b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Continue Learning
              </a>
            </div>
          </div>
        </div>
      `;
      
      await sendEmail(user.email, 'Your Learning Adventure Awaits!', html);
    }
    
    console.log(`Daily reminders sent to ${users.length} users`);
  } catch (error) {
    console.error('Daily reminder job failed:', error);
  }
}, null, true, 'America/New_York');

// Weekly leaderboard update job
const weeklyLeaderboardJob = new cron.CronJob('0 0 * * 0', async () => {
  try {
    console.log('Running weekly leaderboard reset...');
    
    await Leaderboard.updateMany(
      {},
      { $set: { weeklyPoints: 0 } }
    );
    
    console.log('Weekly leaderboard reset completed');
  } catch (error) {
    console.error('Weekly leaderboard reset failed:', error);
  }
}, null, true, 'America/New_York');

// Monthly leaderboard update job
const monthlyLeaderboardJob = new cron.CronJob('0 0 1 * *', async () => {
  try {
    console.log('Running monthly leaderboard reset...');
    
    await Leaderboard.updateMany(
      {},
      { $set: { monthlyPoints: 0 } }
    );
    
    console.log('Monthly leaderboard reset completed');
  } catch (error) {
    console.error('Monthly leaderboard reset failed:', error);
  }
}, null, true, 'America/New_York');

// Data cleanup job (runs monthly)
const dataCleanupJob = new cron.CronJob('0 2 1 * *', async () => {
  try {
    console.log('Running data cleanup job...');
    
    // Clean old analytics data (older than 6 months)
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    const { Analytics } = require('./analytics');
    
    await Analytics.deleteMany({
      timestamp: { $lt: sixMonthsAgo }
    });
    
    console.log('Data cleanup completed');
  } catch (error) {
    console.error('Data cleanup job failed:', error);
  }
}, null, true, 'America/New_York');

const startScheduler = () => {
  dailyReminderJob.start();
  weeklyLeaderboardJob.start();
  monthlyLeaderboardJob.start();
  dataCleanupJob.start();
  
  console.log('Scheduled jobs started');
};

const stopScheduler = () => {
  dailyReminderJob.stop();
  weeklyLeaderboardJob.stop();
  monthlyLeaderboardJob.stop();
  dataCleanupJob.stop();
  
  console.log('Scheduled jobs stopped');
};

module.exports = {
  startScheduler,
  stopScheduler
};