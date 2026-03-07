"use client";

import { useState, useEffect } from "react";
import TodayHeader from "@/components/prayers/TodayHeader";
import PrayerCard from "@/components/prayers/PrayerCard";
import StreakBanner from "@/components/ui/StreakBanner";
import Onboarding from "@/components/ui/Onboarding";
import WeeklyReport from "@/components/ui/WeeklyReport";
import { useStreakCheck } from "@/hooks/useStreakCheck";
import { getWeeklyReport } from "@/lib/actions/weeklyReport";
import type { PrayerTime, PrayerLog } from "@/types";

interface Props {
  userName: string;
  prayerTimes: PrayerTime[];
  todayLogs: PrayerLog[];
  stats: {
    total_points: number;
    current_streak: number;
    best_streak: number;
    last_active_date?: string | null;
  } | null;
}

function usePrayerNotifications(prayerTimes: PrayerTime[]) {
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    prayerTimes.forEach(prayer => {
      const [hours, minutesPart] = prayer.time.split(":");
      const [mins, ampm] = minutesPart.split(" ");
      let h = parseInt(hours);
      const m = parseInt(mins);
      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;

      const prayerDate = new Date();
      prayerDate.setHours(h, m, 0, 0);

      // Notify 10 min before
      const notifyAt = new Date(prayerDate.getTime() - 10 * 60 * 1000);
      const msUntil  = notifyAt.getTime() - Date.now();

      if (msUntil > 0 && msUntil < 24 * 60 * 60 * 1000) {
        const timer = setTimeout(() => {
          new Notification(`🕌 ${prayer.name} in 10 minutes`, {
            body: `${prayer.name} prayer time is approaching — ${prayer.time}`,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: `prayer-${prayer.name}`,
          });
        }, msUntil);
        timers.push(timer);
      }
    });

    return () => timers.forEach(clearTimeout);
  }, [prayerTimes]);
}

export default function TodayClient({ userName, prayerTimes, todayLogs, stats }: Props) {
  const [extraPoints, setExtraPoints]         = useState(0);
  const [showOnboarding, setShowOnboarding]   = useState(false);
  const [weeklyReport, setWeeklyReport]       = useState<any>(null);
  const [reportDismissed, setReportDismissed] = useState(false);
  const [notifAsked, setNotifAsked]           = useState(false);

  useStreakCheck();
  usePrayerNotifications(prayerTimes);

  // Show onboarding on first visit
  useEffect(() => {
    const seen = localStorage.getItem("onboarding_complete");
    if (!seen) setShowOnboarding(true);
  }, []);

  // Ask for notification permission once
  useEffect(() => {
    if (notifAsked) return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      const timer = setTimeout(() => {
        Notification.requestPermission();
        setNotifAsked(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notifAsked]);

  // Show weekly report on Sundays (once per week)
  useEffect(() => {
    const isSunday = new Date().getDay() === 0;
    if (!isSunday) return;
    const lastShown = localStorage.getItem("weekly_report_shown");
    const thisWeek  = new Date().toISOString().slice(0, 10);
    if (lastShown === thisWeek) return;

    getWeeklyReport().then(report => {
      if (report) {
        setWeeklyReport(report);
        localStorage.setItem("weekly_report_shown", thisWeek);
      }
    });
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("onboarding_complete", "true");
    setShowOnboarding(false);
  };

  const logMap = Object.fromEntries(
    todayLogs.map(l => [l.prayer_name, { status: l.status, note: l.note ?? null }])
  );

  const donePrayers = todayLogs.filter(l => l.status !== "missed").length;

  return (
    <div className="min-h-screen bg-nude-50">
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}

      {weeklyReport && !reportDismissed && (
        <WeeklyReport report={weeklyReport} onDismiss={() => setReportDismissed(true)} />
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