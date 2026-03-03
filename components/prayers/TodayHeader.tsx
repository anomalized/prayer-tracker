"use client";

import { useState } from "react";
import { getRank, RANK_COLORS, getRankProgress } from "@/lib/utils";

interface Props {
  userName: string;
  donePrayers: number;
  totalPoints: number;
  currentStreak: number;
  extraPoints: number; // live points earned this session
}

export default function TodayHeader({ userName, donePrayers, totalPoints, currentStreak, extraPoints }: Props) {
  const livePoints = totalPoints + extraPoints;
  const rank = getRank(livePoints);
  const progress = getRankProgress(livePoints);
  const rankColor = RANK_COLORS[rank];

  const greetings = ["Peace be upon you", "Assalamu Alaikum", "Welcome back"];
  const greeting = greetings[0];

  return (
    <div className="bg-gradient-to-b from-nude-200 to-nude-100 px-5 pt-12 pb-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-nude-300 opacity-20" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-nude-300 opacity-15" />

      {/* Greeting */}
      <p className="font-body text-xs tracking-widest text-nude-500 uppercase mb-1">
        {new Date().toLocaleDateString("en-US", { weekday:"long", day:"numeric", month:"long" })}
      </p>
      <h1 className="font-display text-3xl font-bold text-nude-800 mb-1">
        {greeting},
      </h1>
      <p className="font-display text-2xl text-nude-600 mb-5">{userName} 🌸</p>

      {/* Daily progress */}
      <div className="bg-white/60 rounded-2xl p-4 mb-4 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="font-body text-xs font-bold tracking-wider text-nude-600 uppercase">
            Today's Prayers
          </span>
          <span className="font-display text-lg font-bold text-nude-800">
            {donePrayers} / 5
          </span>
        </div>
        <div className="h-2 bg-nude-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(donePrayers / 5) * 100}%`,
              background: "linear-gradient(90deg, #e8a898, #d4786a)",
            }}
          />
        </div>
        {donePrayers === 5 && (
          <p className="text-center text-xs text-nude-500 font-body mt-2">
            ✨ Perfect day! All prayers complete
          </p>
        )}
      </div>

      {/* Stats pills */}
      <div className="flex gap-2">
        <div className="flex-1 bg-white/60 rounded-2xl px-3 py-2.5 backdrop-blur-sm text-center">
          <p className="font-body text-xs text-nude-500">Streak</p>
          <p className="font-display text-lg font-bold text-nude-800">🔥 {currentStreak}</p>
        </div>
        <div className="flex-1 bg-white/60 rounded-2xl px-3 py-2.5 backdrop-blur-sm text-center">
          <p className="font-body text-xs text-nude-500">Points</p>
          <p className="font-display text-lg font-bold text-nude-800">⭐ {livePoints}</p>
        </div>
        <div className="flex-1 bg-white/60 rounded-2xl px-3 py-2.5 backdrop-blur-sm text-center">
          <p className="font-body text-xs text-nude-500">Rank</p>
          <p className="font-display text-lg font-bold" style={{ color: rankColor }}>{rank}</p>
        </div>
      </div>

      {/* Rank progress bar */}
      <div className="mt-3">
        <div className="h-1 bg-nude-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, backgroundColor: rankColor }}
          />
        </div>
        <p className="text-right font-body text-xs text-nude-400 mt-1">
          {progress.toFixed(0)}% to next rank
        </p>
      </div>
    </div>
  );
}
