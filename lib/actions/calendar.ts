"use server";

import { createClient } from "@/lib/supabase/server";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";
export type PrayerStatus = "ontime" | "late" | "missed";

export interface DayPrayerDetail {
  prayer_name: PrayerName;
  status:      PrayerStatus;
}

// Map from "YYYY-MM-DD" → array of prayer logs for that date
export type MonthPrayerMap = Record<string, DayPrayerDetail[]>;

// Lightweight heatmap — how many non-missed prayers per day
export type MonthCompletionMap = Record<string, number>; // 0–5

/**
 * Fetch all prayer logs for a date range.
 * Returns both the detailed per-prayer map AND the lightweight count map.
 *
 * Called once per month navigation — all day-detail sheets draw from
 * the same pre-fetched data, so tapping a cell is instant.
 */
export async function getMonthPrayerData(
  fromDate: string,  // "YYYY-MM-DD" — first Gregorian date in the displayed Hijri month
  toDate:   string   // "YYYY-MM-DD" — last Gregorian date (may span 2 Gregorian months)
): Promise<{
  detailMap:     MonthPrayerMap;
  completionMap: MonthCompletionMap;
}> {
  const empty = { detailMap: {}, completionMap: {} };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return empty;

  const { data, error } = await supabase
    .from("prayers")
    .select("date, prayer_name, status")
    .eq("user_id", user.id)
    .gte("date", fromDate)
    .lte("date", toDate)
    .order("date");

  if (error || !data) return empty;

  const detailMap:     MonthPrayerMap     = {};
  const completionMap: MonthCompletionMap = {};

  for (const row of data) {
    const date = row.date as string;

    // Detail map — every log
    if (!detailMap[date]) detailMap[date] = [];
    detailMap[date].push({
      prayer_name: row.prayer_name as PrayerName,
      status:      row.status      as PrayerStatus,
    });

    // Completion map — count non-missed
    if (row.status !== "missed") {
      completionMap[date] = (completionMap[date] ?? 0) + 1;
    }
  }

  return { detailMap, completionMap };
}
