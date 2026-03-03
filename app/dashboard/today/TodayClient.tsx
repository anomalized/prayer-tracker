"use client";

import { useState, useEffect } from "react";
import TodayHeader from "@/components/prayers/TodayHeader";
import PrayerCard from "@/components/prayers/PrayerCard";
import StreakBanner from "@/components/ui/StreakBanner";
import Onboarding from "@/components/ui/Onboarding";
import { useStreakCheck } from "@/hooks/useStreakCheck";
import type { PrayerTime, PrayerLog } from "@/types";
import { completeOnboarding } from "@/lib/actions/stats";

interface Props {
  userName: string;
  prayerTimes: PrayerTime[];
  todayLogs: PrayerLog[];
  stats: {
    total_points: number;
    current_streak: number;
    best_streak: number;
    last_active_date?: string | null;
    // undefined or false means onboarding not finished yet
    onboarding_complete?: boolean;
  } | null;
}

export default function TodayClient({ userName, prayerTimes, todayLogs, stats }: Props) {
  const [extraPoints, setExtraPoints] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(
    stats?.onboarding_complete === false
  );

  useStreakCheck();

  // we rely on server-side flag boarding_complete to determine whether
  // the user has ever seen the intro. it’s passed in via `stats` prop.
  const handleOnboardingComplete = async () => {
    // update the record so other devices / future sessions skip
    await completeOnboarding();
    setShowOnboarding(false);
  };

  const logMap = Object.fromEntries(
    todayLogs.map(l => [l.prayer_name, { status: l.status, note: l.note ?? null }])
  );

  const donePrayers = todayLogs.filter(l => l.status !== "missed").length;

  return (
    <div className="min-h-screen bg-nude-50">
      {showOnboarding && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}

      <TodayHeader
        userName={userName}
        donePrayers={donePrayers}
        totalPoints={stats?.total_points ?? 0}
        currentStreak={stats?.current_streak ?? 0}
        extraPoints={extraPoints}
      />

      <StreakBanner
        streak={stats?.current_streak ?? 0}
        lastActiveDate={stats?.last_active_date ?? null}
      />

      <div className="px-4 py-2 space-y-3">
        {prayerTimes.map((prayer, i) => (
          <PrayerCard
            key={prayer.name}
            prayer={prayer}
            currentStatus={logMap[prayer.name]?.status ?? null}
            currentNote={logMap[prayer.name]?.note ?? null}
            index={i}
            onPointsEarned={(pts) => setExtraPoints(p => p + pts)}
          />
        ))}
        <p className="text-center text-xs text-nude-300 font-body pt-2 pb-6">
          May Allah accept your prayers 🌸
        </p>
      </div>
    </div>
  );
}
