import { getBadges }       from "@/lib/actions/badges";
import { getUserStats }    from "@/lib/actions/prayers";
import { getStreakEvents }  from "@/lib/actions/stats";
import { createClient }    from "@/lib/supabase/server";
import RewardsClient       from "./RewardsClient";

export const dynamic   = "force-dynamic";
export const revalidate = 0;

export default async function RewardsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch stats with freeze count included
  const { data: statsRaw } = await supabase
    .from("user_stats")
    .select(
      "total_points, current_streak, best_streak, streak_freeze_count"
    )
    .eq("user_id", user!.id)
    .single();

  const stats = statsRaw
    ? {
        total_points:        statsRaw.total_points        ?? 0,
        current_streak:      statsRaw.current_streak      ?? 0,
        best_streak:         statsRaw.best_streak         ?? 0,
        streak_freeze_count: statsRaw.streak_freeze_count ?? 0,
      }
    : null;

  // All three in parallel — streak events are non-critical
  const [badges, streakEvents] = await Promise.all([
    getBadges(user!.id),
    getStreakEvents(15).catch(() => []),
  ]);

  return (
    <RewardsClient
      badges={badges}
      stats={stats}
      streakEvents={streakEvents}
    />
  );
}
