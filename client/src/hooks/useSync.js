import { useCallback, useRef, useState } from 'react';
import useOnlineStatus from './useOnlineStatus';
import api from '../utils/api';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';
import {
  getUnsyncedRecords,
  getLinkedImages,
  markSynced,
  garbageCollect,
  STORES,
} from '../utils/db';

/**
 * useSync — offline-first sync engine.
 *
 * When the device comes online (or on manual trigger):
 * 1. Reads all unsynced records from IndexedDB
 * 2. Optionally uploads linked image blobs to Cloudinary (skips if unconfigured)
 * 3. Attaches Cloudinary URLs to the JSON payload
 * 4. POSTs the batch to /api/sync
 * 5. Marks synced records + runs garbage collection
 *
 * Returns: { syncing, lastSync, error, syncNow }
 */
export default function useSync() {
  const isOnline = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);
  const lockRef = useRef(false);

  const syncNow = useCallback(async () => {
    if (!isOnline || lockRef.current) return;
    lockRef.current = true;
    setSyncing(true);
    setError(null);

    try {
      // 1. Gather unsynced records from all stores
      const [attendance, tasks, inventory] = await Promise.all([
        getUnsyncedRecords(STORES.ATTENDANCE),
        getUnsyncedRecords(STORES.TASKS),
        getUnsyncedRecords(STORES.INVENTORY),
      ]);

      // Nothing to sync
      if (!attendance.length && !tasks.length && !inventory.length) {
        setLastSync(new Date());
        return;
      }

      // 2. Try uploading images to Cloudinary (gracefully skip if not configured)
      //    Attendance selfies
      for (const record of attendance) {
        try {
          const images = await getLinkedImages(STORES.ATTENDANCE, record.id);
          for (const img of images) {
            try {
              const url = await uploadToCloudinary(img.blob, {
                folder: `facility/attendance`,
              });
              const stamp = record[img.field];
              if (stamp) stamp.imageUrl = url;
            } catch (e) {
              // Cloudinary not configured or upload failed — continue without image URL
              console.warn(`[sync] Image upload skipped for attendance ${record.id}:`, e.message);
            }
          }
        } catch (e) {
          console.warn('[sync] Could not load linked images:', e.message);
        }
      }

      //    Task before/after photos
      for (const record of tasks) {
        try {
          const images = await getLinkedImages(STORES.TASKS, record.id);
          for (const img of images) {
            try {
              const url = await uploadToCloudinary(img.blob, {
                folder: `facility/tasks`,
              });
              if (img.field === 'beforePhoto') record.beforePhotoUrl = url;
              if (img.field === 'afterPhoto') record.afterPhotoUrl = url;
            } catch (e) {
              console.warn(`[sync] Image upload skipped for task ${record.id}:`, e.message);
            }
          }
        } catch (e) {
          console.warn('[sync] Could not load linked images:', e.message);
        }
      }

      // 3. POST batch to /api/sync (always proceed, even without image URLs)
      const payload = {};
      if (attendance.length) payload.attendance = attendance;
      if (tasks.length) payload.tasks = tasks;
      if (inventory.length) payload.inventory = inventory;

      const { data } = await api.post('/api/sync', payload);

      // 4. Mark all as synced
      for (const r of attendance) await markSynced(STORES.ATTENDANCE, r.id);
      for (const r of tasks) await markSynced(STORES.TASKS, r.id);
      for (const r of inventory) await markSynced(STORES.INVENTORY, r.id);

      // 5. Garbage collect — free device storage immediately
      await Promise.all([
        garbageCollect(STORES.ATTENDANCE),
        garbageCollect(STORES.TASKS),
        garbageCollect(STORES.INVENTORY),
      ]);

      setLastSync(new Date());
      console.log('[sync] Complete:', data);
    } catch (err) {
      console.error('[sync] Failed:', err);
      setError(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
      lockRef.current = false;
    }
  }, [isOnline]);

  return { syncing, lastSync, error, syncNow, isOnline };
}
