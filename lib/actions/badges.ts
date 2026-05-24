"use server";

import { createClient } from "@/lib/supabase/server";
import { BADGES } from "@/lib/badges";
import { todayString } from "@/lib/utils";
import { revalidatePath } from "next/cache";

// ─── Check and award any newly earned badges ─────────────────
export async function checkAndAwardBadges() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const today = todayString();

  // Load everything needed
  const [statsRes, todayLogsRes, recentLogsRes, earnedRes] = await Promise.all([
    supabase.from("user_stats").select("*").eq("user_id", user.id).single(),
    supabase.from("prayers").select("prayer_name, status").eq("user_id", user.id).eq("date", today),
    supabase.from("prayers").select("date, prayer_name, status").eq("user_id", user.id).gte("date", (() => {
      const d = new Date(); d.setDate(d.getDate() - 60); return d.toISOString().split("T")[0];
    })()),
    supabase.from("user_badges").select("badge_id").eq("user_id", user.id),
  ]);

  const stats       = statsRes.data;
  const todayLogs   = todayLogsRes.data ?? [];
  const recentLogs  = recentLogsRes.data ?? [];
  const alreadyEarned = new Set((earnedRes.data ?? []).map((b: { badge_id: string }) => b.badge_id));

  const checkData = {
    totalPoints:   stats?.total_points   ?? 0,
    currentStreak: stats?.current_streak ?? 0,
    bestStreak:    stats?.best_streak    ?? 0,
    todayLogs,
    recentLogs,
  };

  // Find newly earned badges
  const newlyEarned: string[] = [];
  for (const badge of BADGES) {
    if (!alreadyEarned.has(badge.id) && badge.check(checkData)) {
      newlyEarned.push(badge.id);
    }
  }

  if (newlyEarned.length > 0) {
    await supabase.from("user_badges").insert(
      newlyEarned.map(badge_id => ({ user_id: user.id, badge_id }))
    );
    revalidatePath("/dashboard/rewards");
  }

  return newlyEarned;
}

// ─── Get all badges with earned status ──────────────────────
export async function getBadges(userId?: string) {
  const supabase = createClient();

  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    userId = user.id;
  }

  const { data: earned } = await supabase
    .from("user_badges")
    .select("badge_id, earned_at")
    .eq("user_id", userId);

  const earnedMap = Object.fromEntries(
    (earned ?? []).map((b: { badge_id: string; earned_at: string | null }) => [b.badge_id, b.earned_at])
  );

  // Strip the check function — never pass functions to client components
  return BADGES.map(b => ({
    id: b.id,
    label: b.label,
    icon: b.icon,
    description: b.description,
    earned: !!earnedMap[b.id],
    earned_at: earnedMap[b.id] ?? null,
  }));
}
