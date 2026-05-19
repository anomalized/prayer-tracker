"use client";

import { useState } from "react";
import { getRank, RANK_COLORS, getRankProgress } from "@/lib/utils";
import MenuButton from "@/components/ui/MenuButton";

interface Props {
  userName: string;
  donePrayers: number;
  totalPoints: number;
  currentStreak: number;
  extraPoints: number; // live points earned this session
  pendingSync: number;   // ← NEW: count of queued offline prayers
}


// Hijri date conversion (Umm al-Qura approximation)
function toHijri(date: Date): string {
  const MONTHS = [
    "Muharram","Safar","Rabi al-Awwal","Rabi al-Thani",
    "Jumada al-Awwal","Jumada al-Thani","Rajab","Sha'ban",
    "Ramadan","Shawwal","Dhu al-Qi'dah","Dhu al-Hijjah"
  ];
  try {
    // Use Intl API if available (modern browsers)
    const parts = new Intl.DateTimeFormat("en-TN-u-ca-islamic-umalqura", {
      day: "numeric", month: "long", year: "numeric"
    }).formatToParts(date);
    const d = parts.find(p => p.type === "day")?.value;
    const m = parts.find(p => p.type === "month")?.value;
    const y = parts.find(p => p.type === "year")?.value;
    return `${d} ${m} ${y} AH`;
  } catch {
    // Fallback approximation
    const JD = Math.floor((date.getTime() / 86400000) + 2440587.5);
    const l = JD - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const ll = l - 10631 * n + 354;
    const j = Math.floor((10985 - ll) / 5316) * Math.floor((50 * ll) / 17719)
      + Math.floor(ll / 5670) * Math.floor((43 * ll) / 15238);
    const lll = ll - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
      - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const month = Math.floor((24 * lll) / 709);
    const day = lll - Math.floor((709 * month) / 24);
    const year = 30 * n + j - 30;
    return `${day} ${MONTHS[month - 1]} ${year} AH`;
  }
}

export default function TodayHeader({ userName, donePrayers, totalPoints, currentStreak, extraPoints, pendingSync }: Props) {
  const livePoints = totalPoints + extraPoints;
  const rank = getRank(livePoints);
  const progress = getRankProgress(livePoints);
  const rankColor = RANK_COLORS[rank];

  const hijriDate = toHijri(new Date());
  const greetings = ["Peace be upon you", "Assalamu Alaikum", "Welcome back"];
  const greeting = greetings[0];

  return (
    <div className="bg-gradient-to-b from-nude-200 to-nude-100 px-5 pt-12 pb-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-nude-300 opacity-20" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-nude-300 opacity-15" />

      {/* Menu button */}
      <MenuButton className="absolute top-12 md:top-6 right-5 z-10" dark={false} />

      {/* ── NEW: Offline sync indicator ─────────────────────────────── */}
      {/* Only renders when there are prayers waiting to sync.            */}
      {/* Positioned in the top-left, beneath the date line.             */}
      {pendingSync > 0 && (
        <div
          className="inline-flex items-center gap-1.5 bg-amber-50 border
            border-amber-200 rounded-full px-2.5 py-1 mb-2 relative z-10"
          role="status"
          aria-label={`${pendingSync} prayer${pendingSync > 1 ? "s" : ""} pending sync`}
        >
          {/* Pulsing amber dot */}
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full
              rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <p className="font-body text-[10px] font-bold text-amber-700">
            {pendingSync} prayer{pendingSync > 1 ? "s" : ""} pending sync
          </p>
        </div>
      )}

      {/* Greeting — unchanged */}
      <div className="mb-1">
        <p className="font-body text-xs tracking-widest text-nude-500 uppercase">
          {new Date().toLocaleDateString("en-US", { weekday:"long", day:"numeric", month:"long" })}
        </p>
        <p className="font-body text-xs text-nude-400 mt-0.5">
          🌙 {hijriDate}
        </p>
      </div>
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