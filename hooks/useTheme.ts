"use client";

import { useCallback, useEffect, useState } from "react";
import { getTodayHijri } from "@/lib/hijriCalendar";

export const THEME_STORAGE_KEY = "salah_theme";
export const THEMES = [
  "emerald",
  "midnight-mosque",
  "desert-dusk",
  "pearl-mist",
  "rose-garden",
  "sapphire-suhoor",
] as const;
export type ThemeName = (typeof THEMES)[number];

export const THEME_META: Record<ThemeName, { label: string; accent: string; dark: boolean; emoji: string; description: string }> = {
  emerald:           {label:"Emerald Sanctuary", accent:"#c9a84c", dark:true,  emoji:"🍃", description:"Deep forest, gold accents"},
  "midnight-mosque":{label:"Midnight Mosque",   accent:"#f7c25d", dark:true,  emoji:"🕌", description:"Night sky, stars & crescent"},
  "desert-dusk":     {label:"Desert Dusk",       accent:"#f0a040", dark:true,  emoji:"🏜️", description:"Warm terracotta, amber glow"},
  "pearl-mist":      {label:"Pearl Mist",        accent:"#7058a8", dark:false, emoji:"🪷", description:"Soft purple, iridescent"},
  "rose-garden":     {label:"Rose Garden",       accent:"#e06080", dark:true,  emoji:"🌹", description:"Deep rose, petal particles"},
  "sapphire-suhoor": {label:"Sapphire Suhoor",   accent:"#40b8d0", dark:true,  emoji:"💎", description:"Pre-dawn teal aurora"},
};

function isThemeName(v: unknown): v is ThemeName {
  return typeof v === "string" && (THEMES as readonly string[]).includes(v as string);
}

export function applyTheme(theme: ThemeName) {
  document.documentElement.setAttribute("data-theme", theme);
}

function getDefaultTheme(): ThemeName {
  return getTodayHijri().month === 9 ? "midnight-mosque" : "emerald";
}

function getStoredTheme(): ThemeName | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeName(raw) ? raw : null;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(getDefaultTheme());

  useEffect(() => {
    const initial = getStoredTheme() ?? getDefaultTheme();
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    if (typeof window !== "undefined") window.localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
  }, []);

  const isDark = THEME_META[theme]?.dark ?? true;
  const isRamadan = getTodayHijri().month === 9;

  return { theme, setTheme, isDark, meta: THEME_META[theme], isRamadan };
}
