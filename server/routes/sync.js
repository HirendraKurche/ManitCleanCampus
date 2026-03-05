const express = require('express');
const protect = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const { InventoryTx } = require('../models/Item');

const router = express.Router();

// ─── Time-Travel Exploit Detection threshold ──────────────────────────────────
const DRIFT_THRESHOLD_SECONDS = 5 * 60; // flag if device time differs from server time by > 5 min

/**
 * Calculates absolute drift in seconds between a device-reported timestamp
 * and the server receipt time, and flags the record if it exceeds the threshold.
 */
function evaluateDrift(deviceTimestamp) {
  if (!deviceTimestamp) return { timeDriftSeconds: null, flaggedForReview: false };
  const serverNow = Date.now();
  const deviceTime = new Date(deviceTimestamp).getTime();
  const driftSeconds = Math.abs(serverNow - deviceTime) / 1000;
  return {
    timeDriftSeconds: Math.round(driftSeconds),
    flaggedForReview: driftSeconds > DRIFT_THRESHOLD_SECONDS,
  };
}

// ─── POST /api/sync ───────────────────────────────────────────────────────────
/**
 * Bulk offline sync endpoint.
 * 
 * Workers queue records in IndexedDB while offline. When connectivity returns,
 * the SW Background Sync fires and this endpoint receives all queued JSON records.
 * Images are already uploaded to Cloudinary by this point — only URLs arrive here.
 *
 * Body: {
 *   attendance?: AttendanceRecord[],
 *   tasks?:      TaskRecord[],
 *   inventory?:  InventoryTxRecord[],
 * }
 *
 * Each record must include a `deviceTimestamp` field (ISO string) for drift check.
 *
 * Returns: { success, saved: { attendance, tasks, inventory }, flagged: number }
 */
router.post('/', protect(['Worker', 'Admin']), async (req, res, next) => {
  try {
    const workerId = req.user._id;
    const serverNow = new Date();
    const results = { attendance: 0, tasks: 0, inventory: 0 };
    let totalFlagged = 0;

    // ── 1. Attendance Records ─────────────────────────────────────────────────
    if (Array.isArray(req.body.attendance)) {
      for (const record of req.body.attendance) {
        const drift = evaluateDrift(record.deviceTimestamp);
        if (drift.flaggedForReview) totalFlagged++;

        // Stamp serverTime on each event for audit trail
        const stampServerTime = (stamp) =>
          stamp ? { ...stamp, serverTime: serverNow } : undefined;

        try {
          await Attendance.findOneAndUpdate(
            { worker: workerId, date: record.date },
            {
              $set: {
                worker:    workerId,
                date:      record.date,
                checkIn:   stampServerTime(record.checkIn),
                breakStart: stampServerTime(record.breakStart),
                breakEnd:  stampServerTime(record.breakEnd),
                checkOut:  stampServerTime(record.checkOut),
                isOfflineSync:    true,
                flaggedForReview: drift.flaggedForReview,
                timeDriftSeconds: drift.timeDriftSeconds,
              },
            },
            { upsert: true, new: true }
          );
          results.attendance++;
        } catch (e) {
          // Log but don't abort the entire batch
          console.error('[sync] attendance record error:', e.message, record);
        }
      }
    }

    // ── 2. Task Records ───────────────────────────────────────────────────────
    if (Array.isArray(req.body.tasks)) {
      for (const record of req.body.tasks) {
        const drift = evaluateDrift(record.deviceTimestamp);
        if (drift.flaggedForReview) totalFlagged++;

        try {
          // Use client-provided localId for idempotency if supplied
          const filter = record.localId
            ? { 'meta.localId': record.localId, worker: workerId }
            : { worker: workerId, area: record.area, date: record.date, startedAt: record.startedAt };

          await Task.findOneAndUpdate(
            filter,
            {
              $set: {
                worker:          workerId,
                area:            record.area,
                startedAt:       record.startedAt,
                completedAt:     record.completedAt,
                durationSeconds: record.durationSeconds,
                beforePhotoUrl:  record.beforePhotoUrl,
                afterPhotoUrl:   record.afterPhotoUrl,
                beforeGps:       record.beforeGps,
                afterGps:        record.afterGps,
                status:          record.status || 'completed',
                date:            record.date,
                isOfflineSync:    true,
                flaggedForReview: drift.flaggedForReview,
                timeDriftSeconds: drift.timeDriftSeconds,
                photoAiStatus:   'unchecked', // queued for future AI vision check
              },
            },
            { upsert: true, new: true }
          );
          results.tasks++;
        } catch (e) {
          console.error('[sync] task record error:', e.message, record);
        }
      }
    }

    // ── 3. Inventory Transactions ─────────────────────────────────────────────
    if (Array.isArray(req.body.inventory)) {
      for (const record of req.body.inventory) {
        const drift = evaluateDrift(record.deviceTimestamp);
        if (drift.flaggedForReview) totalFlagged++;

        try {
          await InventoryTx.create({
            worker:           workerId,
            item:             record.itemId,
            qty:              record.qty,
            notes:            record.notes,
            gps:              record.gps,
            date:             record.date,
            isOfflineSync:    true,
            flaggedForReview: drift.flaggedForReview,
            timeDriftSeconds: drift.timeDriftSeconds,
          });
          results.inventory++;
        } catch (e) {
          console.error('[sync] inventory record error:', e.message, record);
        }
      }
    }

    res.json({
      success: true,
      saved:   results,
      flagged: totalFlagged,
      message: totalFlagged > 0
        ? `${totalFlagged} record(s) flagged for Admin review due to device time drift`
        : 'All records synced cleanly',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
