"use server";

import { createClient } from "@/lib/supabase/server";
import { todayString } from "@/lib/utils";
import { revalidatePath } from "next/cache";

/**
 * Called once per day when the user opens the app.
 * Handles streak reset if they missed yesterday,
 * and initializes user_stats row if it doesn't exist yet.
 */
export async function checkAndUpdateStreak() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const today = todayString();

  const { data: stats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // First time user — create stats row
  if (!stats) {
    await supabase.from("user_stats").insert({
      user_id: user.id,
      total_points: 0,
      current_streak: 0,
      best_streak: 0,
      last_active_date: null,
    });
    return;
  }

  // Already checked today
  if (stats.last_active_date === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Check if they prayed at all yesterday
  const { count } = await supabase
    .from("prayers")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("date", yesterdayStr)
    .neq("status", "missed");

  const prayedYesterday = (count ?? 0) > 0;

  let newStreak = stats.current_streak ?? 0;

  if (stats.last_active_date === yesterdayStr) {
    // Consecutive day — keep streak (it increments when they actually pray)
    newStreak = stats.current_streak;
  } else if (!prayedYesterday && stats.last_active_date !== today) {
    // Missed a day — reset streak
    newStreak = 0;
  }

  const newBest = Math.max(stats.best_streak ?? 0, newStreak);

  await supabase
    .from("user_stats")
    .update({
      current_streak: newStreak,
      best_streak: newBest,
    })
    .eq("user_id", user.id);

  revalidatePath("/dashboard/today");
}

/**
 * Returns full stats for a user (self or friend)
 */
export async function getFullStats(userId?: string) {
  const supabase = createClient();

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    userId = user.id;
  }

  const { data } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data ?? {
    user_id: userId,
    total_points: 0,
    current_streak: 0,
    best_streak: 0,
    last_active_date: null,
  };
}

/**
 * Returns the last `days` days of prayer logs for heatmap
 */
export async function getRecentLogs(days: number = 35, userId?: string) {
  const supabase = createClient();

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    userId = user.id;
  }

  const from = new Date();
  from.setDate(from.getDate() - days);
  const fromStr = from.toISOString().split("T")[0];

  const { data } = await supabase
    .from("prayers")
    .select("date, status")
    .eq("user_id", userId)
    .gte("date", fromStr)
    .order("date", { ascending: true });

  return data ?? [];
}

/**
 * Returns per-prayer on-time rate for the last 30 days
 */
export async function getPrayerBreakdown(userId?: string) {
  const supabase = createClient();

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    userId = user.id;
  }

  const from = new Date();
  from.setDate(from.getDate() - 30);
  const fromStr = from.toISOString().split("T")[0];

  const { data } = await supabase
    .from("prayers")
    .select("prayer_name, status")
    .eq("user_id", userId)
    .gte("date", fromStr);

  if (!data) return [];

  const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  return prayers.map(name => {
    const logs = data.filter(l => l.prayer_name === name);
    const total   = logs.length;
    const ontime  = logs.filter(l => l.status === "ontime").length;
    const late    = logs.filter(l => l.status === "late").length;
    const missed  = logs.filter(l => l.status === "missed").length;
    const rate    = total > 0 ? Math.round((ontime / total) * 100) : 0;
    return { name, total, ontime, late, missed, rate };
  });
}

/**
 * Builds heatmap data — last 35 days, count of non-missed prayers per day
 */
export async function getHeatmapData(userId?: string) {
  const logs = await getRecentLogs(35, userId);

  // Group by date
  const byDate: Record<string, number> = {};
  logs.forEach(l => {
    if (l.status !== "missed") {
      byDate[l.date] = (byDate[l.date] ?? 0) + 1;
    }
  });

  // Build last 35 days array
  const days = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({ date: dateStr, count: byDate[dateStr] ?? 0 });
  }
  return days;
}

/**
 * Builds weekly trend — last 5 weeks
 */
export async function getWeeklyTrend(userId?: string) {
  const logs = await getRecentLogs(35, userId);

  const weeks: { week: string; prayers: number; possible: number }[] = [];

  for (let w = 4; w >= 0; w--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (w * 7) - 6);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - (w * 7));

    const label = `W${5 - w}`;
    const weekLogs = logs.filter(l => {
      const d = new Date(l.date);
      return d >= weekStart && d <= weekEnd;
    });

    const done = weekLogs.filter(l => l.status !== "missed").length;
    weeks.push({ week: label, prayers: done, possible: 35 });
  }

  return weeks;
}

/**
 * Computes this month's completion % 
 */
export async function getMonthStats(userId?: string) {
  const supabase = createClient();
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { pct: 0, onTimeRate: 0, mostMissed: "—" };
    userId = user.id;
  }

  const now       = new Date();
  const monthStr  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data } = await supabase
    .from("prayers")
    .select("prayer_name, status")
    .eq("user_id", userId)
    .like("date", `${monthStr}%`);

  if (!data?.length) return { pct: 0, onTimeRate: 0, mostMissed: "—" };

  const daysInMonth = now.getDate();
  const possible    = daysInMonth * 5;
  const done        = data.filter(l => l.status !== "missed").length;
  const ontime      = data.filter(l => l.status === "ontime").length;

  const pct        = Math.round((done / possible) * 100);
  const onTimeRate = done > 0 ? Math.round((ontime / done) * 100) : 0;

  // Most missed prayer
  const missedCounts: Record<string, number> = {};
  data.filter(l => l.status === "missed").forEach(l => {
    missedCounts[l.prayer_name] = (missedCounts[l.prayer_name] ?? 0) + 1;
  });

  const mostMissed = Object.entries(missedCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return { pct, onTimeRate, mostMissed };
}
