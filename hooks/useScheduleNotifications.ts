"use client";

import { useEffect, useRef } from "react";
import { schedulePrayerNotifications } from "@/lib/actions/scheduleNotifications";
import type { PrayerTime } from "@/types";

const LS_KEY = "notifications_scheduled_date";

interface Options {
  prayers: PrayerTime[];
  timezone: string;
  dateGregorian: string;
  notificationsEnabled: boolean;
}

export function useScheduleNotifications({
  prayers,
  timezone,
  dateGregorian,
  notificationsEnabled,
}: Options): void {
  const hasFired = useRef(false);

  useEffect(() => {
    if (!notificationsEnabled) return;
    if (!prayers.length || !dateGregorian) return;

    const lastScheduled = localStorage.getItem(LS_KEY);
    if (lastScheduled === dateGregorian) return;
    if (hasFired.current) return;
    hasFired.current = true;

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "denied") return;
    }

    const schedule = async () => {
      try {
        const result = await schedulePrayerNotifications({
          prayers,
          timezone,
          dateGregorian,
        });

        if (result.error && process.env.NODE_ENV === "development") {
          console.warn("[useScheduleNotifications] Partial error:", result.error);
        }

        if (result.scheduled > 0 || result.skipped === prayers.length) {
          localStorage.setItem(LS_KEY, dateGregorian);
        }

        if (process.env.NODE_ENV === "development") {
          console.info(`[useScheduleNotifications] scheduled=${result.scheduled} skipped=${result.skipped}`);
        }
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          console.error("[useScheduleNotifications]", e);
        }
      }
    };

    schedule();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsEnabled, dateGregorian]);
}
