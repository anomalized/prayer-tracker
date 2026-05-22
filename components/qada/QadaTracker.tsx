"use client";

import { useState, useTransition, useRef } from "react";
import { incrementMadeUp, setRemaining } from "@/lib/actions/qada";
import type { PrayerName } from "@/types";
import type { QadaStats } from "@/lib/actions/qada";

const PRAYERS: PrayerName[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const PRAYER_META: Record<PrayerName, { icon: string; arabic: string; time: string }> = {
  Fajr:    { icon: "🌙", arabic: "الفجر",  time: "Pre-dawn" },
  Dhuhr:   { icon: "☀️", arabic: "الظهر",  time: "Midday"   },
  Asr:     { icon: "🌤️", arabic: "العصر",  time: "Afternoon"},
  Maghrib: { icon: "🌇", arabic: "المغرب", time: "Sunset"   },
  Isha:    { icon: "🌌", arabic: "العشاء", time: "Night"    },
};

interface Props {
  initialStats: QadaStats;
}

type LocalStats = Record<PrayerName, {
  madeUpCount: number;
  remainingCount: number;
}>;

interface PrayerRowProps {
  name: PrayerName;
  madeUpCount: number;
  remainingCount: number;
  isPending: boolean;
  onIncrement: (name: PrayerName) => void;
  onSetRemaining: (name: PrayerName, val: number) => void;
}

function PrayerRow({
  name,
  madeUpCount,
  remainingCount,
  isPending,
  onIncrement,
  onSetRemaining,
}: PrayerRowProps) {
  const meta = PRAYER_META[name];
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(remainingCount));
  const [flash, setFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const total = madeUpCount + remainingCount;
  const progress = total > 0 ? Math.round((madeUpCount / total) * 100) : 0;
  const done = remainingCount === 0 && madeUpCount > 0;

  const handleIncrement = () => {
    if (remainingCount === 0) return;
    onIncrement(name);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 600);
  };

  const handleEditStart = () => {
    setInputVal(String(remainingCount));
    setEditing(true);
    window.setTimeout(() => inputRef.current?.select(), 50);
  };

  const handleEditCommit = () => {
    const parsed = parseInt(inputVal, 10);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed !== remainingCount) {
      onSetRemaining(name, parsed);
    }
    setEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleEditCommit();
    if (e.key === "Escape") setEditing(false);
  };

  return (
    <div
      className={`rounded-3xl border p-4 transition-all duration-300
        ${done
          ? "bg-gradient-to-br from-nude-100 to-nude-200 border-theme-border"
          : "bg-theme-surface border-theme-border"
        }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center
            text-xl flex-shrink-0 transition-all duration-300
            ${done ? "bg-gradient-to-br from-nude-300 to-nude-400" : "bg-theme-surface"}`}
        >
          {done ? "✓" : meta.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <p className="font-display text-base font-bold text-theme-text">{name}</p>
            <p className="font-body text-xs text-theme-muted">{meta.arabic}</p>
          </div>
          <p className="font-body text-xs text-theme-muted">{meta.time}</p>
        </div>

        <div className="flex flex-col items-end mr-2">
          <p className="font-body text-[10px] font-bold tracking-widest text-theme-muted uppercase">
            Remaining
          </p>
          {editing ? (
            <input
              ref={inputRef}
              type="number"
              min="0"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={handleEditCommit}
              onKeyDown={handleEditKeyDown}
              className="w-16 text-right bg-theme-bg border border-theme-border rounded-xl px-2 py-0.5 font-display text-xl font-bold text-theme-text focus:outline-none focus:border-nude-400"
            />
          ) : (
            <button
              onClick={handleEditStart}
              title="Tap to edit remaining count"
              className="font-display text-2xl font-bold text-theme-text hover:text-theme-text transition-colors leading-none"
            >
              {remainingCount}
            </button>
          )}
        </div>

        <button
          onClick={handleIncrement}
          disabled={isPending || remainingCount === 0}
          title={remainingCount === 0 ? "All made up!" : `Log one ${name} qada`}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0 transition-all duration-200 active:scale-90 disabled:cursor-not-allowed
            ${flash
              ? "bg-green-100 border-green-300 text-green-600 scale-110"
              : remainingCount === 0
                ? "bg-theme-bg border border-theme-border text-nude-200"
                : isPending
                  ? "opacity-60 bg-gradient-to-br from-nude-300 to-nude-400 text-white"
                  : "bg-gradient-to-br from-nude-400 to-nude-500 text-white shadow-sm hover:shadow-md hover:scale-105"
            }`}
        >
          {flash ? "✓" : "+"}
        </button>
      </div>

      {total > 0 && (
        <div className="mt-3">
          <div className="flex justify-between items-center mb-1">
            <p className="font-body text-[10px] text-theme-muted">{madeUpCount} made up</p>
            <p className="font-body text-[10px] text-theme-muted">{done ? "Complete 🌸" : `${progress}%`}</p>
          </div>
          <div className="h-1.5 bg-theme-surface rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: done
                  ? "linear-gradient(90deg, #a8d5a2, #78c472)"
                  : "linear-gradient(90deg, #e8a898, #d4786a)",
              }}
            />
          </div>
        </div>
      )}

      {total === 0 && (
        <p className="font-body text-xs text-theme-muted/70 mt-2 pl-1">
          Tap the number above to set how many you owe
        </p>
      )}
    </div>
  );
}

export default function QadaTracker({ initialStats }: Props) {
  const [isPending, startTransition] = useTransition();
  const [localStats, setLocalStats] = useState<LocalStats>(() =>
    Object.fromEntries(
      PRAYERS.map((p) => [
        p,
        {
          madeUpCount: initialStats[p].madeUpCount,
          remainingCount: initialStats[p].remainingCount,
        },
      ])
    ) as LocalStats
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    window.setTimeout(() => setErrorMsg(null), 4000);
  };

  const handleIncrement = (name: PrayerName) => {
    setLocalStats((prev) => ({
      ...prev,
      [name]: {
        madeUpCount: prev[name].madeUpCount + 1,
        remainingCount: Math.max(0, prev[name].remainingCount - 1),
      },
    }));

    startTransition(async () => {
      const result = await incrementMadeUp(name);
      if (result.error) {
        setLocalStats((prev) => ({
          ...prev,
          [name]: {
            madeUpCount: prev[name].madeUpCount - 1,
            remainingCount: prev[name].remainingCount + 1,
          },
        }));
        showError(`Couldn't save: ${result.error}`);
      }
    });
  };

  const handleSetRemaining = (name: PrayerName, count: number) => {
    const previous = localStats[name].remainingCount;

    setLocalStats((prev) => ({
      ...prev,
      [name]: { ...prev[name], remainingCount: count },
    }));

    startTransition(async () => {
      const result = await setRemaining(name, count);
      if (result.error) {
        setLocalStats((prev) => ({
          ...prev,
          [name]: { ...prev[name], remainingCount: previous },
        }));
        showError(`Couldn't save: ${result.error}`);
      }
    });
  };

  const totalRemaining = PRAYERS.reduce(
    (sum, p) => sum + localStats[p].remainingCount,
    0
  );
  const totalMadeUp = PRAYERS.reduce(
    (sum, p) => sum + localStats[p].madeUpCount,
    0
  );
  const totalDebt = totalRemaining + totalMadeUp;
  const overallPct = totalDebt > 0 ? Math.round((totalMadeUp / totalDebt) * 100) : 0;

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center gap-2">
          <span className="text-sm">⚠️</span>
          <p className="font-body text-xs text-red-500">{errorMsg}</p>
        </div>
      )}

      {totalDebt > 0 ? (
        <div className="rounded-3xl border border-theme-border p-5" style={{ background: "linear-gradient(135deg, #fdf0ea, #f5e2d8)" }}>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="font-body text-[10px] font-bold tracking-widest text-theme-muted uppercase">
                Overall progress
              </p>
              <p className="font-display text-3xl font-bold text-theme-text mt-0.5">
                {totalMadeUp}
                <span className="font-body text-sm text-theme-muted ml-1 font-normal">
                  / {totalDebt} made up
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-body text-xs text-theme-muted">Remaining</p>
              <p className="font-display text-2xl font-bold" style={{ color: "#d4786a" }}>
                {totalRemaining}
              </p>
            </div>
          </div>

          <div className="h-2 bg-nude-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${overallPct}%`,
                background: "linear-gradient(90deg, #e8a898, #d4786a)",
              }}
            />
          </div>
          <p className="font-body text-xs text-theme-muted mt-1.5 text-right">
            {overallPct}% cleared
          </p>
        </div>
      ) : (
        <div className="bg-theme-bg border border-theme-border rounded-3xl p-5 text-center">
          <p className="text-3xl mb-2">🤲</p>
          <p className="font-display text-base font-bold text-theme-text">Track your qada prayers</p>
          <p className="font-body text-xs text-theme-muted mt-1 leading-relaxed max-w-xs mx-auto">
            Tap any number below to set how many makeup prayers you owe,
            then press <strong className="text-theme-text">+</strong> each time you complete one.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {PRAYERS.map((name) => (
          <PrayerRow
            key={name}
            name={name}
            madeUpCount={localStats[name].madeUpCount}
            remainingCount={localStats[name].remainingCount}
            isPending={isPending}
            onIncrement={handleIncrement}
            onSetRemaining={handleSetRemaining}
          />
        ))}
      </div>

      <p className="text-center text-xs text-theme-muted/70 font-body pb-2">
        Every makeup prayer brings you closer 🌸
      </p>
    </div>
  );
}
