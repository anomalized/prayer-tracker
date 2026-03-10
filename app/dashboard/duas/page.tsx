import Link from "next/link";
import { DUA_CATEGORIES, getDuasByCategory } from "@/lib/duas";

export default function DuasPage() {
  return (
    <div className="min-h-screen pb-28" style={{ background: "#fdf6f3" }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-6 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #f5e6df 0%, #f0d8ce 60%, #ecddd6 100%)" }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-40" style={{ background: "#e8c4b8" }} />
        <p className="font-body text-[10px] tracking-widest text-nude-400 uppercase mb-1 relative z-10">Daily Worship</p>
        <h1 className="font-display text-3xl font-bold text-nude-700 mb-1 relative z-10">Dua Library 🤲</h1>
        <p className="font-body text-sm text-nude-500 relative z-10">
          {DUA_CATEGORIES.reduce((sum, c) => sum + getDuasByCategory(c.id).length, 0)} duas across {DUA_CATEGORIES.length} categories
        </p>
      </div>

      {/* Category grid */}
      <div className="px-4 pt-5 pb-4">
        <div className="grid grid-cols-1 gap-3">
          {DUA_CATEGORIES.map((cat) => {
            const duas = getDuasByCategory(cat.id);
            return (
              <Link
                key={cat.id}
                href={`/dashboard/duas/category/${cat.id}`}
                className={`flex items-center gap-4 p-4 rounded-3xl border ${cat.color} ${cat.borderColor} active:scale-[0.98] transition-transform shadow-sm`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-body text-sm font-bold ${cat.textColor}`}>{cat.label}</p>
                  <p className="font-body text-xs text-slate-400 mt-0.5">{duas.length} dua{duas.length !== 1 ? "s" : ""}</p>
                </div>
                <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-nude-300 font-body pb-4 px-6">
        References from Quran, Bukhari, Muslim & other authentic sources
      </p>
    </div>
  );
}