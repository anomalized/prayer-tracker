"use client";

import { useMemo } from "react";
import { useTheme, type ThemeName } from "@/hooks/useTheme";

const OPTIONS: Array<{ id: ThemeName; label: string; accent: string }> = [
  { id: "nude", label: "Nude", accent: "#d4786a" },
  { id: "midnight", label: "Midnight", accent: "#f7c25d" },
  { id: "forest", label: "Forest", accent: "#7bbf6a" },
  { id: "ocean", label: "Ocean", accent: "#4bc8d2" },
  { id: "ramadan", label: "Ramadan", accent: "#f6d57b" },
];

export default function ThemePicker() {
  const { theme, setTheme, isRamadan } = useTheme();

  const ramadanActive = useMemo(() => isRamadan && theme !== "ramadan", [isRamadan, theme]);

  return (
    <div className="theme-transition bg-theme-surface border border-theme-border rounded-3xl p-4 space-y-4">
      <div>
        <p className="font-body text-xs font-bold tracking-widest uppercase text-theme-muted">
          Theme
        </p>
        <p className="mt-2 text-sm text-theme-secondary leading-relaxed">
          Choose your favorite style. Ramadan theme activates automatically during the Hijri month of Ramadan.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {OPTIONS.map((option) => {
          const active = theme === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              aria-label={`Select ${option.label} theme`}
              aria-pressed={active}
              className={`relative h-14 w-14 rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2 ${
                active
                  ? "border-theme-accent shadow-lg"
                  : "border-theme-border bg-theme-bg"
              }`}
            >
              <span
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: option.accent }}
              />
              {active && (
                <span className="relative flex h-full w-full items-center justify-center text-white text-xl font-bold">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {ramadanActive && (
        <div className="rounded-2xl border border-theme-border bg-theme-bg px-3 py-2 text-xs text-theme-muted">
          Ramadan is currently active. Tap the Ramadan swatch to apply the special theme.
        </div>
      )}
    </div>
  );
}
