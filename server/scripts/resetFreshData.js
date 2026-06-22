/**
 * Fresh reset for operational data after changing storage.
 *
 * Usage:
 *   node server/scripts/resetFreshData.js
 *
 * This clears complaint/task/attendance/inventory/notification records and
 * removes VM-local uploaded image files from server/uploads.
 * It intentionally keeps users, buildings, and auth setup intact.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const Complaint = require('../models/Complaint');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const { InventoryTx } = require('../models/Item');
const Notification = require('../models/Notification');

const uploadsDir = path.resolve(__dirname, '../uploads');

async function resetFreshData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const [complaints, tasks, attendance, inventory, notifications] = await Promise.all([
      Complaint.deleteMany({}),
      Task.deleteMany({}),
      Attendance.deleteMany({}),
      InventoryTx.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log(`🧹 Deleted complaints: ${complaints.deletedCount}`);
    console.log(`🧹 Deleted tasks: ${tasks.deletedCount}`);
    console.log(`🧹 Deleted attendance: ${attendance.deletedCount}`);
    console.log(`🧹 Deleted inventory transactions: ${inventory.deletedCount}`);
    console.log(`🧹 Deleted notifications: ${notifications.deletedCount}`);

    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        fs.rmSync(path.join(uploadsDir, file), { recursive: true, force: true });
      }
      console.log(`🧼 Cleared ${files.length} file(s) from server/uploads`);
    } else {
      console.log('ℹ️  server/uploads does not exist yet');
    }

    console.log('🎉 Fresh reset complete. Re-seed only what you need after this.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Fresh reset failed:', err.message);
    process.exit(1);
  }
}

resetFreshData();