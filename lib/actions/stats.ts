"use server";

import { createClient } from "@/lib/supabase/server";
import { todayString } from "@/lib/utils";
import { revalidatePath } from "next/cache";

/**
 * Called once per day when the user opens the app.
 * Handles streak reset if they missed yesterday,
 * and initializes user_stats row if it doesn't exist yet.
 */
export async function checkAndUpdateStreak(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const today    = (() => new Date().toISOString().split("T")[0])();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  })();

  // Fetch current stats — include freeze count
  const { data: stats, error: statsError } = await supabase
    .from("user_stats")
    .select(
      "current_streak, best_streak, last_active_date, streak_freeze_count"
    )
    .eq("user_id", user.id)
    .single();

  if (statsError || !stats) {
    // No row yet — create one with defaults
    await supabase.from("user_stats").upsert({
      user_id:             user.id,
      current_streak:      0,
      best_streak:         0,
      total_points:        0,
      last_active_date:    null,
      streak_freeze_count: 0,
    });
    return;
  }

  const lastActive        = stats.last_active_date as string | null;
  const currentStreak     = stats.current_streak   as number;
  const bestStreak        = stats.best_streak       as number;
  const freezeCount       = (stats.streak_freeze_count as number) ?? 0;

  // ── Case 1: already updated today — no-op
  if (lastActive === today) return;

  // ── Check if the user prayed at all yesterday or today
  const { data: recentPrayers } = await supabase
    .from("prayers")
    .select("date, status")
    .eq("user_id", user.id)
    .in("date", [today, yesterday])
    .neq("status", "missed");

  const prayedToday     = recentPrayers?.some((p) => p.date === today)     ?? false;
  const prayedYesterday = recentPrayers?.some((p) => p.date === yesterday)  ?? false;

  // ── Case 2: prayed today — extend streak
  if (prayedToday) {
    const isConsecutive =
      lastActive === yesterday ||
      lastActive === null;      // first ever prayer

    const newStreak = isConsecutive ? currentStreak + 1 : 1;
    const newBest   = Math.max(newStreak, bestStreak);

    await supabase
      .from("user_stats")
      .update({
        current_streak:   newStreak,
        best_streak:      newBest,
        last_active_date: today,
      })
      .eq("user_id", user.id);

    // Log the extension event
    await supabase.from("streak_events").insert({
      user_id:             user.id,
      event_type:          "streak_extended",
      date:                today,
      streak_value_before: currentStreak,
      streak_value_after:  newStreak,
      freeze_count_before: freezeCount,
      freeze_count_after:  freezeCount,
      points_spent:        0,
    });

    revalidatePath("/dashboard/today");
    revalidatePath("/dashboard/stats");
    return;
  }

  // ── Case 3: did not pray today
  // sub-case A: last active was yesterday — still has a valid streak window,
  //             nothing to reset yet (day isn't over)
  if (lastActive === yesterday) return;

  // sub-case B: last active was before yesterday — streak is broken.
  //             Check if a freeze can save it.
  if (currentStreak === 0) return; // already at 0, nothing to do

  // ── Freeze check
  // Only consume a freeze for a gap of exactly 1 day (missed one day).
  // A gap of 2+ days is too large — freeze doesn't apply.
  const lastActiveDateObj = lastActive ? new Date(lastActive) : null;
  const todayDateObj      = new Date(today);
  const dayGap            = lastActiveDateObj
    ? Math.round((todayDateObj.getTime() - lastActiveDateObj.getTime()) / 86_400_000)
    : Infinity;

  const canUseFreeze = freezeCount > 0 && dayGap <= 2;

  if (canUseFreeze) {
    // ── Consume freeze — preserve streak
    await supabase
      .from("user_stats")
      .update({
        streak_freeze_count: freezeCount - 1,
      })
      .eq("user_id", user.id);

    await supabase.from("streak_events").insert({
      user_id:             user.id,
      event_type:          "freeze_used",
      date:                today,
      streak_value_before: currentStreak,
      streak_value_after:  currentStreak,
      freeze_count_before: freezeCount,
      freeze_count_after:  freezeCount - 1,
      points_spent:        0,
    });

    revalidatePath("/dashboard/today");
    revalidatePath("/dashboard/rewards");
    return;
  }

  // ── No freeze available (or gap too large) — reset
  await supabase
    .from("user_stats")
    .update({
      current_streak:   0,
      last_active_date: today,
    })
    .eq("user_id", user.id);

  await supabase.from("streak_events").insert({
    user_id:             user.id,
    event_type:          "streak_reset",
    date:                today,
    streak_value_before: currentStreak,
    streak_value_after:  0,
    freeze_count_before: freezeCount,
    freeze_count_after:  freezeCount,
    points_spent:        0,
  });

  revalidatePath("/dashboard/today");
  revalidatePath("/dashboard/stats");
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
    onboarding_complete: false,
  };
}

