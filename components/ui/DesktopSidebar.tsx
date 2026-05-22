"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, BarChart3, Repeat, Settings, Users } from "lucide-react";
import IslamicIcon from "./IslamicIcon";

const NAV_SECTIONS: Array<{ label: string; items: Array<{ href: string; label: string; icon?: ReactNode; svgId?: string; desc: string }> }> = [
  {
    label: "Prayer",
    items: [
      { href: "/dashboard/today",   label: "Today",   svgId: "minaret", desc: "Daily prayers" },
      { href: "/dashboard/stats",   label: "Stats",   icon: <BarChart3 className="w-5 h-5" />,                   desc: "Progress & heatmap" },
      { href: "/dashboard/rewards", label: "Rewards", icon: <Award className="w-5 h-5" />,                    desc: "Badges" },
      { href: "/dashboard/qada",    label: "Qada",    icon: <Repeat className="w-5 h-5" />,                   desc: "Makeup prayer tracker" },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/dashboard/friends", label: "Friends", icon: <Users className="w-5 h-5" />,                     desc: "Leaderboard" },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/dashboard/quran",    label: "Qur'an",      svgId: "open-book", desc: "114 surahs" },
      { href: "/dashboard/duas",     label: "Dua Library", svgId: "prayer-hands", desc: "Supplications" },
      { href: "/dashboard/qibla",    label: "Qibla",       svgId: "compass", desc: "Direction" },
      { href: "/dashboard/tasbih",   label: "Tasbih",      svgId: "prayer-beads", desc: "Dhikr counter" },
      { href: "/dashboard/calendar", label: "Calendar",    svgId: "kaaba", desc: "Hijri calendar" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/settings", label: "Settings", icon: <Settings className="w-5 h-5" />, desc: "Preferences" },
    ],
  },
];

interface Props {
  userName?: string;
  userEmail?: string;
}

export default function DesktopSidebar({ userName, userEmail }: Props) {
  const pathname = usePathname();

  return (
    // hidden on mobile, sticky sidebar on desktop
    <aside
      className="hidden md:flex flex-col h-screen sticky top-0 border-r border-theme-border overflow-y-auto"
      style={{ background: "var(--color-bg-primary)" }}
    >
      {/* User header */}
      <div
        className="px-4 pt-8 pb-5 flex-shrink-0 border-b border-theme-border"
        style={{ background: "var(--color-bg-secondary)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
            style={{ background: "var(--btn-gradient)" }}
          >
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="min-w-0">
            <p className="font-body text-sm font-bold text-theme-text truncate">{userName || "Welcome"}</p>
            <p className="font-body text-xs text-theme-muted truncate">{userEmail || ""}</p>
          </div>
        </div>
        <p className="font-display text-lg font-bold text-theme-text mt-3">Salah Tracker</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-3 space-y-4">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            <p className="font-body text-[9px] font-bold tracking-[0.15em] text-theme-muted uppercase px-3 py-1">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all
                      ${active ? "bg-theme-surface shadow-sm" : "hover:bg-theme-surface/50"}`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                      style={{
                        background: active ? "var(--color-bg-secondary)" : "transparent",
                        border: active ? "1.5px solid var(--color-border)" : "1.5px solid transparent",
                        color: active ? "var(--color-accent)" : "var(--color-text-secondary)"
                      }}
                    >
                      {item.svgId
                        ? <IslamicIcon id={item.svgId} active={active} size={18} title={item.label} />
                        : item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-body text-sm font-bold ${active ? "text-theme-text" : "text-theme-muted"}`}>
                        {item.label}
                      </p>
                      <p className="font-body text-[10px] text-theme-muted/70 truncate">{item.desc}</p>
                    </div>
                    {active && <div className="w-1.5 h-1.5 rounded-full bg-theme-accent flex-shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-theme-border flex-shrink-0">
        <p className="font-body text-[10px] text-theme-muted text-center">Made with care</p>
      </div>
    </aside>
  );
}
