"use client";

import { useCallback, useEffect, useState } from "react";
import { getTodayHijri } from "@/lib/hijriCalendar";

export const THEME_STORAGE_KEY = "salah_theme";
export const THEMES = ["nude", "midnight", "forest", "ocean", "ramadan"] as const;
export type ThemeName = (typeof THEMES)[number];

function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && THEMES.includes(value as ThemeName);
}

function applyTheme(theme: ThemeName) {
  document.documentElement.setAttribute("data-theme", theme);
}

function getDefaultTheme(): ThemeName {
  return getTodayHijri().month === 9 ? "ramadan" : "nude";
}

function getStoredTheme(): ThemeName | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeName(raw) ? raw : null;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>("nude");

  useEffect(() => {
    const initialTheme = getStoredTheme() ?? getDefaultTheme();
    setThemeState(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const setTheme = useCallback((nextTheme: ThemeName) => {
    setThemeState(nextTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    }
    applyTheme(nextTheme);
  }, []);

  const isRamadan = getTodayHijri().month === 9;

  return { theme, setTheme, isRamadan };
}
