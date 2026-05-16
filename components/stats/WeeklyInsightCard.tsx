"use client";

import { useEffect } from "react";
import { useWeeklyInsight } from "@/hooks/useWeeklyInsight";

interface PrayerLog {
  prayer_name: string;
  date: string;
  status: string;
}

interface Props {
  logs: PrayerLog[];
}

const PRAYER_ICONS: Record<string, string> = {
  Fajr: "🌙", Dhuhr: "☀️", Asr: "🌤️", Maghrib: "🌇", Isha: "🌌",
};

export default function WeeklyInsightCard({ logs }: Props) {
  const { insight, loading, error, fetch } = useWeeklyInsight();

  // Fetch once on mount — memoised by the hook so safe to call here
  useEffect(() => {
    if (logs.length >= 15) fetch(logs); // don't call with too-sparse data
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white border border-nude-100 rounded-3xl p-5 shadow-sm space-y-3 animate-pulse">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-nude-200" />
          <div className="h-4 bg-nude-200 rounded-xl w-40" />
        </div>
        <div className="h-3 bg-nude-100 rounded-xl w-full" />
        <div className="h-3 bg-nude-100 rounded-xl w-4/5" />
        <div className="h-px bg-nude-100 my-2" />
        <div className="h-3 bg-nude-100 rounded-xl w-full" />
        <div className="h-3 bg-nude-100 rounded-xl w-3/4" />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-3xl p-5 shadow-sm">
        <p className="font-body text-xs font-bold text-red-400 mb-1">
          Couldn't load insight
        </p>
        <p className="font-body text-xs text-red-300">{error}</p>
        <button
          onClick={() => fetch(logs)}
          className="mt-3 px-4 py-2 bg-white border border-red-100 rounded-2xl
            text-xs font-bold text-red-400 hover:bg-red-50 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Not enough data ───────────────────────────────────────────────────────
  if (logs.length < 15) {
    return (
      <div className="bg-nude-50 border border-nude-100 rounded-3xl p-5 shadow-sm text-center">
        <p className="text-2xl mb-2">🌱</p>
        <p className="font-body text-sm font-bold text-nude-600">
          Keep logging to unlock insights
        </p>
        <p className="font-body text-xs text-nude-400 mt-1">
          AI insights unlock after 3 days of prayer logs.
        </p>
      </div>
    );
  }

  // ── Empty state before fetch resolves ─────────────────────────────────────
  if (!insight) return null;

  const icon = PRAYER_ICONS[insight.focusPrayer.name] ?? "🤲";

  return (
    <div className="bg-white border border-nude-100 rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className="px-5 py-4 border-b border-nude-100"
        style={{ background: "linear-gradient(135deg, #fdf0ea, #f5e2d8)" }}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-base">✦</span>
          <p className="font-body text-[10px] font-bold tracking-widest text-nude-400 uppercase">
            AI Weekly Insight
          </p>
        </div>
        <p className="font-body text-xs text-nude-400">
          Based on your last 30 days
        </p>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Summary */}
        <div>
          <p className="font-body text-sm text-slate-700 leading-relaxed">
            {insight.summary}
          </p>
        </div>

        <div className="h-px bg-nude-100" />

        {/* Focus prayer */}
        <div
          className="rounded-2xl p-4 border border-nude-100"
          style={{ background: "#fffaf7" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{icon}</span>
            <div>
              <p className="font-body text-xs font-bold text-nude-400 uppercase tracking-widest">
                Focus prayer
              </p>
              <p className="font-body text-base font-bold text-nude-800">
                {insight.focusPrayer.name}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-body text-xs text-nude-400">On-time rate</p>
              <p
                className="font-display text-lg font-bold"
                style={{
                  color: insight.focusPrayer.ontimeRate >= 60
                    ? "#d4786a"
                    : "#e87060",
                }}
              >
                {insight.focusPrayer.ontimeRate}%
              </p>
            </div>
          </div>
          <p className="font-body text-xs text-slate-500 leading-relaxed">
            {insight.focusPrayer.pattern}
          </p>
        </div>

        <div className="h-px bg-nude-100" />

        {/* Tip */}
        <div>
          <p className="font-body text-[10px] font-bold tracking-widest text-nude-400 uppercase mb-2">
            🤲 Tip from our tradition
          </p>
          <p className="font-body text-sm text-slate-700 leading-relaxed">
            {insight.tip}
          </p>
          <p className="font-body text-xs text-nude-400 mt-2 italic">
            — {insight.tipSource}
          </p>
        </div>
      </div>
    </div>
  );
}