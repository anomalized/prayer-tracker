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
  }, [logs, fetch]);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-theme-surface border border-theme-border rounded-3xl p-5 shadow-sm space-y-3 animate-pulse">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-nude-200" />
          <div className="h-4 bg-nude-200 rounded-xl w-40" />
        </div>
        <div className="h-3 bg-theme-surface rounded-xl w-full" />
        <div className="h-3 bg-theme-surface rounded-xl w-4/5" />
        <div className="h-px bg-theme-surface my-2" />
        <div className="h-3 bg-theme-surface rounded-xl w-full" />
        <div className="h-3 bg-theme-surface rounded-xl w-3/4" />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-theme-surface border border-theme-border rounded-3xl p-5 shadow-sm"
        style={{ background: "rgba(212,120,106,0.08)", borderColor: "var(--color-accent)" }}>
        <p className="font-body text-xs font-bold mb-1"
          style={{ color: "var(--color-accent)" }}>
          Couldn't load insight
        </p>
        <p className="font-body text-xs" style={{ color: "var(--color-text-muted)" }}>{error}</p>
        <button
          onClick={() => fetch(logs)}
          className="mt-3 px-4 py-2 bg-theme-surface border rounded-2xl
            text-xs font-bold transition-colors hover:opacity-80"
          style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Not enough data ───────────────────────────────────────────────────────
  if (logs.length < 15) {
    return (
      <div className="bg-theme-bg border border-theme-border rounded-3xl p-5 shadow-sm text-center">
        <p className="text-2xl mb-2">🌱</p>
        <p className="font-body text-sm font-bold text-theme-text">
          Keep logging to unlock insights
        </p>
        <p className="font-body text-xs text-theme-muted mt-1">
          AI insights unlock after 3 days of prayer logs.
        </p>
      </div>
    );
  }

  // ── Empty state before fetch resolves ─────────────────────────────────────
  if (!insight) return null;

  const icon = PRAYER_ICONS[insight.focusPrayer.name] ?? "🤲";

  return (
    <div className="bg-theme-surface border border-theme-border rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className="px-5 py-4 border-b border-theme-border"
        style={{ background: "var(--card-gradient)" }}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-base">✦</span>
          <p className="font-body text-[10px] font-bold tracking-widest text-theme-muted uppercase">
            AI Weekly Insight
          </p>
        </div>
        <p className="font-body text-xs text-theme-muted">
          Based on your last 30 days
        </p>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Summary */}
        <div>
          <p className="font-body text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
            {insight.summary}
          </p>
        </div>

        <div className="h-px" style={{ background: "var(--color-border)" }} />

        {/* Focus prayer */}
        <div
          className="rounded-2xl p-4 border"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{icon}</span>
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                Focus prayer
              </p>
              <p className="font-body text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                {insight.focusPrayer.name}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-body text-xs" style={{ color: "var(--color-text-muted)" }}>On-time rate</p>
              <p
                className="font-display text-lg font-bold"
                style={{
                  color: insight.focusPrayer.ontimeRate >= 60
                    ? "var(--color-accent)"
                    : "var(--color-accent-dark)",
                }}
              >
                {insight.focusPrayer.ontimeRate}%
              </p>
            </div>
          </div>
          <p className="font-body text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            {insight.focusPrayer.pattern}
          </p>
        </div>

        <div className="h-px" style={{ background: "var(--color-border)" }} />

        {/* Tip */}
        <div>
          <p className="font-body text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: "var(--color-text-muted)" }}>
            🤲 Tip from our tradition
          </p>
          <p className="font-body text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
            {insight.tip}
          </p>
          <p className="font-body text-xs mt-2 italic" style={{ color: "var(--color-text-muted)" }}>
            — {insight.tipSource}
          </p>
        </div>
      </div>
    </div>
  );
}