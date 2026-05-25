"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getProgress,
  saveBookmark,
  removeBookmark,
  saveScrollPosition,
} from "@/lib/actions/quran";
import { createClient } from "@/lib/supabase/client";

const lsBookmarkKey = (userId: string, n: number) => `quran:${userId}:bookmarks:${n}`;
const lsScrollKey   = (userId: string, n: number) => `quran:${userId}:pos:${n}`;
const lsLastReadKey = (userId: string) => `quran:${userId}:last_read`;

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
  const [userId, setUserId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [lastAyah, setLastAyah] = useState<number | null>(null);

  const [syncing, setSyncing] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!cancelled) setUserId(user?.id ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    hasFetched.current = false;
    setBookmarks([]);
    setLastAyah(null);
  }, [surahNumber, userId]);

  useEffect(() => {
    if (!userId) {
      setSyncing(false);
      return;
    }
    if (hasFetched.current) return;
    hasFetched.current = true;

    let cancelled = false;

    const hydrate = async () => {
      setSyncing(true);
      try {
        const progress = await getProgress(surahNumber);
        if (cancelled) return;

        const lsBookmarkRaw = localStorage.getItem(lsBookmarkKey(userId, surahNumber));
        const lsBookmarks = lsBookmarkRaw ? (JSON.parse(lsBookmarkRaw) as number[]) : [];

        const lsScrollRaw = localStorage.getItem(lsScrollKey(userId, surahNumber));
        const lsLastAyah = lsScrollRaw ? parseInt(lsScrollRaw, 10) : 1;

        if (progress) {

          const merged = Array.from(new Set(progress.bookmarkedAyahs.concat(lsBookmarks))).sort((a, b) => a - b);
          const resolvedAyah = Math.max(progress.lastAyah, Number.isInteger(lsLastAyah) ? lsLastAyah : 1);

          setBookmarks(merged);
          setLastAyah(resolvedAyah);

          localStorage.setItem(lsBookmarkKey(userId, surahNumber), JSON.stringify(merged));
          localStorage.setItem(lsScrollKey(userId, surahNumber), String(resolvedAyah));
          localStorage.setItem(lsLastReadKey(userId), String(surahNumber));

          const hasNewLocalBookmarks = lsBookmarks.some((b) => !progress.bookmarkedAyahs.includes(b));
          if (hasNewLocalBookmarks) {
            for (const ayah of lsBookmarks) {
              if (!progress.bookmarkedAyahs.includes(ayah)) {
                saveBookmark(surahNumber, ayah).catch(() => {});
              }
            }
          }
        } else {
          setBookmarks(lsBookmarks);
          setLastAyah(Number.isInteger(lsLastAyah) ? lsLastAyah : null);
        }
      } catch {
        // Network error; keep localStorage state as the optimistic source.
      } finally {
        if (!cancelled) setSyncing(false);
      }
    };

    hydrate();
    return () => { cancelled = true; };
  }, [surahNumber, userId]);

  const toggleBookmark = useCallback((ayahNumber: number) => {
    if (!userId) return;

    setBookmarks((prev) => {
      const isBookmarked = prev.includes(ayahNumber);
      const next = isBookmarked
        ? prev.filter((n) => n !== ayahNumber)
        : [...prev, ayahNumber].sort((a, b) => a - b);

      localStorage.setItem(lsBookmarkKey(userId, surahNumber), JSON.stringify(next));

      if (isBookmarked) {
        removeBookmark(surahNumber, ayahNumber).catch(() => {});
      } else {
        saveBookmark(surahNumber, ayahNumber).catch(() => {});
      }

      return next;
    });
  }, [surahNumber, userId]);

  const syncScrollToServer = useDebounceCallback(
    useCallback((ayahNumber: number) => {
      saveScrollPosition(surahNumber, ayahNumber).catch(() => {});
    }, [surahNumber]),
    3000
  );

  const recordScrolledTo = useCallback((ayahNumber: number) => {
    if (!userId) return;

    localStorage.setItem(lsScrollKey(userId, surahNumber), String(ayahNumber));
    localStorage.setItem(lsLastReadKey(userId), String(surahNumber));
    setLastAyah(ayahNumber);
    syncScrollToServer(ayahNumber);
  }, [surahNumber, syncScrollToServer, userId]);

  return { bookmarks, lastAyah, syncing, toggleBookmark, recordScrolledTo };
}
