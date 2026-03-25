const express = require('express');
const protect = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const Task = require('../models/Task');

const router = express.Router();

// ─── Smart Routing Map ────────────────────────────────────────────────────────
// Maps complaint category → which supervisor / admin area handles it.
// Used in admin complaint list to filter by supervisorType.
// Extend this as needed.
const CATEGORY_ROUTING = {
  cleaning:    'sanitation',
  garbage:     'sanitation',
  water:       'maintenance',
  electrical:  'maintenance',
  other:       'general',
};

// ─── Duplicate Detection Helper ───────────────────────────────────────────────
// Returns the nearest open complaint of the same category within ~50 metres.
// Uses simple bounding-box math (good enough at campus scale; no $geoNear needed).
async function findNearbyDuplicate(category, lat, lng) {
  if (!lat || !lng) return null;

  // ~50 m in degrees of latitude ≈ 0.00045°; longitude slightly less at MANIT's latitude
  const DELTA = 0.00050;
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24 h

  return Complaint.findOne({
    category,
    parentComplaintId: null,                         // only originals, not duplicates
    status: { $in: ['submitted', 'assigned', 'in_progress', 'reopened'] },
    createdAt: { $gte: cutoff },
    'gps.latitude':  { $gte: lat - DELTA, $lte: lat + DELTA },
    'gps.longitude': { $gte: lng - DELTA, $lte: lng + DELTA },
  }).lean();
}

