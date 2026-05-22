"use client";

import { useNav } from "./NavProvider";

interface Props {
  className?: string;
  dark?: boolean; // true = dark header (terracotta), false = light header (peach)
}

export default function MenuButton({ className = "", dark = false }: Props) {
  const { openDrawer } = useNav();

  return (
    <button
      onClick={openDrawer}
      aria-label="Open navigation"
      className={`md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
        dark
          ? "bg-theme-surface/20 hover:bg-theme-surface/30 text-white"
          : "bg-theme-surface/60 hover:bg-theme-surface/80 text-theme-text border border-theme-border"
      } ${className}`}
    >
      {/* Hamburger — 3 lines with top line shorter for elegance */}
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
        <rect x="0" y="0"  width="16" height="1.8" rx="0.9" fill="currentColor"/>
        <rect x="0" y="5"  width="12" height="1.8" rx="0.9" fill="currentColor"/>
        <rect x="0" y="10" width="16" height="1.8" rx="0.9" fill="currentColor"/>
      </svg>
    </button>
  );
}