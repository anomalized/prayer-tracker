"use client";

import { useEffect, useState } from "react";
import { BADGES } from "@/lib/badges";
import RewardBadgeIcon, { getBadgeShape } from "@/components/rewards/RewardBadgeIcon";

interface Props {
  newBadgeIds: string[];
  onDismiss: () => void;
}

export default function BadgeCelebration({ newBadgeIds, onDismiss }: Props) {
  const [current, setCurrent] = useState(0);

  if (!newBadgeIds.length) return null;

  const badge = BADGES.find(b => b.id === newBadgeIds[current]);
  if (!badge) return null;

  const hasMore = current < newBadgeIds.length - 1;

  const handleNext = () => {
    if (hasMore) setCurrent(c => c + 1);
    else onDismiss();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(122,64,53,0.25)", backdropFilter: "blur(6px)" }}
    >
      <div className="bg-theme-surface rounded-3xl w-full max-w-sm p-8 text-center shadow-xl animate-fade-up">
        {/* Confetti-like dots */}
        <div className="flex justify-center gap-2 mb-4">
          {["bg-nude-300", "bg-nude-400", "bg-nude-200", "bg-theme-bg0", "bg-nude-300"].map((c, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${c}`} style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>

        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-nude-300 to-nude-400 flex items-center justify-center text-5xl mx-auto mb-5 shadow-md">
          <div className="w-16 h-16 text-white">
            <RewardBadgeIcon shape={getBadgeShape(badge.id)} earned />
          </div>
        </div>

        <p className="font-body text-xs tracking-widest text-theme-muted uppercase mb-2">
          Badge Unlocked!
        </p>
        <p className="font-display text-2xl font-bold text-theme-text mb-2">{badge.label}</p>
        <p className="font-body text-sm text-theme-muted mb-6">{badge.description}</p>

        <button
          onClick={handleNext}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-nude-400 to-nude-500 text-white font-bold font-body text-sm active:scale-95 transition-transform"
        >
          {hasMore ? `Next Badge (${current + 2}/${newBadgeIds.length})` : "All set!"}
        </button>
      </div>
    </div>
  );
}
