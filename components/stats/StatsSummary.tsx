"use client";

interface Props {
  totalPoints: number;
  currentStreak: number;
  bestStreak: number;
  thisMonthPct: number;
  mostMissed: string;
  onTimeRate: number;
}

export default function StatsSummary({
  totalPoints,
  currentStreak,
  bestStreak,
  thisMonthPct,
  mostMissed,
  onTimeRate,
}: Props) {
  const cards = [
    { label: "Current Streak", value: `${currentStreak} days`, icon: "🔥" },
    { label: "Best Streak",    value: `${bestStreak} days`,    icon: "🏆" },
    { label: "This Month",     value: `${thisMonthPct}%`,      icon: "📅" },
    { label: "On Time Rate",   value: `${onTimeRate}%`,        icon: "⏰" },
    { label: "Most Missed",    value: mostMissed || "—",       icon: "😴" },
    { label: "Total Points",   value: totalPoints.toString(),  icon: "⭐" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(card => (
        <div
          key={card.label}
          className="glass rounded-2xl p-3.5 shadow-sm hover:animate-glow-pulse transition-all"
          style={{ borderLeft: '4px solid var(--color-accent)', borderColor: 'transparent' }}
        >
          <p className="text-2xl mb-1 opacity-60">{card.icon}</p>
          <p className="font-display text-xl font-bold" style={{ color: 'var(--color-accent)' }}>{card.value}</p>
          <p className="font-body text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{card.label}</p>
        </div>
      ))}
    </div>
  );
}
