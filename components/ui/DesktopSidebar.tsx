"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_SECTIONS = [
  {
    label: "Prayer",
    items: [
      { href: "/dashboard/today",   label: "Today",   icon: "🕌", desc: "Daily prayers" },
      { href: "/dashboard/stats",   label: "Stats",   icon: "📊", desc: "Progress & heatmap" },
      { href: "/dashboard/rewards", label: "Rewards", icon: "✨", desc: "Badges" },
      { href: "/dashboard/qada",    label: "Qada",    icon: "🤲", desc: "Makeup prayer tracker" },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/dashboard/friends", label: "Friends", icon: "👯‍♀️", desc: "Leaderboard" },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/dashboard/quran",    label: "Qur'an",      icon: "📖", desc: "114 surahs" },
      { href: "/dashboard/duas",     label: "Dua Library", icon: "🤲", desc: "Supplications" },
      { href: "/dashboard/qibla",    label: "Qibla",       icon: "🧭", desc: "Direction" },
      { href: "/dashboard/tasbih",   label: "Tasbih",      icon: "📿", desc: "Dhikr counter" },
      { href: "/dashboard/calendar", label: "Calendar",    icon: "🌙", desc: "Hijri calendar" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/settings", label: "Settings", icon: "⚙️", desc: "Preferences" },
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
      className="hidden md:flex flex-col h-screen sticky top-0 border-r border-nude-200 overflow-y-auto"
      style={{ background: "#fdf6f3" }}
    >
      {/* User header */}
      <div
        className="px-4 pt-8 pb-5 flex-shrink-0 border-b border-nude-100"
        style={{ background: "linear-gradient(160deg,#f5e6df,#ecddd6)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#c8705a,#d4786a)" }}
          >
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="min-w-0">
            <p className="font-body text-sm font-bold text-nude-700 truncate">{userName || "Welcome"}</p>
            <p className="font-body text-xs text-nude-400 truncate">{userEmail || ""}</p>
          </div>
        </div>
        <p className="font-display text-lg font-bold text-nude-700 mt-3">Salah Tracker 🌸</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-3 space-y-4">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            <p className="font-body text-[9px] font-bold tracking-[0.15em] text-nude-300 uppercase px-3 py-1">
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
                      ${active ? "bg-nude-100 shadow-sm" : "hover:bg-nude-50"}`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                      style={{
                        background: active ? "linear-gradient(135deg,#f0d8ce,#e8c4b8)" : "white",
                        border: active ? "1.5px solid #e8c4b8" : "1.5px solid #f0e8e4",
                      }}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-body text-sm font-bold ${active ? "text-nude-700" : "text-nude-600"}`}>
                        {item.label}
                      </p>
                      <p className="font-body text-[10px] text-nude-300 truncate">{item.desc}</p>
                    </div>
                    {active && <div className="w-1.5 h-1.5 rounded-full bg-nude-400 flex-shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-nude-100 flex-shrink-0">
        <p className="font-body text-[10px] text-nude-300 text-center">Made with 🌸</p>
      </div>
    </aside>
  );
}
