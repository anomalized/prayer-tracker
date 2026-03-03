"use client";

import { useState, useTransition } from "react";
import { removeFriend, sendNudge } from "@/lib/actions/friends";
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

  const rank      = getRank(friend.totalPoints);
  const rankColor = RANK_COLORS[rank];

  const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const prayerMap = Object.fromEntries(
    friend.todayPrayers.map(p => [p.prayer_name, p.status])
  );

  const handleNudge = () => {
    if (nudgeSent) return;
    startTransition(async () => {
      await sendNudge(friend.id);
      setNudgeSent(true);
      setTimeout(() => setNudgeSent(false), 5000);
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      await removeFriend(friend.friendshipId);
    });
  };

  const isAhead = friend.totalPoints > myPoints;
  const streakWinner = friend.currentStreak > myStreak;

  return (
    <div className="bg-white border border-nude-100 rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-nude-100 to-nude-200 px-4 py-4 flex items-center gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-nude-300 to-nude-400 flex items-center justify-center text-white font-display text-xl font-bold flex-shrink-0">
          {(friend.name ?? 'F')[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-display text-lg font-bold text-nude-800">{friend.name}</p>
          <p className="font-body text-xs text-nude-500">📍 {friend.city}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center text-nude-400 hover:text-nude-600 transition-colors"
          >
            ···
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 bg-white border border-nude-200 rounded-2xl shadow-lg py-1 z-10 min-w-[140px]">
              <button
                onClick={() => { handleRemove(); setShowMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-xs font-body text-red-400 hover:bg-nude-50"
              >
                Remove friend
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-nude-100 border-b border-nude-100">
        <div className="py-3 text-center">
          <p className="font-display text-lg font-bold text-nude-800">
            {friend.currentStreak}
            {streakWinner && <span className="text-xs ml-1">👑</span>}
          </p>
          <p className="font-body text-xs text-nude-400">🔥 Streak</p>
        </div>
        <div className="py-3 text-center">
          <p className="font-display text-lg font-bold" style={{ color: rankColor }}>
            {friend.totalPoints}
            {isAhead && <span className="text-xs ml-1">⬆️</span>}
          </p>
          <p className="font-body text-xs text-nude-400">⭐ Points</p>
        </div>
        <div className="py-3 text-center">
          <p className="font-display text-lg font-bold" style={{ color: rankColor }}>{rank}</p>
          <p className="font-body text-xs text-nude-400">🏅 Rank</p>
        </div>
      </div>

      {/* Today's prayers */}
      <div className="px-4 py-3 border-b border-nude-100">
        <p className="font-body text-xs font-bold tracking-widest text-nude-400 uppercase mb-2">
          Today · {friend.donePrayers}/5 prayers
        </p>
        <div className="flex gap-2">
          {PRAYERS.map(p => {
            const status = prayerMap[p];
            return (
              <div key={p} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base
                  ${status === "ontime" ? "bg-gradient-to-br from-nude-300 to-nude-400" :
                    status === "late"   ? "bg-nude-200" :
                    status === "missed" ? "bg-red-50" :
                    "bg-nude-50"}`}>
                  {PRAYER_ICONS[p]}
                </div>
                <div className={`w-1.5 h-1.5 rounded-full
                  ${status === "ontime" ? "bg-nude-500" :
                    status === "late"   ? "bg-nude-300" :
                    status === "missed" ? "bg-red-200" :
                    "bg-nude-100"}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Nudge button */}
      <div className="px-4 py-3">
        <button
          onClick={handleNudge}
          disabled={isPending || nudgeSent || friend.donePrayers === 5}
          className={`w-full py-2.5 rounded-2xl text-xs font-bold tracking-wide transition-all active:scale-95
            ${nudgeSent
              ? "bg-nude-100 text-nude-400"
              : friend.donePrayers === 5
                ? "bg-nude-50 text-nude-300 cursor-not-allowed"
                : "bg-gradient-to-r from-nude-200 to-nude-300 text-nude-700 hover:from-nude-300 hover:to-nude-400"
            }`}
        >
          {nudgeSent
            ? "Nudge sent! 🌸"
            : friend.donePrayers === 5
              ? "✓ All prayers done today"
              : "🌸 Send a gentle nudge"}
        </button>
      </div>
    </div>
  );
}
