"use client";

import { useState, useEffect, useTransition } from "react";
import { Sparkles } from "lucide-react";
import BadgeCard          from "@/components/rewards/BadgeCard";
import BadgeCelebration   from "@/components/rewards/BadgeCelebration";
import StreakFreezeCard    from "@/components/rewards/StreakFreezeCard";
import StreakHistory       from "@/components/rewards/StreakHistory";
import MenuButton         from "@/components/ui/MenuButton";
import RankBadge          from "@/components/ui/RankBadge";
import { checkAndAwardBadges } from "@/lib/actions/badges";
import { getRank, RANK_COLORS } from "@/lib/utils";
import type { StreakEvent } from "@/lib/actions/stats";

interface Badge {
  id:          string;
  label:       string;
  icon:        string;
  description: string;
  earned:      boolean;
  earned_at?:  string | null;
}

interface Props {
  badges:        Badge[];
  stats:         {
    total_points:        number;
    current_streak:      number;
    best_streak:         number;
    streak_freeze_count: number;
  } | null;
  streakEvents:  StreakEvent[];
}

export default function RewardsClient({ badges, stats, streakEvents }: Props) {
  const [newBadges,        setNewBadges]        = useState<string[]>([]);
  const [showCelebration,  setShowCelebration]  = useState(false);
  const [isPending,        startTransition]     = useTransition();

  const points      = stats?.total_points        ?? 0;
  const freezeCount = stats?.streak_freeze_count ?? 0;
  const streak      = stats?.current_streak      ?? 0;
  const rank        = getRank(points);

  const earnedBadges = badges.filter((b) => b.earned);
  const lockedBadges = badges.filter((b) => !b.earned);

  // Badge check on mount — unchanged
  useEffect(() => {
    startTransition(async () => {
      const newly = await checkAndAwardBadges();
      if (newly.length > 0) {
        setNewBadges(newly);
        setShowCelebration(true);
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-theme-bg">

      {/* Badge celebration modal — unchanged */}
      {showCelebration && (
        <BadgeCelebration
          newBadgeIds={newBadges}
          onDismiss={() => setShowCelebration(false)}
        />
      )}

      {/* Header — unchanged */}
      <div className="bg-gradient-to-b from-nude-200 to-nude-100 px-5 pt-12
        md:pt-6 pb-6 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full
          bg-nude-300 opacity-20" />
        <MenuButton className="absolute top-12 md:top-6 right-5 z-10" dark={false} />
        <p className="font-body text-xs tracking-widest text-theme-muted uppercase mb-1">
          Your Achievements
        </p>
        <h1 className="font-display text-3xl font-bold text-theme-text mb-4">
          Rewards ✨
        </h1>

        {/* Rank card — unchanged */}
        <div className="bg-theme-surface/60 backdrop-blur-sm rounded-2xl p-4
          flex items-center gap-4">
          <div className="flex-1">
            <RankBadge points={points} size="lg" />
          </div>
          <div className="text-right">
            <p className="font-body text-xs text-theme-muted">Badges earned</p>
            <p className="font-display text-3xl font-bold text-theme-text">
              {earnedBadges.length}
              <span className="font-body text-sm text-theme-muted">
                /{badges.length}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* ── NEW: Streak Freeze card ─────────────────────────────── */}
        <StreakFreezeCard
          freezeCount={freezeCount}
          totalPoints={points}
          currentStreak={streak}
        />

        {/* ── NEW: Streak History (collapsible) ──────────────────── */}
        <StreakHistory events={streakEvents} />

        {/* Earned badges — unchanged */}
        {earnedBadges.length > 0 && (
          <div>
            <p className="font-body text-xs font-bold tracking-widest
              text-theme-muted uppercase mb-3 px-1">
              Earned ({earnedBadges.length})
            </p>
            <div className="space-y-2">
              {earnedBadges.map((b) => (
                <BadgeCard key={b.id} {...b} />
              ))}
            </div>
          </div>
        )}

        {/* Locked badges — unchanged */}
        {lockedBadges.length > 0 && (
          <div>
            <p className="font-body text-xs font-bold tracking-widest
              text-theme-muted uppercase mb-3 px-1">
              Locked ({lockedBadges.length})
            </p>
            <div className="space-y-2">
              {lockedBadges.map((b) => (
                <BadgeCard key={b.id} {...b} />
              ))}
            </div>
          </div>
        )}

        {/* Points shop teaser — unchanged */}
        <div className="bg-gradient-to-br from-nude-200 to-nude-300 rounded-3xl
          p-5 text-center border border-theme-border">
          <div className="flex items-center justify-center mx-auto mb-2 w-11 h-11 rounded-2xl bg-theme-surface/80 text-theme-text">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="font-display text-lg font-bold text-theme-text">
            Coming Soon
          </p>
          <p className="font-body text-xs text-theme-text mt-1">
            Redeem points for custom themes, special badges & more
          </p>
        </div>

        <p className="text-center text-xs text-theme-muted/70 font-body pb-6">
          Keep praying, keep growing 🌸
        </p>
      </div>
    </div>
  );
}