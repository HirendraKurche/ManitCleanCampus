// server/models/Notification.js
// In-app notification model — created whenever a student submits a complaint.
// Recipients: all active Admin users + Workers whose assignedAreas match the building.

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    type: {
      type:    String,
      enum:    ['new_complaint', 'complaint_assigned', 'complaint_completed', 'complaint_reopened'],
      default: 'new_complaint',
    },

    title:   { type: String, required: true },
    message: { type: String, required: true },

    complaintId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Complaint',
      default: null,
    },

    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
