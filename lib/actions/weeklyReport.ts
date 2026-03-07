"use server";

import { createClient } from "@/lib/supabase/server";

export async function getWeeklyReport() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get last 7 days
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const from = weekAgo.toISOString().split("T")[0];
  const to   = today.toISOString().split("T")[0];

  const { data: prayers } = await supabase
    .from("prayers")
    .select("date, prayer_name, status")
    .eq("user_id", user.id)
    .gte("date", from)
    .lte("date", to);

  const { data: stats } = await supabase
    .from("user_stats")
    .select("total_points, current_streak, best_streak")
    .eq("user_id", user.id)
    .single();

  const logs = prayers ?? [];

  const total    = logs.length;
  const ontime   = logs.filter(p => p.status === "ontime").length;
  const late     = logs.filter(p => p.status === "late").length;
  const missed   = logs.filter(p => p.status === "missed").length;
  const possible = 35; // 5 prayers × 7 days
  const pct      = Math.round((ontime + late) / possible * 100);
  const pointsEarned = ontime * 20 + late * 10;

  // Best day
  const byDate: Record<string, number> = {};
  logs.forEach(p => {
    if (!byDate[p.date]) byDate[p.date] = 0;
    if (p.status !== "missed") byDate[p.date]++;
  });
  const bestDay = Object.entries(byDate).sort((a,b) => b[1]-a[1])[0];
  const bestDayLabel = bestDay
    ? new Date(bestDay[0]).toLocaleDateString("en-US", { weekday: "long" })
    : null;

  // Most missed prayer
  const missedByPrayer: Record<string, number> = {};
  logs.filter(p => p.status === "missed").forEach(p => {
    missedByPrayer[p.prayer_name] = (missedByPrayer[p.prayer_name] ?? 0) + 1;
  });
  const mostMissed = Object.entries(missedByPrayer).sort((a,b) => b[1]-a[1])[0]?.[0] ?? null;

  // Perfect days (all 5 prayed)
  const perfectDays = Object.values(byDate).filter(c => c === 5).length;

  return {
    pct, ontime, late, missed, possible, pointsEarned,
    perfectDays, bestDayLabel, mostMissed,
    streak: stats?.current_streak ?? 0,
    totalPoints: stats?.total_points ?? 0,
    from, to,
  };
}