const mongoose = require('mongoose');

// ─── Complaint Model ──────────────────────────────────────────────────────────
// Integrates with existing Task model via linkedTaskId.
// When admin assigns a complaint to a worker, a Task doc is auto-created
// and stored in linkedTaskId — so the worker uses the existing TasksPage flow.
//
// Follows the same patterns as Task.js:
//   - flaggedForReview, timeDriftSeconds, reviewNote for admin audit
//   - date: 'YYYY-MM-DD' for easy daily grouping
//   - gps sub-schema matching Task.beforeGps / afterGps shape

const complaintSchema = new mongoose.Schema(
  {
    // ── Submitted by (Student role) ───────────────────────────────────────────
    student: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    // ── Category → drives smart routing to correct supervisor ─────────────────
    // Add more as needed — routing logic lives in complaints.js route
    category: {
      type:     String,
      enum:     ['cleaning', 'water', 'electrical', 'garbage', 'other'],
      required: true,
    },

    description: {
      type:      String,
      trim:      true,
      maxlength: 500,
    },

    // ── Photo proof (Cloudinary URL — same upload flow as task photos) ─────────
    photoUrl: { type: String, default: null },

    // ── Location ──────────────────────────────────────────────────────────────
    // GPS (outdoor / where available)
    gps: {
      latitude:  { type: Number },
      longitude: { type: Number },
    },

    // Indoor structured location — for when GPS fails inside buildings
    // Worker selects: Building → Floor → Area from dropdowns in UI
    indoorLocation: {
      building: { type: String, trim: true },  // e.g. "Library Block"
      floor:    { type: String, trim: true },  // e.g. "Ground Floor"
      area:     { type: String, trim: true },  // e.g. "Men's Washroom"
    },

    // ── Full lifecycle status ─────────────────────────────────────────────────
    // submitted → assigned → in_progress → completed → verified
    // Student can reopen 'verified' → 'reopened' if unsatisfied
    status: {
      type:    String,
      enum:    ['submitted', 'assigned', 'in_progress', 'completed', 'verified', 'reopened'],
      default: 'submitted',
      index:   true,
    },

    // ── Assignment ────────────────────────────────────────────────────────────
    assignedTo: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',   // Worker
      default: null,
    },
    assignedBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',   // Admin / Supervisor
      default: null,
    },
    assignedAt: { type: Date, default: null },

    // ── Linked Task ───────────────────────────────────────────────────────────
    // Created automatically when admin assigns this complaint to a worker.
    // The worker then resolves it via the existing TasksPage flow (before/after
    // photo + timer). No separate UI needed on the worker side.
    linkedTaskId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Task',
      default: null,
    },

    // ── Duplicate / upvote system ─────────────────────────────────────────────
    // If this is a duplicate, it points to the original complaint.
    // Students upvote the original instead of creating a new one.
    parentComplaintId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Complaint',
      default: null,
    },
    upvoteCount: { type: Number, default: 0 },
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // ── Student feedback after resolution ────────────────────────────────────
    studentFeedback:  { type: String, trim: true },
    studentRating:    { type: Number, min: 1, max: 5 },
    reopenReason:     { type: String, trim: true },

    // ── Admin review ──────────────────────────────────────────────────────────
    // Same pattern as Task.reviewNote
    flaggedForReview: { type: Boolean, default: false },
    reviewNote:       { type: String },

    date: { type: String, index: true }, // YYYY-MM-DD of submission
  },
  { timestamps: true }
);

// Geospatial index for duplicate detection (50m radius query)
complaintSchema.index({ 'gps.latitude': 1, 'gps.longitude': 1 });
complaintSchema.index({ category: 1, status: 1, date: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
