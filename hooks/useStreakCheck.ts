"use client";

import { useEffect } from "react";
import { checkAndUpdateStreak } from "@/lib/actions/stats";

/**
 * Runs the streak check once when the app loads.
 * Uses localStorage to avoid running multiple times per day.
 */
export function useStreakCheck() {
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const lastChecked = localStorage.getItem("streak_checked_date");

    if (lastChecked !== today) {
      checkAndUpdateStreak().then(() => {
        localStorage.setItem("streak_checked_date", today);
      });
    }
  }, []);
}
