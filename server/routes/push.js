const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const User = require('../models/User');

// Get VAPID public key
router.get('/vapidPublicKey', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Save push subscription for the logged-in user
router.post('/subscription', protect(), async (req, res) => {
  try {
    const subscription = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      pushSubscription: subscription
    });
    res.status(200).json({ success: true, message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Remove push subscription (on logout or opt-out)
router.delete('/subscription', protect(), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      pushSubscription: null
    });
    res.status(200).json({ success: true, message: 'Subscription removed successfully' });
  } catch (error) {
    console.error('Error removing subscription:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
