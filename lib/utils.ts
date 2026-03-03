import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import type { Rank } from "@/types";

// ─── Tailwind class merging ───────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date helpers ────────────────────────────────────────────
export function todayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatDate(date: string): string {
  return format(new Date(date), "EEEE, d MMMM yyyy");
}

// ─── Points & Rank ───────────────────────────────────────────
export function getRank(points: number): Rank {
  if (points < 500)  return "Bronze";
  if (points < 1000) return "Silver";
  if (points < 2000) return "Gold";
  return "Diamond";
}

export const RANK_COLORS: Record<Rank, string> = {
  Bronze:  "#c89b7b",
  Silver:  "#a0a0b0",
  Gold:    "#c9a84c",
  Diamond: "#c084fc",
};

export const RANK_THRESHOLDS: Record<Rank, number> = {
  Bronze:  500,
  Silver:  1000,
  Gold:    2000,
  Diamond: 5000,
};

export function getRankProgress(points: number): number {
  const rank = getRank(points);
  return Math.min((points / RANK_THRESHOLDS[rank]) * 100, 100);
}

// ─── Prayer config ───────────────────────────────────────────
export const PRAYER_CONFIG = [
  { name: "Fajr",    arabic: "الفجر", icon: "🌙" },
  { name: "Dhuhr",   arabic: "الظهر", icon: "☀️" },
  { name: "Asr",     arabic: "العصر", icon: "🌤️" },
  { name: "Maghrib", arabic: "المغرب", icon: "🌇" },
  { name: "Isha",    arabic: "العشاء", icon: "🌌" },
] as const;

export const POINTS_MAP = {
  ontime: 20,
  late:   10,
  missed: 0,
} as const;