// ─── POST /api/complaints ─────────────────────────────────────────────────────
// Student submits a new complaint.
// Automatically detects duplicates and returns the original if found.
// Body: { category, description, photoUrl?, gps?, indoorLocation? }
router.post('/', protect(['Student']), async (req, res, next) => {
  try {
    const { category, description, photoUrl, gps, indoorLocation } = req.body;

    if (!category) {
      return res.status(400).json({ success: false, message: 'category is required' });
    }

    // ── Duplicate check ───────────────────────────────────────────────────────
    const duplicate = await findNearbyDuplicate(
      category,
      gps?.latitude,
      gps?.longitude
    );

    if (duplicate) {
      return res.status(200).json({
        success: true,
        isDuplicate: true,
        message: 'A similar complaint already exists nearby. You can upvote it instead.',
        existingComplaint: {
          _id:         duplicate._id,
          category:    duplicate.category,
          description: duplicate.description,
          status:      duplicate.status,
          upvoteCount: duplicate.upvoteCount,
          indoorLocation: duplicate.indoorLocation,
          createdAt:   duplicate.createdAt,
        },
      });
    }

    // ── Create new complaint ──────────────────────────────────────────────────
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);

    const complaint = await Complaint.create({
      student:        req.user._id,
      category,
      description,
      photoUrl:       photoUrl || null,
      gps,
      indoorLocation,
      date:           today,
      supervisorType: CATEGORY_ROUTING[category] || 'general',
    });

    res.status(201).json({ success: true, isDuplicate: false, data: complaint });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/complaints/:id/upvote ─────────────────────────────────────────
// Student upvotes an existing complaint (instead of filing a duplicate).
router.post('/:id/upvote', protect(['Student']), async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Prevent double-upvote
    const alreadyVoted = complaint.upvotedBy.some(
      (uid) => uid.toString() === req.user._id.toString()
    );
    if (alreadyVoted) {
      return res.status(409).json({ success: false, message: 'You already upvoted this complaint' });
    }

    complaint.upvoteCount += 1;
    complaint.upvotedBy.push(req.user._id);
    await complaint.save();

    res.json({ success: true, upvoteCount: complaint.upvoteCount });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/complaints/mine ─────────────────────────────────────────────────
// Student views their own complaint history.
router.get('/mine', protect(['Student']), async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ student: req.user._id })
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name employeeCode')
      .lean();

    res.json({ success: true, total: complaints.length, data: complaints });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/complaints ──────────────────────────────────────────────────────
// Admin/Supervisor views all complaints with filters.
// Query: ?status= &category= &date= &supervisorType= &workerId=
router.get('/', protect(['Admin']), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status)         filter.status = req.query.status;
    if (req.query.category)       filter.category = req.query.category;
    if (req.query.date)           filter.date = req.query.date;
    if (req.query.supervisorType) filter.supervisorType = req.query.supervisorType;
    if (req.query.workerId)       filter.assignedTo = req.query.workerId;

    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .populate('student', 'name employeeCode email')
      .populate('assignedTo', 'name employeeCode')
      .populate('assignedBy', 'name')
      .lean();

    res.json({ success: true, total: complaints.length, data: complaints });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/complaints/:id ──────────────────────────────────────────────────
// Single complaint detail (Admin or the student who submitted it).
router.get('/:id', protect(['Admin', 'Student']), async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('student', 'name email')
      .populate('assignedTo', 'name employeeCode')
      .populate('linkedTaskId');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    // Students can only see their own complaints
    if (
      req.user.role === 'Student' &&
      complaint.student._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/complaints/:id/assign ────────────────────────────────────────
// Admin assigns complaint to a worker.
// This also creates a linked Task document so the worker sees it in TasksPage.
// Body: { workerId, area? }
router.patch('/:id/assign', protect(['Admin']), async (req, res, next) => {
  try {
    const { workerId, area } = req.body;
    if (!workerId) {
      return res.status(400).json({ success: false, message: 'workerId is required' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    // Derive area label from complaint location (indoor > GPS)
    const taskArea = area ||
      (complaint.indoorLocation?.area
        ? `${complaint.indoorLocation.building} - ${complaint.indoorLocation.area}`
        : `Complaint #${complaint._id.toString().slice(-6)}`);

    // Create a linked Task so the worker can use the existing TasksPage flow
    const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);

    const task = await Task.create({
      worker: workerId,
      area:   taskArea,
      status: 'pending',
      date:   today,
      // complaintId stored as a note in the area label — no schema change needed.
      // If you want a proper FK later: add `complaintId` field to Task.js
    });

    complaint.assignedTo  = workerId;
    complaint.assignedBy  = req.user._id;
    complaint.assignedAt  = new Date();
    complaint.status      = 'assigned';
    complaint.linkedTaskId = task._id;
    await complaint.save();

    res.json({ success: true, data: complaint, linkedTask: task });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/complaints/:id/verify ────────────────────────────────────────
// Admin/Supervisor marks a completed complaint as verified.
// Body: { note? }
router.patch('/:id/verify', protect(['Admin']), async (req, res, next) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'verified', reviewNote: req.body.note } },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/complaints/:id/reopen ────────────────────────────────────────
// Student reopens a verified complaint if they are not satisfied.
// Body: { reason }
router.patch('/:id/reopen', protect(['Student']), async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    // Only the student who submitted can reopen
    if (complaint.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (complaint.status !== 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Only verified complaints can be reopened',
      });
    }

    complaint.status       = 'reopened';
    complaint.reopenReason = req.body.reason;
    await complaint.save();

    res.json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/complaints/:id/feedback ──────────────────────────────────────
// Student submits feedback + rating after resolution.
// Body: { feedback, rating (1-5) }
router.patch('/:id/feedback', protect(['Student']), async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    if (complaint.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    complaint.studentFeedback = req.body.feedback;
    complaint.studentRating   = req.body.rating;
    await complaint.save();

    res.json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
});

// ─── Webhook: called by sync.js after a task linked to a complaint completes ──
// When worker completes a task that has a linkedTaskId on a complaint,
// we auto-update the complaint status to 'completed'.
// Call this from sync.js after saving task records — see integration note below.
router.patch('/:id/task-completed', protect(['Worker', 'Admin']), async (req, res, next) => {
  try {
    const complaint = await Complaint.findOneAndUpdate(
      { linkedTaskId: req.params.id, status: 'in_progress' },
      { $set: { status: 'completed' } },
      { new: true }
    );
    // Fail silently if no complaint is linked — not every task has one
    res.json({ success: true, data: complaint });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
