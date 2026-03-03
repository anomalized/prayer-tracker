"use client";

import { useState, useEffect, useTransition } from "react";
import BadgeCard from "@/components/rewards/BadgeCard";
import BadgeCelebration from "@/components/rewards/BadgeCelebration";
import RankBadge from "@/components/ui/RankBadge";
import { checkAndAwardBadges } from "@/lib/actions/badges";
import { getRank, RANK_COLORS, RANK_THRESHOLDS } from "@/lib/utils";

interface Badge {
  id: string;
  label: string;
  icon: string;
  description: string;
  earned: boolean;
  earned_at?: string | null;
}

interface Props {
  badges: Badge[];
  stats: { total_points: number; current_streak: number; best_streak: number } | null;
}

export default function RewardsClient({ badges, stats }: Props) {
  const [newBadges, setNewBadges]   = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isPending, startTransition] = useTransition();

  const points = stats?.total_points ?? 0;
  const rank   = getRank(points);
  const rankColor = RANK_COLORS[rank];

  const earnedBadges  = badges.filter(b => b.earned);
  const lockedBadges  = badges.filter(b => !b.earned);

  // Check for new badges on mount
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
    <div className="min-h-screen bg-nude-50">
      {/* Badge celebration modal */}
      {showCelebration && (
        <BadgeCelebration
          newBadgeIds={newBadges}
          onDismiss={() => setShowCelebration(false)}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-b from-nude-200 to-nude-100 px-5 pt-12 pb-6 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-nude-300 opacity-20" />
        <p className="font-body text-xs tracking-widest text-nude-500 uppercase mb-1">Your Achievements</p>
        <h1 className="font-display text-3xl font-bold text-nude-800 mb-4">Rewards ✨</h1>

        {/* Rank progress */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
          <div className="flex-1">
            <RankBadge points={points} size="lg" />
          </div>
          <div className="text-right">
            <p className="font-body text-xs text-nude-500">Badges earned</p>
            <p className="font-display text-3xl font-bold text-nude-800">
              {earnedBadges.length}
              <span className="font-body text-sm text-nude-400">/{badges.length}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Earned badges */}
        {earnedBadges.length > 0 && (
          <div>
            <p className="font-body text-xs font-bold tracking-widest text-nude-500 uppercase mb-3 px-1">
              Earned ({earnedBadges.length})
            </p>
            <div className="space-y-2">
              {earnedBadges.map(b => (
                <BadgeCard key={b.id} {...b} />
              ))}
            </div>
          </div>
        )}

        {/* Locked badges */}
        {lockedBadges.length > 0 && (
          <div>
            <p className="font-body text-xs font-bold tracking-widest text-nude-400 uppercase mb-3 px-1">
              Locked ({lockedBadges.length})
            </p>
            <div className="space-y-2">
              {lockedBadges.map(b => (
                <BadgeCard key={b.id} {...b} />
              ))}
            </div>
          </div>
        )}

        {/* Points shop teaser */}
        <div className="bg-gradient-to-br from-nude-200 to-nude-300 rounded-3xl p-5 text-center border border-nude-300">
          <p className="text-3xl mb-2">🌸</p>
          <p className="font-display text-lg font-bold text-nude-800">Coming Soon</p>
          <p className="font-body text-xs text-nude-600 mt-1">
            Redeem points for custom themes, special badges & more
          </p>
        </div>

        <p className="text-center text-xs text-nude-300 font-body pb-6">
          Keep praying, keep growing 🌸
        </p>
      </div>
    </div>
  );
}
