"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getProgress,
  saveBookmark,
  removeBookmark,
  saveScrollPosition,
} from "@/lib/actions/quran";

const lsBookmarkKey = (n: number) => `quran_bookmarks_${n}`;
const lsScrollKey   = (n: number) => `quran_pos_${n}`;
const lsLastReadKey = () => "quran_last_read";

interface UseQuranProgressOptions {
  surahNumber: number;
}

interface UseQuranProgressReturn {
  bookmarks:       number[];
  lastAyah:        number | null;
  syncing:         boolean;
  toggleBookmark:  (ayahNumber: number) => void;
  recordScrolledTo: (ayahNumber: number) => void;
}

type AnyFn = (...args: any[]) => void;

function useDebounceCallback<T extends AnyFn>(fn: T, delayMs: number): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useCallback(((...args: any[]) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fnRef.current(...args);
    }, delayMs);
  }) as T, [delayMs]);
}

export function useQuranProgress({ surahNumber }: UseQuranProgressOptions): UseQuranProgressReturn {
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(lsBookmarkKey(surahNumber));
      return raw ? (JSON.parse(raw) as number[]) : [];
    } catch {
      return [];
    }
  });

  const [lastAyah, setLastAyah] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(lsScrollKey(surahNumber));
      const parsed = raw ? parseInt(raw, 10) : NaN;
      return Number.isInteger(parsed) ? parsed : null;
    } catch {
      return null;
    }
  });

  const [syncing, setSyncing] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    hasFetched.current = false;
  }, [surahNumber]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    let cancelled = false;

    const hydrate = async () => {
      setSyncing(true);
      try {
        const progress = await getProgress(surahNumber);
        if (cancelled) return;

        if (progress) {
          const lsBookmarkRaw = localStorage.getItem(lsBookmarkKey(surahNumber));
          const lsBookmarks = lsBookmarkRaw ? (JSON.parse(lsBookmarkRaw) as number[]) : [];

          const lsScrollRaw = localStorage.getItem(lsScrollKey(surahNumber));
          const lsLastAyah = lsScrollRaw ? parseInt(lsScrollRaw, 10) : 1;

          const merged = Array.from(new Set(progress.bookmarkedAyahs.concat(lsBookmarks))).sort((a, b) => a - b);
          const resolvedAyah = Math.max(progress.lastAyah, Number.isInteger(lsLastAyah) ? lsLastAyah : 1);

          setBookmarks(merged);
          setLastAyah(resolvedAyah);

          localStorage.setItem(lsBookmarkKey(surahNumber), JSON.stringify(merged));
          localStorage.setItem(lsScrollKey(surahNumber), String(resolvedAyah));
          localStorage.setItem(lsLastReadKey(), String(surahNumber));

          const hasNewLocalBookmarks = lsBookmarks.some((b) => !progress.bookmarkedAyahs.includes(b));
          if (hasNewLocalBookmarks) {
            for (const ayah of lsBookmarks) {
              if (!progress.bookmarkedAyahs.includes(ayah)) {
                saveBookmark(surahNumber, ayah).catch(() => {});
              }
            }
          }
        } else {
          setSyncing(false);
        }
      } catch {
        // Network error; keep localStorage state as the optimistic source.
      } finally {
        if (!cancelled) setSyncing(false);
      }
    };

    hydrate();
    return () => { cancelled = true; };
  }, [surahNumber]);

  const toggleBookmark = useCallback((ayahNumber: number) => {
    setBookmarks((prev) => {
      const isBookmarked = prev.includes(ayahNumber);
      const next = isBookmarked
        ? prev.filter((n) => n !== ayahNumber)
        : [...prev, ayahNumber].sort((a, b) => a - b);

      localStorage.setItem(lsBookmarkKey(surahNumber), JSON.stringify(next));

      if (isBookmarked) {
        removeBookmark(surahNumber, ayahNumber).catch(() => {});
      } else {
        saveBookmark(surahNumber, ayahNumber).catch(() => {});
      }

      return next;
    });
  }, [surahNumber]);

  const syncScrollToServer = useDebounceCallback(
    useCallback((ayahNumber: number) => {
      saveScrollPosition(surahNumber, ayahNumber).catch(() => {});
    }, [surahNumber]),
    3000
  );

  const recordScrolledTo = useCallback((ayahNumber: number) => {
    localStorage.setItem(lsScrollKey(surahNumber), String(ayahNumber));
    localStorage.setItem(lsLastReadKey(), String(surahNumber));
    setLastAyah(ayahNumber);
    syncScrollToServer(ayahNumber);
  }, [surahNumber, syncScrollToServer]);

  return { bookmarks, lastAyah, syncing, toggleBookmark, recordScrolledTo };
}
