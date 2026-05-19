"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getPendingQueue,
  getPendingCount,
  markItemSynced,
  markItemFailed,
  clearSyncedItems,
} from "@/lib/offlineQueue";
import { markPrayer }          from "@/lib/actions/prayers";
import { checkAndAwardBadges } from "@/lib/actions/badges";

// ─── Return type ──────────────────────────────────────────────────────────────

export interface SyncQueueState {
  pendingCount:  number;
  syncing:       boolean;
  syncToast:     string | null;
  // Expose so PrayerCard can force a count refresh after queuing
  refreshCount:  () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSyncQueue(): SyncQueueState {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing,      setSyncing]      = useState(false);
  const [syncToast,    setSyncToast]    = useState<string | null>(null);

  // Hard lock — prevents concurrent sync runs (multiple online events, StrictMode)
  const syncLock = useRef(false);
  // Track whether the component is still mounted (avoids state updates after unmount)
  const mounted  = useRef(true);

  // ── refreshCount ────────────────────────────────────────────────────────────
  const refreshCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      if (mounted.current) setPendingCount(count);
    } catch { /* IndexedDB may not be ready yet */ }
  }, []);

  // ── showToast ───────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string, durationMs = 3500) => {
    if (!mounted.current) return;
    setSyncToast(msg);
    setTimeout(() => {
      if (mounted.current) setSyncToast(null);
    }, durationMs);
  }, []);

  // ── syncQueue ───────────────────────────────────────────────────────────────
  const syncQueue = useCallback(async () => {
    if (syncLock.current) return;

    const pending = await getPendingQueue();
    if (pending.length === 0) return;

    syncLock.current = true;
    if (mounted.current) setSyncing(true);

    let syncedCount = 0;
    let failedCount = 0;

    // Process items oldest-first (getPendingQueue returns sorted by date asc)
    for (const item of pending) {
      try {
        await markPrayer(
          item.prayerName,
          item.status,
          item.previousStatus,
          item.date            // ← pass the original date
        );
        await markItemSynced(item.id);
        syncedCount++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        await markItemFailed(item.id, msg);
        failedCount++;
        // Don't abort — sync the rest even if one fails
      }
    }

    // Award badges once for the whole sync batch
    if (syncedCount > 0) {
      try { await checkAndAwardBadges(); } catch { /* non-fatal */ }
    }

    // Remove synced items from the store
    await clearSyncedItems();

    syncLock.current = false;
    if (mounted.current) setSyncing(false);

    // Update pending count
    await refreshCount();

    // Show result toast
    if (syncedCount > 0 && failedCount === 0) {
      showToast(
        syncedCount === 1
          ? "Prayer synced 🌸"
          : `${syncedCount} prayers synced 🌸`
      );
    } else if (syncedCount > 0 && failedCount > 0) {
      showToast(`${syncedCount} synced · ${failedCount} failed — will retry`);
    } else if (failedCount > 0) {
      showToast("Sync failed — will retry when online");
    }
  }, [refreshCount, showToast]);

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    mounted.current = true;

    // Load initial count
    refreshCount();

    // If already online on mount, sync any queued items
    if (typeof navigator !== "undefined" && navigator.onLine) {
      syncQueue();
    }

    // Online: connection restored — flush the queue
    const handleOnline  = () => syncQueue();

    // Queue changed: a PrayerCard queued a new item — refresh the count
    const handleChanged = () => refreshCount();

    window.addEventListener("online",                 handleOnline);
    window.addEventListener("offline-queue-changed",  handleChanged);

    return () => {
      mounted.current = false;
      window.removeEventListener("online",                handleOnline);
      window.removeEventListener("offline-queue-changed", handleChanged);
    };
  }, [syncQueue, refreshCount]);

  return { pendingCount, syncing, syncToast, refreshCount };
}
