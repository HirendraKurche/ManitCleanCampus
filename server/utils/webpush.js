const webpush = require('web-push');

// Set VAPID details based on env variables
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@clean-campus.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('✅ Web Push initialized');
} else {
  console.warn('⚠️ Web Push keys not found in .env. Background push notifications are disabled.');
}

module.exports = webpush;
