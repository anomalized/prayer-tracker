"use client";

import { getRank, RANK_COLORS, getRankProgress, RANK_THRESHOLDS } from "@/lib/utils";

interface Props {
  points: number;
  size?: "sm" | "md" | "lg";
}

const RANK_ICONS: Record<string, string> = {
  Bronze: "🥉",
  Silver: "🥈",
  Gold:   "🥇",
  Diamond: "💎",
};

export default function RankBadge({ points, size = "md" }: Props) {
  const rank      = getRank(points);
  const color     = RANK_COLORS[rank];
  const progress  = getRankProgress(points);
  const threshold = RANK_THRESHOLDS[rank];
  const remaining = threshold - points;

  const sizes = {
    sm: { icon: "text-lg", label: "text-xs", bar: "h-1" },
    md: { icon: "text-2xl", label: "text-sm", bar: "h-1.5" },
    lg: { icon: "text-4xl", label: "text-base", bar: "h-2" },
  };

  const s = sizes[size];

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={s.icon}>{RANK_ICONS[rank]}</span>
      <span className={`font-display font-bold ${s.label}`} style={{ color }}>
        {rank}
      </span>
      <div className="w-full bg-nude-200 rounded-full overflow-hidden" style={{ height: size === "lg" ? 8 : 4 }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>
      {size === "lg" && (
        <p className="text-xs text-theme-muted font-body">{remaining} pts to next rank</p>
      )}
    </div>
  );
}
