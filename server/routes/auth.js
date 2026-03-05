const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const protect = require('../middleware/auth');

const router = express.Router();

// Tight rate limit on auth endpoints to slow brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many attempts — try again in 15 minutes' },
});

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── Helper: send token in response body (+ optional cookie) ─────────────────
const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // HTTP-only cookie (optional — client can also persist in encrypted localStorage)
  res.cookie('token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Never send password back
  const userData = user.toObject();
  delete userData.password;

  res.status(statusCode).json({
    success: true,
    token,   // also in body so mobile clients can persist it
    user: userData,
  });
};

// ─── POST /api/auth/register ──────────────────────────────────────────────────
/**
 * Admin-only endpoint to create worker accounts.
 * Body: { name, phone, email?, password, role?, assignedAreas? }
 * Returns: { token, user } — employeeCode auto-generated.
 */
router.post('/register', protect(['Admin']), async (req, res, next) => {
  try {
    const { name, phone, email, password, role = 'Worker', assignedAreas = [] } = req.body;

    if (!name || !password || (!phone && !email)) {
      return res.status(400).json({
        success: false,
        message: 'name, password, and at least one of phone/email are required',
      });
    }

    const user = await User.create({ name, phone, email, password, role, assignedAreas });
    sendToken(user, 201, res);
  } catch (err) {
    // Duplicate key (phone / email already registered)
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ success: false, message: `${field} already registered` });
    }
    next(err);
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
/**
 * Universal login for Workers (phone + password) and Admins (email + password).
 * Body: { phone?, email?, password }
 */
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { phone, email, password } = req.body;

    if (!password || (!phone && !email)) {
      return res.status(400).json({
        success: false,
        message: 'Provide (phone or email) and password',
      });
    }

    // Explicitly select password (it's hidden by default in the schema)
    const query = phone ? { phone } : { email };
    const user = await User.findOne(query).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated — contact your admin' });
    }

    sendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
/**
 * Validates a stored JWT and returns fresh user data.
 * The frontend calls this on app load to auto-bypass the login screen.
 */
router.get('/me', protect(), (req, res) => {
  res.json({ success: true, user: req.user });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
