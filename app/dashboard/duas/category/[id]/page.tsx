import Link from "next/link";
import { notFound } from "next/navigation";
import { DUA_CATEGORIES, getDuasByCategory, getCategoryById } from "@/lib/duas";

export function generateStaticParams() {
  return DUA_CATEGORIES.map((c) => ({ id: c.id }));
}

export default function DuaCategoryPage({ params }: { params: { id: string } }) {
  const cat  = getCategoryById(params.id);
  const duas = getDuasByCategory(params.id);
  if (!cat) notFound();

  return (
    <div className="min-h-screen pb-28" style={{ background: "#fdf6f3" }}>

      {/* Header */}
      <div className={`px-5 pt-12 pb-6 relative overflow-hidden ${cat.color} border-b ${cat.borderColor}`}>
        <Link href="/dashboard/duas"
          className="flex items-center gap-1.5 font-body text-sm font-bold mb-4 relative z-10"
          style={{ color: "inherit", opacity: 0.6 }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All Categories
        </Link>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/60 flex items-center justify-center text-3xl shadow-sm">
            {cat.icon}
          </div>
          <div>
            <h1 className={`font-display text-2xl font-bold ${cat.textColor}`}>{cat.label}</h1>
            <p className="font-body text-xs text-slate-400 mt-0.5">{duas.length} duas</p>
          </div>
        </div>
      </div>

      {/* Duas list */}
      <div className="px-4 py-4 space-y-3">
        {duas.map((dua, i) => (
          <Link
            key={dua.id}
            href={`/dashboard/duas/${dua.id}`}
            className="block bg-white border border-nude-100 rounded-3xl p-5 shadow-sm active:scale-[0.98] transition-transform"
          >
            {/* Number + title */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}
                  style={{ background: "linear-gradient(135deg,#c8705a,#d4786a)" }}>
                  {i + 1}
                </span>
                <p className="font-body text-sm font-bold text-nude-700">{dua.title}</p>
              </div>
              <svg className="w-4 h-4 text-nude-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Arabic preview — first line only */}
            <p className="font-arabic text-right text-lg leading-relaxed text-slate-700 mb-3 line-clamp-2"
              style={{ fontFamily: "'Scheherazade New', 'KFGQPC Uthmanic Script HAFS', serif", direction: "rtl" }}>
              {dua.arabic.split("\n")[0]}
            </p>

            {/* Translation preview */}
            <p className="font-body text-xs text-slate-400 line-clamp-2">{dua.translation}</p>

            {dua.source && (
              <p className="font-body text-[10px] text-nude-300 mt-2">{dua.source}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}