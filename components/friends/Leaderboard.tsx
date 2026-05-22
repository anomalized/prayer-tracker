"use client";

import { getRank, RANK_COLORS } from "@/lib/utils";

interface Entry {
  id: string;
  name: string;
  points: number;
  streak: number;
  isMe?: boolean;
}

interface Props {
  entries: Entry[];
}

export default function Leaderboard({ entries }: Props) {
  if (!entries?.length) return null;

  const sorted = [...entries].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="bg-theme-surface border border-theme-border rounded-3xl overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-nude-100 to-nude-200 px-4 py-3">
        <p className="font-display text-lg font-bold text-theme-text">Leaderboard ✨</p>
        <p className="font-body text-xs text-theme-muted">All-time points ranking</p>
      </div>
      <div className="divide-y divide-nude-50">
        {sorted.map((entry, i) => {
          const safeName = entry?.name && entry.name.length > 0 ? entry.name : "Friend";
          const rank  = getRank(entry?.points ?? 0);
          const color = RANK_COLORS[rank];
          return (
            <div
              key={entry.id ?? i}
              className={`flex items-center gap-3 px-4 py-3 transition-colors
                ${entry.isMe ? "bg-theme-bg" : "hover:bg-theme-bg/50"}`}
            >
              <span className="text-xl w-7 text-center">
                {i < 3 ? medals[i] : <span className="font-body text-sm text-theme-muted">{i + 1}</span>}
              </span>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-display font-bold flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${color}88, ${color})` }}
              >
                {safeName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-body text-sm font-bold text-theme-text">
                  {safeName} {entry.isMe && <span className="text-theme-muted font-normal text-xs">(you)</span>}
                </p>
                <p className="font-body text-xs text-theme-muted">🔥 {entry?.streak ?? 0} day streak</p>
              </div>
              <div className="text-right">
                <p className="font-display text-base font-bold" style={{ color }}>{entry?.points ?? 0}</p>
                <p className="font-body text-xs text-theme-muted">{rank}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}