const express = require('express');
const protect = require('../middleware/auth');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const { ItemCatalogue, InventoryTx } = require('../models/Item');

const router = express.Router();

// All admin routes require Admin role
router.use(protect(['Admin']));

// ─── User Management ──────────────────────────────────────────────────────────

// GET  /api/admin/users  — list all workers
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:employeeCode  — update name, assignedAreas, isActive, role
router.patch('/users/:employeeCode', async (req, res, next) => {
  try {
    const { name, assignedAreas, isActive, role } = req.body;
    const user = await User.findOneAndUpdate(
      { employeeCode: req.params.employeeCode },
      { $set: { name, assignedAreas, isActive, role } },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// ─── Live Roster (GPS positions) ─────────────────────────────────────────────
/**
 * Returns each worker's most recent check-in GPS for the map view.
 * Date filter: today by default, or ?date=YYYY-MM-DD
 */
router.get('/roster', async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const records = await Attendance.find({ date })
      .populate('worker', 'name employeeCode assignedAreas')
      .lean();

    const roster = records.map((r) => ({
      employeeCode: r.worker?.employeeCode,
      name:         r.worker?.name,
      assignedAreas: r.worker?.assignedAreas,
      checkIn:      r.checkIn,
      breakStart:   r.breakStart,
      breakEnd:     r.breakEnd,
      checkOut:     r.checkOut,
      flagged:      r.flaggedForReview,
    }));

    res.json({ success: true, date, data: roster });
  } catch (err) { next(err); }
});

// ─── Task Audit Gallery ────────────────────────────────────────────────────────
/**
 * Returns tasks with Before/After photos.
 * Supports filters: ?date=YYYY-MM-DD &status= &flagged=true &aiStatus=flagged_identical
 */
router.get('/tasks', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.date)     filter.date = req.query.date;
    if (req.query.status)   filter.status = req.query.status;
    if (req.query.flagged)  filter.flaggedForReview = req.query.flagged === 'true';
    if (req.query.aiStatus) filter.photoAiStatus = req.query.aiStatus;
    if (req.query.workerId) filter.worker = req.query.workerId;
    if (req.query.area)     filter.area = req.query.area;

    const tasks = await Task.find(filter)
      .populate('worker', 'name employeeCode')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, total: tasks.length, data: tasks });
  } catch (err) { next(err); }
});

// PATCH /api/admin/tasks/:id/review  — admin annotates a flagged task
router.patch('/tasks/:id/review', async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: { flaggedForReview: false, reviewNote: req.body.note } },
      { new: true }
    );
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) { next(err); }
});

// ─── Inventory Overview ────────────────────────────────────────────────────────

// GET /api/admin/inventory  — aggregated stock per item
router.get('/inventory', async (req, res, next) => {
  try {
    const summary = await InventoryTx.aggregate([
      {
        $group: {
          _id:        '$item',
          totalQty:   { $sum: '$qty' },
          txCount:    { $sum: 1 },
          lastUpdate: { $max: '$createdAt' },
        },
      },
      { $lookup: { from: 'itemcatalogues', localField: '_id', foreignField: '_id', as: 'item' } },
      { $unwind: '$item' },
      { $project: { _id: 0, item: '$item.name', unit: '$item.unit', category: '$item.category', totalQty: 1, txCount: 1, lastUpdate: 1 } },
      { $sort: { item: 1 } },
    ]);
    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
});

// ─── Flagged Records Overview ─────────────────────────────────────────────────
router.get('/flagged', async (req, res, next) => {
  try {
    const [attendance, tasks, inventory] = await Promise.all([
      Attendance.find({ flaggedForReview: true }).populate('worker', 'name employeeCode').lean(),
      Task.find({ flaggedForReview: true }).populate('worker', 'name employeeCode').lean(),
      InventoryTx.find({ flaggedForReview: true }).populate('worker', 'name employeeCode').populate('item', 'name').lean(),
    ]);
    res.json({ success: true, data: { attendance, tasks, inventory } });
  } catch (err) { next(err); }
});

// ─── Item Catalogue Management ────────────────────────────────────────────────

router.get('/items', async (req, res, next) => {
  try {
    const items = await ItemCatalogue.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
});

router.post('/items', async (req, res, next) => {
  try {
    const item = await ItemCatalogue.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) { next(err); }
});

router.patch('/items/:id', async (req, res, next) => {
  try {
    const item = await ItemCatalogue.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
});

module.exports = router;
