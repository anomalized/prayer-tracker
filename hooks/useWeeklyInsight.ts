"use client";

import { useState, useCallback } from "react";

interface FocusPrayer {
  name: string;
  missedCount: number;
  pattern: string;
  ontimeRate: number;
}

interface WeeklyInsight {
  summary: string;
  focusPrayer: FocusPrayer;
  tip: string;
  tipSource: string;
}

interface PrayerLog {
  prayer_name: string;
  date: string;
  status: string;
}

interface UseWeeklyInsightReturn {
  insight: WeeklyInsight | null;
  loading: boolean;
  error: string | null;
  fetch: (logs: PrayerLog[]) => Promise<void>;
}

export function useWeeklyInsight(): UseWeeklyInsightReturn {
  const [insight, setInsight] = useState<WeeklyInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchInsight = useCallback(async (logs: PrayerLog[]) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const cacheKey = `insight_${todayStr}`;
    
    // Check cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setInsight(JSON.parse(cached));
        return;
      } catch (e) {
        // Fallback to fetch if parse fails
      }
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/weekly-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`);
        return;
      }

      setInsight(data as WeeklyInsight);
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  return { insight, loading, error, fetch: fetchInsight };
}