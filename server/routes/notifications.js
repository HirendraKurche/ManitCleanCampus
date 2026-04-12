// server/routes/notifications.js
// Endpoints for in-app notifications (Admin + Worker).
//
// GET  /api/notifications        — unread count + latest 30 notifications
// PATCH /api/notifications/read  — mark all as read
// PATCH /api/notifications/:id/read — mark single as read

const express = require('express');
const protect = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

// ─── GET /api/notifications ───────────────────────────────────────────────────
router.get('/', protect(['Admin', 'Worker']), async (req, res, next) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      Notification.countDocuments({ recipient: req.user._id, read: false }),
    ]);
    res.json({ success: true, unreadCount, data: notifications });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/notifications/read ───────────────────────────────────────────
// Mark all notifications as read for the current user.
router.patch('/read', protect(['Admin', 'Worker']), async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
router.patch('/:id/read', protect(['Admin', 'Worker']), async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
