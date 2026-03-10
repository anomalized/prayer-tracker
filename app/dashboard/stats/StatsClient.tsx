"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import StatsSummary from "@/components/stats/StatsSummary";
import Heatmap from "@/components/stats/Heatmap";
import PrayerBreakdown from "@/components/stats/PrayerBreakdown";
import WeeklyTrend from "@/components/stats/WeeklyTrend";
import RankBadge from "@/components/ui/RankBadge";
import MenuButton from "@/components/ui/MenuButton";

interface Props {
  stats: {
    total_points: number;
    current_streak: number;
    best_streak: number;
  } | null;
  breakdown: Array<{
    name: string;
    ontime: number;
    late: number;
    missed: number;
    total: number;
    rate: number;
  }>;
  heatmap: Array<{ date: string; count: number }>;
  weekly: Array<{ week: string; prayers: number; possible: number }>;
  monthStats: { pct: number; onTimeRate: number; mostMissed: string };
}

export default function StatsClient({ stats, breakdown, heatmap, weekly, monthStats }: Props) {
  const router = useRouter();
  useEffect(() => {
    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [router]);

  const points = stats?.total_points ?? 0;
  const currentStreak = stats?.current_streak ?? 0;
  const bestStreak = stats?.best_streak ?? 0;

  return (
    <div className="min-h-screen" style={{ background: "#fdf6f3" }}>
      {/* Header */}
      <div className="bg-gradient-to-b from-nude-200 to-nude-100 px-5 pt-12 pb-6 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-nude-300 opacity-20" />
        <MenuButton className="absolute top-12 right-5 z-10" dark={false} />
        <p className="font-body text-xs tracking-widest text-nude-500 uppercase mb-1">Your Journey</p>
        <h1 className="font-display text-3xl font-bold text-nude-800 mb-4">Stats 📊</h1>

        {/* Rank card */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="font-body text-xs text-nude-500 mb-1">Current Rank</p>
              <RankBadge points={points} size="lg" />
            </div>
            <div className="text-right">
              <p className="font-body text-xs text-nude-500">Total Points</p>
              <p className="font-display text-3xl font-bold text-nude-800">{points}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Summary grid */}
        <StatsSummary
          totalPoints={points}
          currentStreak={currentStreak}
          bestStreak={bestStreak}
          thisMonthPct={monthStats.pct}
          mostMissed={monthStats.mostMissed}
          onTimeRate={monthStats.onTimeRate}
        />

        {/* Heatmap */}
        <Heatmap days={heatmap} />

        {/* Weekly trend chart */}
        <WeeklyTrend data={weekly} />

        {/* Per-prayer breakdown */}
        <PrayerBreakdown breakdown={breakdown} />

        <p className="text-center text-xs text-nude-300 font-body pb-6">
          Every prayer counts 🌸
        </p>
      </div>
    </div>
  );
}