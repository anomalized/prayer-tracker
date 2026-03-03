import type { PrayerName } from "@/types";

export interface BadgeDefinition {
  id: string;
  label: string;
  icon: string;
  description: string;
  check: (data: BadgeCheckData) => boolean;
}

export interface BadgeCheckData {
  totalPoints: number;
  currentStreak: number;
  bestStreak: number;
  todayLogs: Array<{ prayer_name: string; status: string }>;
  recentLogs: Array<{ date: string; prayer_name: string; status: string }>;
}

export const BADGES: BadgeDefinition[] = [
  {
    id: "first_prayer",
    label: "First Step",
    icon: "🌱",
    description: "Log your very first prayer",
    check: ({ recentLogs }) => recentLogs.length >= 1,
  },
  {
    id: "perfect_day",
    label: "Perfect Day",
    icon: "⭐",
    description: "Complete all 5 prayers in one day",
    check: ({ todayLogs }) =>
      todayLogs.filter(l => l.status === "ontime" || l.status === "late").length === 5,
  },
  {
    id: "fajr_champ",
    label: "Fajr Champion",
    icon: "🌅",
    description: "Pray Fajr on time 7 days in a row",
    check: ({ recentLogs }) => {
      const fajrOntime = recentLogs
        .filter(l => l.prayer_name === "Fajr" && l.status === "ontime")
        .map(l => l.date);
      return fajrOntime.length >= 7;
    },
  },
  {
    id: "streak_7",
    label: "Week Warrior",
    icon: "🔥",
    description: "Reach a 7-day streak",
    check: ({ currentStreak, bestStreak }) => Math.max(currentStreak, bestStreak) >= 7,
  },
  {
    id: "streak_30",
    label: "30-Day Legend",
    icon: "💫",
    description: "Reach a 30-day streak",
    check: ({ currentStreak, bestStreak }) => Math.max(currentStreak, bestStreak) >= 30,
  },
  {
    id: "points_500",
    label: "Silver Soul",
    icon: "🥈",
    description: "Earn 500 points",
    check: ({ totalPoints }) => totalPoints >= 500,
  },
  {
    id: "points_1000",
    label: "Golden Heart",
    icon: "🥇",
    description: "Earn 1000 points",
    check: ({ totalPoints }) => totalPoints >= 1000,
  },
  {
    id: "points_2000",
    label: "Diamond Soul",
    icon: "💎",
    description: "Earn 2000 points",
    check: ({ totalPoints }) => totalPoints >= 2000,
  },
  {
    id: "night_owl",
    label: "Night Guardian",
    icon: "🌌",
    description: "Pray Isha on time 14 times",
    check: ({ recentLogs }) =>
      recentLogs.filter(l => l.prayer_name === "Isha" && l.status === "ontime").length >= 14,
  },
  {
    id: "consistent",
    label: "Consistent Soul",
    icon: "🌸",
    description: "Log at least 1 prayer every day for 14 days",
    check: ({ recentLogs }) => {
      const dates = new Set(recentLogs.map(l => l.date));
      return dates.size >= 14;
    },
  },
];
