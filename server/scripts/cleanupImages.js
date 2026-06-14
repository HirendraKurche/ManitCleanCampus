const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); // Ensure it points to the root .env
const Complaint = require('../models/Complaint');
const Task = require('../models/Task');

async function cleanupImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to DB');

    // 1. Clean Complaints
    // Assuming Complaints have an array of strings in 'photos' or a string in 'photoUrl'
    const complaintsResult = await Complaint.updateMany(
      {}, // Match all to simplify, or use $regex
      { $set: { photos: [] } } // Assuming complaints use an array called photos. If single string, use $unset
    );
    console.log(`🧼 Cleaned up ${complaintsResult.modifiedCount} Complaints`);

    // 2. Clean Tasks
    const tasksResult = await Task.updateMany(
      {},
      { $set: { "evidence.photos": [], "evidence.beforePhoto": null, "evidence.afterPhoto": null } }
    );
    console.log(`🧼 Cleaned up ${tasksResult.modifiedCount} Tasks`);

    console.log('🎉 Cleanup complete. You can now test uploading new images.');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupImages();
