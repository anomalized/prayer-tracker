"use client";

interface ReportData {
  pct: number;
  ontime: number;
  late: number;
  missed: number;
  pointsEarned: number;
  perfectDays: number;
  bestDayLabel: string | null;
  mostMissed: string | null;
  streak: number;
  from: string;
  to: string;
}

interface Props { report: ReportData; onDismiss: () => void; }

const GRADE = (pct: number) => {
  if (pct >= 95) return { label: "Excellent", emoji: "🌟", color: "#22c55e" };
  if (pct >= 80) return { label: "Great",     emoji: "✨", color: "#d4786a" };
  if (pct >= 60) return { label: "Good",      emoji: "🌸", color: "#f59e0b" };
  if (pct >= 40) return { label: "Fair",      emoji: "💪", color: "#94a3b8" };
  return              { label: "Keep going", emoji: "🤲", color: "#cbd5e1" };
};

export default function WeeklyReport({ report, onDismiss }: Props) {
  const grade    = GRADE(report.pct);
  const fromLabel = new Date(report.from).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const toLabel   = new Date(report.to).toLocaleDateString("en-US",   { month: "short", day: "numeric" });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm" onClick={onDismiss}>
      <div className="bg-theme-bg rounded-t-[2.5rem] w-full max-w-md pb-10 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>

        <div className="relative overflow-hidden px-6 pt-8 pb-6 text-center"
          style={{ background: "linear-gradient(160deg, #c8705a, #e8a090)" }}>
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-theme-surface/10" />
          <p className="font-body text-xs tracking-widest text-white/70 uppercase mb-1">Weekly Report</p>
          <p className="font-body text-xs text-white/60 mb-3">{fromLabel} – {toLabel}</p>
          <div className="text-6xl mb-2">{grade.emoji}</div>
          <p className="font-display text-3xl font-bold text-white">{grade.label}</p>
          <p className="font-body text-sm text-white/80 mt-1">{report.pct}% prayers completed</p>
        </div>

        <div className="flex justify-center -mt-8 mb-4 relative z-10">
          <div className="w-20 h-20 rounded-full bg-theme-surface shadow-lg flex flex-col items-center justify-center border-4"
            style={{ borderColor: grade.color }}>
            <p className="font-display text-2xl font-bold" style={{ color: grade.color }}>{report.pct}%</p>
          </div>
        </div>

        <div className="px-5 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "On time", value: report.ontime,  emoji: "✅" },
              { label: "Late",    value: report.late,    emoji: "⏰" },
              { label: "Missed",  value: report.missed,  emoji: "❌" },
            ].map(s => (
              <div key={s.label} className="bg-theme-surface rounded-2xl p-3 text-center border border-theme-border">
                <p className="text-xl">{s.emoji}</p>
                <p className="font-display text-xl font-bold text-theme-text">{s.value}</p>
                <p className="font-body text-xs text-theme-muted">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-theme-surface rounded-2xl p-4 border border-theme-border space-y-2.5">
            {[
              { icon: "⭐", label: "Points earned this week",      value: `+${report.pointsEarned}` },
              { icon: "🏅", label: "Perfect days (all 5 prayers)", value: `${report.perfectDays}/7` },
              { icon: "🔥", label: "Current streak",               value: `${report.streak} days`   },
              ...(report.bestDayLabel ? [{ icon: "👑", label: "Best day",          value: report.bestDayLabel }] : []),
              ...(report.mostMissed   ? [{ icon: "⚠️", label: "Most missed prayer", value: report.mostMissed   }] : []),
            ].map(h => (
              <div key={h.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{h.icon}</span>
                  <p className="font-body text-sm text-theme-text">{h.label}</p>
                </div>
                <p className="font-body text-sm font-bold text-theme-text">{h.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-theme-surface rounded-2xl p-4 text-center">
            <p className="font-body text-sm text-theme-text italic">
              {report.pct >= 80
                ? "\"Indeed, prayer has been decreed upon the believers at specified times.\" — Quran 4:103 🌸"
                : report.mostMissed
                ? `Focus on ${report.mostMissed} this week — small steps add up 🤲`
                : "Every prayer counts. Keep going, one salah at a time 🌸"}
            </p>
          </div>

          <button onClick={onDismiss}
            className="w-full py-4 bg-gradient-to-r from-nude-400 to-nude-500 text-white font-bold font-body rounded-2xl active:scale-95 transition-transform">
            Start This Week Fresh 🌟
          </button>
        </div>
      </div>
    </div>
  );
}