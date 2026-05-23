"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Search } from "lucide-react";
import { SURAHS, searchSurahs } from "@/lib/quran";
import MenuButton from "@/components/ui/MenuButton";

const JUZ_STARTS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30];

export default function QuranClient() {
  const [query,      setQuery]      = useState("");
  const [filter,     setFilter]     = useState<"all" | "Meccan" | "Medinan">("all");
  const [lastRead,   setLastRead]   = useState<number | null>(null);

  useEffect(() => {
    const lr = localStorage.getItem("quran_last_read");
    if (lr) setLastRead(parseInt(lr));
  }, []);

  const results = useMemo(() => {
    const base = searchSurahs(query);
    return filter === "all" ? base : base.filter(s => s.type === filter);
  }, [query, filter]);

  const lastReadSurah = lastRead ? SURAHS.find(s => s.number === lastRead) : null;

  return (
    <div className="min-h-screen pb-10" style={{ background: "var(--color-bg-primary)" }}>

      {/* Header */}
      <div className="px-5 pt-12  md:pt-6 pb-5 relative overflow-hidden"
        style={{ background: "var(--card-gradient)" }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-30" style={{ background: "var(--nude-200)" }} />
        <MenuButton className="absolute top-12 md:top-6 right-5 z-10" dark={false} />
        <p className="font-body text-[10px] tracking-widest text-theme-muted uppercase mb-1 relative z-10">Holy Quran</p>
        <h1 className="font-display text-3xl font-bold text-theme-text relative z-10">القرآن الكريم</h1>
        <p className="font-body text-sm text-theme-muted mt-0.5 mb-4 relative z-10">114 Surahs · Al-Quran Al-Kareem</p>

        {/* Search */}
        <div className="relative z-10">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search surah name or number…"
              className="w-full bg-theme-surface/70 border border-theme-border rounded-2xl pl-10 pr-4 py-3 text-sm font-body text-theme-text placeholder-nude-300 focus:outline-none focus:border-nude-400 transition-colors"
            />
            {query && (
              <button onClick={() => setQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-theme-muted/70 hover:text-theme-muted">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Filter pills */}
        <div className="flex gap-2">
          {(["all", "Meccan", "Medinan"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                filter === f
                  ? "bg-theme-bg0 text-white shadow-sm"
                  : "bg-theme-surface border border-theme-border text-theme-muted hover:bg-theme-bg"
              }`}>
              {f === "all" ? "All 114" : f}
            </button>
          ))}
        </div>

        {/* Last read banner */}
        {lastReadSurah && !query && (
          <Link href={`/dashboard/quran/${lastReadSurah.number}`}
            className="flex items-center gap-3 bg-theme-surface border border-theme-border rounded-2xl px-4 py-3 shadow-sm active:scale-[0.98] transition-transform">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-theme-text flex-shrink-0"
              style={{ background: "var(--card-gradient)" }}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Continue Reading</p>
              <p className="text-sm font-bold text-theme-text truncate">
                {lastReadSurah.number}. {lastReadSurah.englishName} — {lastReadSurah.name}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-theme-muted/70 flex-shrink-0" />
          </Link>
        )}

        {/* Results count */}
        {query && (
          <p className="text-xs text-theme-muted font-body px-1">
            {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
          </p>
        )}

        {/* Surah list */}
        <div className="bg-theme-surface border border-theme-border rounded-3xl overflow-hidden shadow-sm divide-y divide-nude-50">
          {results.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-2 w-12 h-12 rounded-2xl bg-theme-surface text-theme-muted flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <p className="font-body text-sm font-bold text-theme-text">No surahs found</p>
              <p className="font-body text-xs text-theme-muted mt-1">Try a different name or number</p>
            </div>
          ) : results.map((surah) => (
            <Link key={surah.number} href={`/dashboard/quran/${surah.number}`}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-theme-bg/60 active:bg-theme-surface transition-colors">

              {/* Number badge */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 relative"
                style={{ background: "var(--card-gradient)", border: "1px solid var(--color-border)" }}>
                <span className="font-display text-xs font-bold text-theme-text">{surah.number}</span>
              </div>

              {/* Names */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-body text-sm font-bold text-theme-text truncate">{surah.englishName}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    surah.type === "Meccan"
                      ? "bg-amber-50 text-amber-600 border border-amber-100"
                      : "bg-teal-50 text-teal-600 border border-teal-100"
                  }`}>{surah.type}</span>
                </div>
                <p className="font-body text-xs text-theme-muted mt-0.5">{surah.englishMeaning} · {surah.ayahs} ayahs</p>
              </div>

              {/* Arabic name */}
              <div className="text-right flex-shrink-0">
                <p className="text-base text-theme-text font-medium"
                  style={{ fontFamily: "'Scheherazade New', 'Traditional Arabic', serif" }}>
                  {surah.name}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-theme-muted/70 font-body pb-4">
          Arabic text & translation via Al-Quran Cloud API
        </p>
      </div>
    </div>
  );
}