/**
 * Marks onboarding as complete for current user so it never shows again.
 */
export async function completeOnboarding() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_stats")
    .update({ onboarding_complete: true })
    .eq("user_id", user.id);

  // we’ll revalidate the today page to pick up changes
  revalidatePath("/dashboard/today");
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

export async function getLast30DaysLogs(userId: string) {
  const supabase = createClient();
  const from = new Date();
  from.setDate(from.getDate() - 30);

  const { data } = await supabase
    .from("prayers")
    .select("prayer_name, date, status")
    .eq("user_id", userId)
    .gte("date", from.toISOString().split("T")[0])
    .order("date", { ascending: false });

  return data ?? [];
}

// ─── purchaseStreakFreeze ─────────────────────────────────────────────────----
// Calls the atomic Postgres RPC — no race conditions possible.

export type PurchaseFreezeResult =
  | { ok: true;  newFreezeCount: number; newPoints: number }
  | { ok: false; error: "insufficient_points"; pointsNeeded: number }
  | { ok: false; error: "max_freezes_reached" }
  | { ok: false; error: "stats_not_found" | "access_denied" | "unknown" };

export async function purchaseStreakFreeze(): Promise<PurchaseFreezeResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "access_denied" };

  const { data, error } = await supabase.rpc("purchase_streak_freeze", {
    p_user_id: user.id,
  });

  if (error) {
    console.error("[purchaseStreakFreeze]", error.message);
    return { ok: false, error: "unknown" };
  }

  const result = data as {
    ok:               boolean;
    error?:           string;
    new_freeze_count?: number;
    new_points?:       number;
    points_needed?:    number;
  };

  if (!result.ok) {
    if (result.error === "insufficient_points") {
      return {
        ok:           false,
        error:        "insufficient_points",
        pointsNeeded: result.points_needed ?? 100,
      };
    }
    if (result.error === "max_freezes_reached") {
      return { ok: false, error: "max_freezes_reached" };
    }
    return { ok: false, error: "unknown" };
  }

  revalidatePath("/dashboard/rewards");
  revalidatePath("/dashboard/today");

  return {
    ok:             true,
    newFreezeCount: result.new_freeze_count ?? 0,
    newPoints:      result.new_points       ?? 0,
  };
}

// ─── getStreakEvents ─────────────────────────────────────────────────────────
export interface StreakEvent {
  eventType:          string;
  date:               string;
  streakValueBefore:  number;
  streakValueAfter:   number;
  freezeCountBefore:  number | null;
  freezeCountAfter:   number | null;
  pointsSpent:        number;
  createdAt:          string;
}

export async function getStreakEvents(limit = 10): Promise<StreakEvent[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("streak_events")
    .select(
      "event_type, date, streak_value_before, streak_value_after, " +
      "freeze_count_before, freeze_count_after, points_spent, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => ({
    eventType:         row.event_type,
    date:              row.date,
    streakValueBefore: row.streak_value_before,
    streakValueAfter:  row.streak_value_after,
    freezeCountBefore: row.freeze_count_before,
    freezeCountAfter:  row.freeze_count_after,
    pointsSpent:       row.points_spent,
    createdAt:         row.created_at,
  }));
}

