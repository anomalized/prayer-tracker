"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getDuaById, getCategoryById, DUAS } from "@/lib/duas";
import Link from "next/link";

export default function DuaDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const dua = getDuaById(params.id);

  const [showTranslit, setShowTranslit]   = useState(true);
  const [copied,       setCopied]         = useState(false);
  const [fontSize,     setFontSize]       = useState<"md" | "lg" | "xl">("lg");
  const [playing,      setPlaying]        = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  if (!dua) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg-primary)" }}>
        <div className="text-center">
          <p className="text-4xl mb-3">🤲</p>
          <p className="font-body font-bold text-theme-text">Dua not found</p>
          <Link href="/dashboard/duas" className="text-sm text-theme-muted underline mt-2 block">Back to Library</Link>
        </div>
      </div>
    );
  }

  const cat = getCategoryById(dua.category);

  // Find prev / next in same category
  const catDuas  = DUAS.filter(d => d.category === dua.category);
  const thisIdx  = catDuas.findIndex(d => d.id === dua.id);
  const prevDua  = catDuas[thisIdx - 1];
  const nextDua  = catDuas[thisIdx + 1];

  const arabicFontSize = {
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  }[fontSize];

  const handleCopy = () => {
    navigator.clipboard.writeText(`${dua.arabic}\n\n${dua.transliteration}\n\n${dua.translation}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (playing) {
      speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    const utt = new SpeechSynthesisUtterance(dua.arabic);
    utt.lang  = "ar-SA";
    utt.rate  = 0.75;
    utt.onend = () => setPlaying(false);
    utteranceRef.current = utt;
    speechSynthesis.speak(utt);
    setPlaying(true);
  };

  const arabicLines = dua.arabic.split("\n");
  const translitLines = dua.transliteration.split("\n");
  const translationLines = dua.translation.split("\n");

  return (
    <div className="min-h-screen pb-28 md:pb-0 flex flex-col" style={{ background: "var(--color-bg-primary)" }}>

      {/* Header */}
      <div className={`px-5 pt-12  md:pt-6 pb-5 relative overflow-hidden ${cat?.color ?? "bg-theme-bg"} border-b ${cat?.borderColor ?? "border-theme-border"}`}>
        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 font-body text-sm font-bold mb-4 opacity-60">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {cat?.label ?? "Duas"}
        </button>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-body text-[10px] tracking-widest uppercase text-slate-400 mb-1">
              {cat?.icon} {cat?.label}
            </p>
            <h1 className={`font-display text-xl font-bold ${cat?.textColor ?? "text-theme-text"}`}>{dua.title}</h1>
          </div>
          {/* Font size toggle */}
          <div className="flex gap-1 bg-theme-surface/60 rounded-2xl p-1 border border-white/80">
            {(["md", "lg", "xl"] as const).map(s => (
              <button key={s} onClick={() => setFontSize(s)}
                className={`w-7 h-7 rounded-xl text-xs font-bold transition-all
                  ${fontSize === s ? `${cat?.textColor ?? "text-theme-text"} bg-theme-surface shadow-sm` : "text-slate-400"}`}>
                {s === "md" ? "A" : s === "lg" ? "A" : "A"}
                <span className="sr-only">{s}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-5 space-y-4">

        {/* Arabic card */}
        <div className="bg-theme-surface border border-theme-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-body text-[10px] font-bold tracking-widest text-theme-muted uppercase">Arabic</p>
            <div className="flex gap-2">
              {/* Audio button */}
              <button onClick={handleSpeak}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all
                  ${playing
                    ? "bg-red-50 text-red-500 border border-red-100"
                    : "bg-theme-bg text-theme-text border border-theme-border hover:bg-theme-surface"}`}>
                {playing ? (
                  <><span className="text-sm">⏹</span> Stop</>
                ) : (
                  <><span className="text-sm">🔊</span> Listen</>
                )}
              </button>
              {/* Copy */}
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-theme-bg text-theme-text border border-theme-border hover:bg-theme-surface transition-all">
                {copied ? <><span>✓</span> Copied</> : <><span>📋</span> Copy</>}
              </button>
            </div>
          </div>

          {/* Arabic text — line by line for multi-line duas */}
          <div className="space-y-3" dir="rtl">
            {arabicLines.map((line, i) => (
              <p key={i}
                className={`text-right leading-loose text-slate-800 transition-all ${arabicFontSize}`}
                style={{ fontFamily: "'Scheherazade New', 'KFGQPC Uthmanic Script HAFS', 'Traditional Arabic', serif" }}>
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Transliteration — toggleable */}
        <div className="bg-theme-surface border border-theme-border rounded-3xl overflow-hidden shadow-sm">
          <button onClick={() => setShowTranslit(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4">
            <p className="font-body text-[10px] font-bold tracking-widest text-theme-muted uppercase">Transliteration</p>
            <svg className={`w-4 h-4 text-theme-muted/70 transition-transform ${showTranslit ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showTranslit && (
            <div className="px-5 pb-5 border-t border-nude-50 pt-3 space-y-1">
              {translitLines.map((line, i) => (
                <p key={i} className="font-body text-sm text-slate-500 italic leading-relaxed">{line}</p>
              ))}
            </div>
          )}
        </div>

        {/* Translation */}
        <div className="bg-theme-surface border border-theme-border rounded-3xl p-5 shadow-sm">
          <p className="font-body text-[10px] font-bold tracking-widest text-theme-muted uppercase mb-3">Translation</p>
          <div className="space-y-1.5">
            {translationLines.map((line, i) => (
              <p key={i} className="font-body text-sm text-slate-700 leading-relaxed">{line}</p>
            ))}
          </div>
        </div>

        {/* Context */}
        <div className={`${cat?.color ?? "bg-theme-bg"} border ${cat?.borderColor ?? "border-theme-border"} rounded-3xl p-5`}>
          <p className="font-body text-[10px] font-bold tracking-widest text-theme-muted uppercase mb-2">Context & Virtue</p>
          <p className="font-body text-sm text-slate-600 leading-relaxed">{dua.context}</p>
          {dua.source && (
            <p className={`font-body text-xs font-bold mt-3 ${cat?.textColor ?? "text-theme-muted"}`}>
              📚 {dua.source}
            </p>
          )}
        </div>

        {/* Prev / Next navigation */}
        {(prevDua || nextDua) && (
          <div className="flex gap-3">
            {prevDua ? (
              <Link href={`/dashboard/duas/${prevDua.id}`}
                className="flex-1 bg-theme-surface border border-theme-border rounded-2xl px-4 py-3 shadow-sm active:scale-95 transition-transform text-left">
                <p className="text-[10px] font-bold text-theme-muted/70 uppercase tracking-wider mb-0.5">← Previous</p>
                <p className="text-xs font-bold text-theme-text truncate">{prevDua.title}</p>
              </Link>
            ) : <div className="flex-1" />}
            {nextDua ? (
              <Link href={`/dashboard/duas/${nextDua.id}`}
                className="flex-1 bg-theme-surface border border-theme-border rounded-2xl px-4 py-3 shadow-sm active:scale-95 transition-transform text-right">
                <p className="text-[10px] font-bold text-theme-muted/70 uppercase tracking-wider mb-0.5">Next →</p>
                <p className="text-xs font-bold text-theme-text truncate">{nextDua.title}</p>
              </Link>
            ) : <div className="flex-1" />}
          </div>
        )}
      </div>
    </div>
  );
}