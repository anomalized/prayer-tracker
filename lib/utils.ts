import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import type { Rank } from "@/types";

// ─── Tailwind class merging ───────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date helpers ────────────────────────────────────────────
// offsetHours: UTC offset of the user's timezone (e.g. 5 for PKT)
// On client, uses local time. On server, pass offset explicitly.
export function todayString(offsetHours: number = 5): string {
  const now = new Date();
  // Shift UTC time by the given offset
  const local = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
  const yyyy = local.getUTCFullYear();
  const mm   = String(local.getUTCMonth() + 1).padStart(2, "0");
  const dd   = String(local.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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