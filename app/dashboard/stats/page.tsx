import { createClient } from "@/lib/supabase/server";
import {
  getFullStats,
  getPrayerBreakdown,
  getHeatmapData,
  getWeeklyTrend,
  getMonthStats,
} from "@/lib/actions/stats";
import StatsClient from "./StatsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StatsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [stats, breakdown, heatmap, weekly, monthStats] = await Promise.all([
    getFullStats(user!.id),
    getPrayerBreakdown(user!.id),
    getHeatmapData(user!.id),
    getWeeklyTrend(user!.id),
    getMonthStats(user!.id),
  ]);

  return (
    <StatsClient
      stats={stats}
      breakdown={breakdown}
      heatmap={heatmap}
      weekly={weekly}
      monthStats={monthStats}
    />
  );
}
