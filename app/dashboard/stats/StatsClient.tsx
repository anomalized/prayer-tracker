"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import StatsSummary from "@/components/stats/StatsSummary";
import Heatmap from "@/components/stats/Heatmap";
import PrayerBreakdown from "@/components/stats/PrayerBreakdown";
import WeeklyTrend from "@/components/stats/WeeklyTrend";
import RankBadge from "@/components/ui/RankBadge";
import MenuButton from "@/components/ui/MenuButton";
import WeeklyInsightCard from "@/components/stats/WeeklyInsightCard";

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
  recentLogs: Array<{ prayer_name: string; date: string; status: string }>;
}

export default function StatsClient({ stats, breakdown, heatmap, weekly, monthStats, recentLogs }: Props) {

  const points = stats?.total_points ?? 0;
  const currentStreak = stats?.current_streak ?? 0;
  const bestStreak = stats?.best_streak ?? 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-primary)" }}>
      {/* Header */}
      <div className="bg-gradient-to-b from-nude-200 to-nude-100 px-5 pt-12  md:pt-6 pb-6 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-nude-300 opacity-20" />
        <MenuButton className="absolute top-12 md:top-6 right-5 z-10" dark={false} />
        <p className="font-body text-xs tracking-widest text-theme-muted uppercase mb-1">Your Journey</p>
        <h1 className="font-display text-3xl font-bold text-theme-text mb-4">Stats 📊</h1>

        {/* Rank card */}
        <div className="bg-theme-surface/60 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="font-body text-xs text-theme-muted mb-1">Current Rank</p>
              <RankBadge points={points} size="lg" />
            </div>
            <div className="text-right">
              <p className="font-body text-xs text-theme-muted">Total Points</p>
              <p className="font-display text-3xl font-bold text-theme-text">{points}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* On desktop: 2-column grid. Left = summary + heatmap, Right = trend + breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-4">
            <WeeklyInsightCard logs={recentLogs} />
            <StatsSummary
              totalPoints={points}
              currentStreak={currentStreak}
              bestStreak={bestStreak}
              thisMonthPct={monthStats.pct}
              mostMissed={monthStats.mostMissed}
              onTimeRate={monthStats.onTimeRate}
            />
            <Heatmap days={heatmap} />
          </div>
          {/* Right column */}
          <div className="space-y-4">
            <WeeklyTrend data={weekly} />
            <PrayerBreakdown breakdown={breakdown} />
          </div>
        </div>
        <p className="text-center text-xs text-theme-muted/70 font-body pb-6 pt-4">
          Every prayer counts 🌸
        </p>
      </div>

      
    </div>
  );
}