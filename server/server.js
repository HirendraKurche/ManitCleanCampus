// server/server.js — UPDATED
// Changes from original:
//   1. Added buildingRoutes (public + admin) mounting
//   2. Everything else identical

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes      = require('./routes/auth');
const cloudinaryRoutes = require('./routes/cloudinary');
const uploadRoutes = require('./routes/upload');
const syncRoutes      = require('./routes/sync');
const adminRoutes     = require('./routes/admin');
const complaintRoutes = require('./routes/complaints');
const notificationRoutes = require('./routes/notifications');
const pushRoutes = require('./routes/push');
// Task 2: building routes — two routers from one file
const { publicRouter: buildingPublicRoutes, adminRouter: buildingAdminRoutes } = require('./routes/buildingRoutes');

const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────────
// Disable strict Cross-Origin Resource Policy so frontend can load images
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/cloudinary',    cloudinaryRoutes);
app.use('/api/upload',        uploadRoutes);

// Serve local uploads statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/sync',          syncRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/complaints',    complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/push',          pushRoutes);

// Task 2: Building management routes
// Public endpoint — student/worker dropdown (no auth)
app.use('/api/buildings', buildingPublicRoutes);
// Admin CRUD — protected inside the router with protect(['Admin'])
app.use('/api/admin/buildings', buildingAdminRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const http = require('http');
const socketIoInit = require('./utils/socket').init;

// ─── DB + Start ───────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    
    // Create HTTP server and wrap Express app
    const server = http.createServer(app);
    
    // Initialize Socket.io
    socketIoInit(server);
    
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
