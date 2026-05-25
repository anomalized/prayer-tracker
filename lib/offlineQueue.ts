// ─────────────────────────────────────────────────────────────────────────────
// Offline prayer queue using IndexedDB via idb.
//
// Only runs client-side. All functions guard against SSR with a DB promise
// that rejects immediately when window is undefined.
//
// Design:
//  - One row per queued prayer attempt.
//  - If the user changes their mind offline (ontime → late), the second
//    tap replaces the first via the (prayerName, date) uniqueness check.
//  - synced=true rows are cleaned up after each sync run.
// ─────────────────────────────────────────────────────────────────────────────

import { openDB, type IDBPDatabase } from "idb";
import { nanoid }                    from "nanoid";
import type { PrayerName, PrayerStatus } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QueuedPrayer {
  id:             string;           // nanoid
  userId:         string;           // account that created this offline item
  prayerName:     PrayerName;
  status:         PrayerStatus;
  previousStatus: PrayerStatus | null;  // needed for correct points delta on sync
  date:           string;           // YYYY-MM-DD — the day the prayer belongs to
  createdAt:      string;           // ISO timestamp of when it was queued
  synced:         boolean;
  syncError?:     string;           // last sync attempt error, if any
}

// ─── DB setup ─────────────────────────────────────────────────────────────────

const DB_NAME    = "salah-tracker-offline";
const STORE_NAME = "prayer-queue";
const DB_VERSION = 2;

// Singleton — opened once, reused for the lifetime of the page
let _db: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("[offlineQueue] IndexedDB not available in SSR"));
  }
  if (!_db) {
    _db = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          // Efficient pending-item queries
          store.createIndex("by_synced",    "synced");
          // Efficient date ordering
          store.createIndex("by_date",      "date");
          // Compound: detect duplicate prayer+date entries
          store.createIndex("by_prayer_date", ["prayerName", "date"]);
          store.createIndex("by_user_synced", ["userId", "synced"]);
          store.createIndex("by_user_prayer_date", ["userId", "prayerName", "date"]);
        } else if (oldVersion < 2) {
          const store = transaction.objectStore(STORE_NAME);
          if (!store.indexNames.contains("by_user_synced")) {
            store.createIndex("by_user_synced", ["userId", "synced"]);
          }
          if (!store.indexNames.contains("by_user_prayer_date")) {
            store.createIndex("by_user_prayer_date", ["userId", "prayerName", "date"]);
          }
          // Version 1 rows had no account owner. Dropping them avoids replaying
          // one signed-in user's offline prayers into another account.
          store.clear();
        }
      },
      blocked()  { if (process.env.NODE_ENV === "development") console.warn("[offlineQueue] DB upgrade blocked"); },
      blocking() { _db = null; /* reset so next call reopens */ },
    });
  }
  return _db;
}

// ─── Custom event — notifies useSyncQueue without prop drilling ───────────────

export function dispatchQueueChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("offline-queue-changed"));
  }
}

// ─── queuePrayerLog ───────────────────────────────────────────────────────────
// Adds a prayer to the offline queue.
// If an unsynced entry for the same (prayerName, date) already exists,
// it is replaced — the user changed their mind while offline.

export async function queuePrayerLog(
  userId:         string,
  prayerName:     PrayerName,
  status:         PrayerStatus,
  previousStatus: PrayerStatus | null,
  date:           string
): Promise<QueuedPrayer> {
  const db = await getDB();

  const item: QueuedPrayer = {
    id:             nanoid(),
    userId,
    prayerName,
    status,
    previousStatus,
    date,
    createdAt:      new Date().toISOString(),
    synced:         false,
  };

  const tx    = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  // Remove any existing unsynced entry for this prayer on this date
  const existing = await store
    .index("by_user_prayer_date")
    .get([userId, prayerName, date]);

  if (existing && !existing.synced) {
    await store.delete(existing.id);
  }

  await store.put(item);
  await tx.done;

  dispatchQueueChanged();
  return item;
}

// ─── getPendingQueue ──────────────────────────────────────────────────────────
// Returns all unsynced items, ordered by date ascending
// (oldest dates synced first — important for streak continuity).

export async function getPendingQueue(userId: string): Promise<QueuedPrayer[]> {
  try {
    const db  = await getDB();
    const all = (await db.getAll(STORE_NAME)) as QueuedPrayer[];
    return all
      .filter((q) => q.userId === userId && !q.synced)
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}

// ─── getPendingCount ──────────────────────────────────────────────────────────

export async function getPendingCount(userId: string): Promise<number> {
  try {
    const db  = await getDB();
    const all = (await db.getAll(STORE_NAME)) as QueuedPrayer[];
    return all.filter((q) => q.userId === userId && !q.synced).length;
  } catch {
    return 0;
  }
}

// ─── markItemSynced ───────────────────────────────────────────────────────────

export async function markItemSynced(id: string, userId: string): Promise<void> {
  try {
    const db   = await getDB();
    const tx   = db.transaction(STORE_NAME, "readwrite");
    const item = await tx.objectStore(STORE_NAME).get(id) as QueuedPrayer | undefined;
    if (item && item.userId === userId) {
      await tx.objectStore(STORE_NAME).put({ ...item, synced: true });
    }
    await tx.done;
    dispatchQueueChanged();
  } catch { /* non-fatal */ }
}

// ─── markItemFailed ───────────────────────────────────────────────────────────
// Preserves the item but records the error for debugging.

export async function markItemFailed(id: string, userId: string, error: string): Promise<void> {
  try {
    const db   = await getDB();
    const tx   = db.transaction(STORE_NAME, "readwrite");
    const item = await tx.objectStore(STORE_NAME).get(id) as QueuedPrayer | undefined;
    if (item && item.userId === userId) {
      await tx.objectStore(STORE_NAME).put({ ...item, syncError: error });
    }
    await tx.done;
  } catch { /* non-fatal */ }
}

// ─── clearQueueItem ───────────────────────────────────────────────────────────

export async function clearQueueItem(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
    dispatchQueueChanged();
  } catch { /* non-fatal */ }
}

// ─── clearSyncedItems ─────────────────────────────────────────────────────────
// Housekeeping — removes all synced rows. Called after each sync run.

export async function clearSyncedItems(userId: string): Promise<void> {
  try {
    const db    = await getDB();
    const all   = (await db.getAll(STORE_NAME)) as QueuedPrayer[];
    const tx    = db.transaction(STORE_NAME, "readwrite");
    for (const item of all.filter((q) => q.userId === userId && q.synced)) {
      await tx.objectStore(STORE_NAME).delete(item.id);
    }
    await tx.done;
  } catch { /* non-fatal */ }
}

// ─── clearAllItems ────────────────────────────────────────────────────────────
// Nuclear option — used by settings "clear data" or tests.

export async function clearAllItems(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear(STORE_NAME);
    dispatchQueueChanged();
  } catch { /* non-fatal */ }
}
