"use client";

const PRAYER_ICONS: Record<string, string> = {
  Fajr: "🌙", Dhuhr: "☀️", Asr: "🌤️", Maghrib: "🌇", Isha: "🌌",
};

interface PrayerStat {
  name: string;
  ontime: number;
  late: number;
  missed: number;
  total: number;
  rate: number;
}

interface Props {
  breakdown: PrayerStat[];
}

export default function PrayerBreakdown({ breakdown }: Props) {
  return (
    <div className="bg-theme-surface border border-theme-border rounded-3xl p-4 shadow-sm">
      <p className="font-display text-lg font-bold text-theme-text mb-1">Prayer Breakdown</p>
      <p className="font-body text-xs text-theme-muted mb-4">Last 30 days per prayer</p>

      <div className="space-y-4">
        {breakdown.map(p => (
          <div key={p.name}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">{PRAYER_ICONS[p.name]}</span>
                <span className="font-body text-sm font-bold text-theme-text">{p.name}</span>
              </div>
              <span className="font-body text-xs text-theme-muted">
                {p.total > 0 ? `${p.rate}% on time` : "No data"}
              </span>
            </div>

            {/* Stacked bar */}
            <div className="h-2.5 bg-theme-surface rounded-full overflow-hidden flex">
              {p.total > 0 ? (
                <>
                  <div
                    className="h-full bg-theme-bg0 transition-all duration-700"
                    style={{ width: `${(p.ontime / p.total) * 100}%` }}
                  />
                  <div
                    className="h-full bg-nude-300 transition-all duration-700"
                    style={{ width: `${(p.late / p.total) * 100}%` }}
                  />
                  <div
                    className="h-full bg-red-100 transition-all duration-700"
                    style={{ width: `${(p.missed / p.total) * 100}%` }}
                  />
                </>
              ) : (
                <div className="h-full w-full bg-theme-surface" />
              )}
            </div>

            {/* Mini legend */}
            <div className="flex gap-3 mt-1">
              <span className="font-body text-xs text-theme-muted">
                <span className="inline-block w-2 h-2 rounded-sm bg-theme-bg0 mr-1" />
                {p.ontime} on time
              </span>
              <span className="font-body text-xs text-theme-muted">
                <span className="inline-block w-2 h-2 rounded-sm bg-nude-300 mr-1" />
                {p.late} late
              </span>
              <span className="font-body text-xs text-theme-muted">
                <span className="inline-block w-2 h-2 rounded-sm bg-red-100 mr-1" />
                {p.missed} missed
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
