const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting MongoDB locally...');

// Try to start MongoDB service
const mongod = spawn('mongod', ['--dbpath', './data/db'], {
  stdio: 'inherit',
  shell: true
});

mongod.on('error', (err) => {
  console.error('❌ Failed to start MongoDB:', err.message);
  console.log('💡 Please install MongoDB or start it manually:');
  console.log('   - Windows: net start MongoDB');
  console.log('   - macOS: brew services start mongodb-community');
  console.log('   - Linux: sudo systemctl start mongod');
});

mongod.on('close', (code) => {
  console.log(`MongoDB process exited with code ${code}`);
});

// Keep the script running
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping MongoDB...');
  mongod.kill('SIGINT');
  process.exit(0);
});
