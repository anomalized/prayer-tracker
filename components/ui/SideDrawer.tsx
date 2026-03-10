"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_SECTIONS = [
  {
    label: "Prayer",
    items: [
      { href: "/dashboard/today",   label: "Today",   icon: "🕌", desc: "Daily prayers & tracking" },
      { href: "/dashboard/stats",   label: "Stats",   icon: "📊", desc: "Progress & heatmap" },
      { href: "/dashboard/rewards", label: "Rewards", icon: "✨", desc: "Badges & achievements" },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/dashboard/friends", label: "Friends", icon: "👯‍♀️", desc: "Leaderboard & nudges" },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/dashboard/quran", label: "Qur'an",      icon: "📖", desc: "Read all 114 surahs" },
      { href: "/dashboard/duas",  label: "Dua Library", icon: "🤲", desc: "Daily supplications" },
      { href: "/dashboard/qibla", label: "Qibla",       icon: "🧭", desc: "Find direction to Mecca" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/settings", label: "Settings", icon: "⚙️", desc: "Profile & preferences" },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
}

export default function SideDrawer({ open, onClose, userName, userEmail }: Props) {
  const pathname  = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* ── Overlay ─────────────────────────────────────────── */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          background: "rgba(30,15,10,0.45)",
          backdropFilter: open ? "blur(3px)" : "none",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      {/* ── Drawer ──────────────────────────────────────────── */}
      <div
        ref={drawerRef}
        className="fixed top-0 left-0 h-full z-50 flex flex-col"
        style={{
          width: "min(320px, 85vw)",
          background: "#fdf6f3",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: open ? "8px 0 40px rgba(180,100,80,0.15)" : "none",
        }}
      >
        {/* Header */}
        <div
          className="px-5 pt-12 pb-5 relative overflow-hidden flex-shrink-0"
          style={{ background: "linear-gradient(160deg, #f5e6df 0%, #ecddd6 100%)" }}
        >
          {/* Decorative circle */}
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-30"
            style={{ background: "#e8c4b8" }} />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-12 right-4 w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center text-nude-500 hover:bg-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* User info */}
          <div className="flex items-center gap-3 relative z-10">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm"
              style={{ background: "linear-gradient(135deg, #c8705a, #d4786a)" }}
            >
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0">
              <p className="font-body text-sm font-bold text-nude-700 truncate">
                {userName || "Welcome"}
              </p>
              <p className="font-body text-xs text-nude-400 truncate">
                {userEmail || ""}
              </p>
            </div>
          </div>

          {/* App title */}
          <div className="mt-4 relative z-10">
            <p className="font-body text-[10px] tracking-widest text-nude-400 uppercase">Navigation</p>
            <p className="font-display text-xl font-bold text-nude-700">Salah Tracker</p>
          </div>
        </div>

        {/* Nav sections */}
        <div className="flex-1 overflow-y-auto py-3 px-3">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} className="mb-4">
              <p className="font-body text-[9px] font-bold tracking-[0.15em] text-nude-300 uppercase px-3 py-1.5">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-150 active:scale-[0.97]
                        ${active
                          ? "bg-nude-100 shadow-sm"
                          : "hover:bg-nude-50"
                        }`}
                    >
                      {/* Icon bubble */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm transition-all
                          ${active ? "scale-105" : ""}`}
                        style={{
                          background: active
                            ? "linear-gradient(135deg, #f0d8ce, #e8c4b8)"
                            : "white",
                          border: active ? "1.5px solid #e8c4b8" : "1.5px solid #f0e8e4",
                        }}
                      >
                        {item.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`font-body text-sm font-bold leading-tight
                          ${active ? "text-nude-700" : "text-nude-600"}`}>
                          {item.label}
                        </p>
                        <p className="font-body text-[10px] text-nude-300 truncate mt-0.5">
                          {item.desc}
                        </p>
                      </div>

                      {/* Active indicator */}
                      {active && (
                        <div className="w-1.5 h-1.5 rounded-full bg-nude-400 flex-shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-nude-100 flex-shrink-0">
          <p className="font-body text-[10px] text-nude-300 text-center">
            Made with 🌸 for your spiritual journey
          </p>
        </div>
      </div>
    </>
  );
}