"use server";

import { createClient } from "@/lib/supabase/server";
import { todayString } from "@/lib/utils";
import type { PrayerName, PrayerStatus, PrayerLog } from "@/types";
import { revalidatePath } from "next/cache";

const POINTS = { ontime: 20, late: 10, missed: 0 };

// ─── Load today's logs ───────────────────────────────────────
export async function getTodayLogs(): Promise<PrayerLog[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("prayers")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", todayString());

  return data ?? [];
}

// ─── Mark a prayer ──────────────────────────────────────────
export async function markPrayer(
  prayerName: PrayerName,
  status: PrayerStatus,
  previousStatus: PrayerStatus | null
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = todayString();

  // Upsert the prayer log
  const { error } = await supabase
    .from("prayers")
    .upsert(
      { user_id: user.id, prayer_name: prayerName, date: today, status },
      { onConflict: "user_id,prayer_name,date" }
    );

  if (error) return { error: error.message };

  // Update points
  const pointsDiff = POINTS[status] - (previousStatus ? POINTS[previousStatus] : 0);

  if (pointsDiff !== 0) {
    // Get or create user_stats row
    const { data: stats } = await supabase
      .from("user_stats")
      .select("total_points, current_streak, best_streak, last_active_date")
      .eq("user_id", user.id)
      .single();

    if (!stats) {
      await supabase.from("user_stats").insert({
        user_id: user.id,
        total_points: Math.max(0, POINTS[status]),
        current_streak: 1,
        best_streak: 1,
        last_active_date: today,
      });
    } else {
      const newPoints = Math.max(0, (stats.total_points ?? 0) + pointsDiff);

      // Streak logic
      let { current_streak, best_streak, last_active_date } = stats;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (last_active_date === yesterdayStr) {
        current_streak = (current_streak ?? 0) + 1;
      } else if (last_active_date !== today) {
        current_streak = 1;
      }

      best_streak = Math.max(best_streak ?? 0, current_streak);

      await supabase
        .from("user_stats")
        .update({
          total_points: newPoints,
          current_streak,
          best_streak,
          last_active_date: today,
        })
        .eq("user_id", user.id);
    }
  }

  revalidatePath("/dashboard/today");
  return { success: true };
}

// ─── Save reflection note ────────────────────────────────────
export async function saveNote(prayerName: PrayerName, note: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("prayers")
    .update({ note })
    .eq("user_id", user.id)
    .eq("prayer_name", prayerName)
    .eq("date", todayString());

  if (error) return { error: error.message };

  revalidatePath("/dashboard/today");
  return { success: true };
}

// ─── Get user stats ──────────────────────────────────────────
export async function getUserStats() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data ?? { total_points: 0, current_streak: 0, best_streak: 0 };
}
