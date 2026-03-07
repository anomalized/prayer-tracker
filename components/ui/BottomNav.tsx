"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard/today",   label: "Today",   icon: "🕌" },
  { href: "/dashboard/stats",   label: "Stats",   icon: "📊" },
  { href: "/dashboard/friends", label: "Friends", icon: "👯‍♀️" },
  { href: "/dashboard/rewards", label: "Rewards", icon: "✨" },
  { href: "/dashboard/qibla",   label: "Qibla",   icon: "🧭" },
  { href: "/settings",          label: "Settings", icon: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-nude-200 px-1 py-2 z-50">
      <div className="flex justify-around">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-2xl transition-all ${
                active ? "bg-nude-100 text-nude-800" : "text-nude-400 hover:text-nude-600"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className={`text-xs font-bold tracking-wide ${active ? "text-nude-700" : "text-nude-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}