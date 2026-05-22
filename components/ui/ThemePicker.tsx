"use client";

import { useMemo } from "react";
import CanvasBackground from "./CanvasBackground";
import { useTheme, type ThemeName, THEME_META, THEMES } from "@/hooks/useTheme";

export default function ThemePicker() {
  const { theme, setTheme, meta } = useTheme();
  const optionList = useMemo(
    () => THEMES.map((id) => ({ id, ...THEME_META[id] })),
    []
  );

  return (
    <div className="glass rounded-3xl p-4 space-y-5 border border-white/10">
      <div>
        <p className="font-body text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--color-text-muted)' }}>
          Theme Studio
        </p>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Pick a mood and watch the preview update instantly. Your selected theme stays in local storage.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {optionList.map(({ id, label, accent, emoji, description }) => {
          const active = theme === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              aria-label={`Select ${label} theme`}
              aria-pressed={active}
              className={`group relative overflow-hidden rounded-[28px] border p-3 text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                active
                  ? "border-white/30 bg-theme-surface/10 shadow-[0_24px_70px_rgba(0,0,0,0.12)]"
                  : "border-white/10 bg-theme-surface/5 hover:border-white/20 hover:bg-theme-surface/10"
              }`}
              style={{ borderColor: active ? "rgba(255,255,255,0.35)" : undefined }}
            >
              <div className="relative h-32 overflow-hidden rounded-3xl bg-black/5 mb-3">
                <CanvasBackground theme={id} className="absolute inset-0" height={128} />
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white/90" style={{ backgroundColor: `${accent}cc` }}>
                  {emoji} {label}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-display text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {label}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {description}
                  </p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-lg ${active ? "bg-theme-surface/20 text-white" : "bg-theme-surface/5 text-white/80"}`}>
                  {active ? "✓" : "›"}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="glass rounded-3xl border border-white/10 p-4">
        <p className="text-xs uppercase tracking-[0.22em] font-bold" style={{ color: 'var(--color-text-muted)' }}>
          Current theme
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {meta.label}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {meta.description}
            </p>
          </div>
          <div className="h-12 min-w-[3rem] rounded-2xl" style={{ background: meta.accent }} />
        </div>
      </div>
    </div>
  );
}
