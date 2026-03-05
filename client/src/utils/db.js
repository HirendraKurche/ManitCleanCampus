import { openDB } from 'idb';

const DB_NAME = 'facility-mgmt';
const DB_VERSION = 1;

// Store names
export const STORES = {
  ATTENDANCE: 'attendance',
  TASKS: 'tasks',
  INVENTORY: 'inventory',
  IMAGES: 'images', // blob storage for offline photos
};

/**
 * Opens (or creates) the IndexedDB database.
 * Each store uses auto-incrementing keys and indexes for efficient querying.
 */
function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // ── Attendance store ───────────────────────────────────────────
      if (!db.objectStoreNames.contains(STORES.ATTENDANCE)) {
        const store = db.createObjectStore(STORES.ATTENDANCE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-date', 'date');
        store.createIndex('by-synced', 'synced');
      }

      // ── Tasks store ────────────────────────────────────────────────
      if (!db.objectStoreNames.contains(STORES.TASKS)) {
        const store = db.createObjectStore(STORES.TASKS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-date', 'date');
        store.createIndex('by-synced', 'synced');
        store.createIndex('by-status', 'status');
      }

      // ── Inventory store ────────────────────────────────────────────
      if (!db.objectStoreNames.contains(STORES.INVENTORY)) {
        const store = db.createObjectStore(STORES.INVENTORY, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-date', 'date');
        store.createIndex('by-synced', 'synced');
      }

      // ── Images blob store ──────────────────────────────────────────
      // Stores { id, blob, linkedStore, linkedId, field }
      if (!db.objectStoreNames.contains(STORES.IMAGES)) {
        const store = db.createObjectStore(STORES.IMAGES, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-linked', ['linkedStore', 'linkedId']);
      }
    },
  });
}

// ─── Generic CRUD helpers ─────────────────────────────────────────────────────

/** Add a record to a store. Returns the generated key. */
export async function addRecord(storeName, data) {
  const db = await getDB();
  return db.add(storeName, { ...data, synced: false, createdAt: new Date().toISOString() });
}

/** Get a single record by key. */
export async function getRecord(storeName, key) {
  const db = await getDB();
  return db.get(storeName, key);
}

/** Update a record (must include the key). */
export async function updateRecord(storeName, data) {
  const db = await getDB();
  return db.put(storeName, data);
}

/** Delete a record by key. */
export async function deleteRecord(storeName, key) {
  const db = await getDB();
  return db.delete(storeName, key);
}

/** Get all records from a store. */
export async function getAllRecords(storeName) {
  const db = await getDB();
  return db.getAll(storeName);
}

/** Get all unsynced records from a store. */
export async function getUnsyncedRecords(storeName) {
  const db = await getDB();
  const all = await db.getAll(storeName);
  return all.filter((r) => r.synced === false);
}

/** Mark a record as synced. */
export async function markSynced(storeName, key) {
  const db = await getDB();
  const record = await db.get(storeName, key);
  if (record) {
    record.synced = true;
    record.syncedAt = new Date().toISOString();
    await db.put(storeName, record);
  }
}

// ─── Image Blob helpers ──────────────────────────────────────────────────────

/**
 * Save an image blob linked to a record in another store.
 * @param {Blob} blob - The image blob from camera capture
 * @param {string} linkedStore - e.g. 'attendance' or 'tasks'
 * @param {number} linkedId - The key of the linked record
 * @param {string} field - e.g. 'selfie', 'beforePhoto', 'afterPhoto'
 */
export async function saveImageBlob(blob, linkedStore, linkedId, field) {
  const db = await getDB();
  return db.add(STORES.IMAGES, {
    blob,
    linkedStore,
    linkedId,
    field,
    createdAt: new Date().toISOString(),
  });
}

/** Get all image blobs linked to a specific record. */
export async function getLinkedImages(linkedStore, linkedId) {
  const db = await getDB();
  const tx = db.transaction(STORES.IMAGES, 'readonly');
  const index = tx.store.index('by-linked');
  return index.getAll([linkedStore, linkedId]);
}

// ─── Garbage Collection ──────────────────────────────────────────────────────

/**
 * Delete all synced records + their linked images.
 * Call this AFTER a successful sync to free device storage.
 */
export async function garbageCollect(storeName) {
  const db = await getDB();
  const tx = db.transaction([storeName, STORES.IMAGES], 'readwrite');
  const store = tx.objectStore(storeName);
  const imageStore = tx.objectStore(STORES.IMAGES);

  let cursor = await store.index('by-synced').openCursor(true); // synced === true
  while (cursor) {
    // Delete linked images
    const imgIndex = imageStore.index('by-linked');
    let imgCursor = await imgIndex.openCursor([storeName, cursor.value.id]);
    while (imgCursor) {
      await imgCursor.delete();
      imgCursor = await imgCursor.continue();
    }
    // Delete the synced record itself
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.done;
}

/** Nuke everything — useful for logout or debug. */
export async function clearAllStores() {
  const db = await getDB();
  const storeNames = Object.values(STORES);
  const tx = db.transaction(storeNames, 'readwrite');
  await Promise.all(storeNames.map((name) => tx.objectStore(name).clear()));
  await tx.done;
}

export default {
  addRecord,
  getRecord,
  updateRecord,
  deleteRecord,
  getAllRecords,
  getUnsyncedRecords,
  markSynced,
  saveImageBlob,
  getLinkedImages,
  garbageCollect,
  clearAllStores,
  STORES,
};
