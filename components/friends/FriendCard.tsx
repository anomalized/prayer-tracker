"use client";

import { useState, useTransition } from "react";
import { removeFriend } from "@/lib/actions/friends";
import { sendNudge } from "@/lib/actions/nudge";
import { getRank, RANK_COLORS } from "@/lib/utils";

const PRAYER_ICONS: Record<string, string> = {
  Fajr: "🌙", Dhuhr: "☀️", Asr: "🌤️", Maghrib: "🌇", Isha: "🌌",
};

interface FriendData {
  friendshipId: string;
  id: string;
  name: string;
  city: string;
  totalPoints: number;
  currentStreak: number;
  bestStreak: number;
  donePrayers: number;
  todayPrayers: Array<{ prayer_name: string; status: string }>;
  badges: string[];
}

interface Props {
  friend: FriendData;
  myPoints: number;
  myStreak: number;
}

export default function FriendCard({ friend, myPoints, myStreak }: Props) {
  const [nudgeSent, setNudgeSent]   = useState(false);
  const [showMenu, setShowMenu]     = useState(false);
  const [isPending, startTransition] = useTransition();

  const safeName  = friend?.name && friend.name.length > 0 ? friend.name : "Friend";
  const rank      = getRank(friend?.totalPoints ?? 0);
  const rankColor = RANK_COLORS[rank];

  const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const prayerMap = Object.fromEntries(
    (friend?.todayPrayers ?? []).map(p => [p.prayer_name, p.status])
  );

  const isAhead = (friend?.totalPoints ?? 0) > myPoints;
  const streakWinner = (friend?.currentStreak ?? 0) > myStreak;

  const handleNudge = () => {
    if (nudgeSent) return;
    startTransition(async () => {
      const result = await sendNudge(friend.id);
      if ("error" in result && result.error) {
        alert(result.error);
      } else {
        setNudgeSent(true);
        setTimeout(() => setNudgeSent(false), 5000);
      }
    });
  };

  const handleRemove = () => {
    startTransition(async () => { await removeFriend(friend.friendshipId); });
    setShowMenu(false);
  };

  return (
    <div className="bg-theme-surface border border-theme-border rounded-3xl overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-nude-100 to-nude-200 px-4 py-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-nude-300 to-nude-400 flex items-center justify-center text-white font-display text-xl font-bold flex-shrink-0">
          {safeName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-display text-lg font-bold text-theme-text">{safeName}</p>
          <p className="font-body text-xs text-theme-muted">📍 {friend?.city ?? "—"}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="w-8 h-8 rounded-xl bg-theme-surface/60 flex items-center justify-center text-theme-muted hover:text-theme-text transition-colors"
          >
            ···
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 bg-theme-surface border border-theme-border rounded-2xl shadow-lg py-1 z-10 min-w-[140px]">
              <button
                onClick={handleRemove}
                className="w-full text-left px-4 py-2.5 text-xs font-body text-red-400 hover:bg-theme-bg"
              >
                Remove friend
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-nude-100 border-b border-theme-border">
        <div className="py-3 text-center">
          <p className="font-display text-lg font-bold text-theme-text">
            {friend?.currentStreak ?? 0}
            {streakWinner && <span className="text-xs ml-1">👑</span>}
          </p>
          <p className="font-body text-xs text-theme-muted">🔥 Streak</p>
        </div>
        <div className="py-3 text-center">
          <p className="font-display text-lg font-bold" style={{ color: rankColor }}>
            {friend?.totalPoints ?? 0}
            {isAhead && <span className="text-xs ml-1">⬆️</span>}
          </p>
          <p className="font-body text-xs text-theme-muted">⭐ Points</p>
        </div>
        <div className="py-3 text-center">
          <p className="font-display text-lg font-bold" style={{ color: rankColor }}>{rank}</p>
          <p className="font-body text-xs text-theme-muted">🏅 Rank</p>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-theme-border">
        <p className="font-body text-xs font-bold tracking-widest text-theme-muted uppercase mb-2">
          Today · {friend?.donePrayers ?? 0}/5 prayers
        </p>
        <div className="flex gap-2">
          {PRAYERS.map(p => {
            const status = prayerMap[p];
            return (
              <div key={p} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base
                  ${status === "ontime" ? "bg-gradient-to-br from-nude-300 to-nude-400" :
                    status === "late"   ? "bg-nude-200" :
                    status === "missed" ? "bg-red-50" : "bg-theme-bg"}`}>
                  {PRAYER_ICONS[p]}
                </div>
                <div className={`w-1.5 h-1.5 rounded-full
                  ${status === "ontime" ? "bg-theme-bg0" :
                    status === "late"   ? "bg-nude-300" :
                    status === "missed" ? "bg-red-200" : "bg-theme-surface"}`} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-3">
        <button
          onClick={handleNudge}
          disabled={isPending || nudgeSent || (friend?.donePrayers ?? 0) === 5}
          className={`w-full py-2.5 rounded-2xl text-xs font-bold tracking-wide transition-all active:scale-95
            ${nudgeSent
              ? "bg-theme-surface text-theme-muted"
              : (friend?.donePrayers ?? 0) === 5
                ? "bg-theme-bg text-theme-muted/70 cursor-not-allowed"
                : "bg-gradient-to-r from-nude-200 to-nude-300 text-theme-text"}`}
        >
          {nudgeSent ? "Nudge sent! 🌸" : (friend?.donePrayers ?? 0) === 5 ? "✓ All prayers done today" : "🌸 Send a gentle nudge"}
        </button>
      </div>
    </div>
  );
}