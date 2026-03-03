"use client";

interface Props {
  streak: number;
  lastActiveDate: string | null;
}

export default function StreakBanner({ streak, lastActiveDate }: Props) {
  if (streak === 0) return null;

  const today     = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Show warning if they haven't prayed today yet and streak is active
  const prayedToday = lastActiveDate === today;
  const atRisk = !prayedToday && lastActiveDate === yesterdayStr && streak > 2;

  if (!atRisk) return null;

  return (
    <div className="mx-4 mb-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
      <span className="text-2xl">⚠️</span>
      <div>
        <p className="font-body text-xs font-bold text-amber-700">Streak at risk!</p>
        <p className="font-body text-xs text-amber-600">
          You have a {streak}-day streak. Pray today to keep it! 🔥
        </p>
      </div>
    </div>
  );
}
