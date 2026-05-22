"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SURAHS } from "@/lib/quran";
import MenuButton from "@/components/ui/MenuButton";
import { useQuranProgress } from "@/hooks/useQuranProgress";

interface Ayah {
  number: number;
  numberInSurah: number;
  arabic: string;
  translation: string;
}

interface Props { surahNumber: number; }

const ARABIC_FONT = "'Scheherazade New', 'KFGQPC Uthmanic Script HAFS', 'Traditional Arabic', serif";

function toArabicNum(n: number): string {
  return n.toString().replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[+d]);
}

// ── Per-ayah AI explanation component ────────────────────────
function AyahExplanation({
  ayah, surahName, surahNumber, darkMode,
}: {
  ayah: Ayah; surahName: string; surahNumber: number; darkMode: boolean;
}) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [text,    setText]    = useState("");

  const explain = useCallback(async () => {
    // Toggle if already loaded
    if (text) { setOpen(o => !o); return; }
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch("/api/explain-ayah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arabic:      ayah.arabic,
          translation: ayah.translation,
          surahName,
          surahNumber,
          ayahNumber:  ayah.numberInSurah,
        }),
      });
      const rawText = await res.text();
      if (!res.ok) {
        setText(`Error ${res.status}: ${rawText.slice(0, 300)}`);
        return;
      }
      try {
        const data = JSON.parse(rawText);
        setText(data.error ? `API Error: ${data.error}` : (data.text ?? "No explanation available."));
      } catch {
        setText(`Parse error: ${rawText.slice(0, 200)}`);
      }
    } catch (e: any) {
      setText(`Network error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [text, loading, ayah, surahName, surahNumber]);

  const borderColor = darkMode ? "#5a3d1a" : "#f0d4c0";
  const bg          = darkMode ? "#2a1e10" : "#fffaf7";
  const textColor   = darkMode ? "#f0d8b0" : "#5a3520";
  const labelColor  = darkMode ? "#c4906060" : "#c4906090";

  return (
    <div>
      <button
        onClick={explain}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-60 ${
          open && text
            ? darkMode ? "bg-amber-700/60 text-amber-100" : "bg-nude-200 text-theme-text"
            : darkMode ? "bg-theme-surface/8 text-amber-400/80 border border-white/10 hover:bg-theme-surface/15"
                       : "bg-theme-bg text-theme-muted border border-theme-border hover:bg-theme-surface"
        }`}
      >
        {loading
          ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          : <span className="text-[11px]">✦</span>
        }
        {loading ? "Loading…" : open && text ? "Hide" : "AI Explain"}
      </button>

      {open && (
        <div className="mt-3 rounded-2xl px-4 py-3.5"
          style={{ background: bg, border: `1px solid ${borderColor}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: labelColor }}>
            ✦ AI Explanation
          </p>
          {loading ? (
            <div className="flex gap-1.5 items-center py-2">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: darkMode ? "#c4906060" : "#c49060a0", animationDelay: `${i*0.15}s` }} />
              ))}
            </div>
          ) : (
            <p className="text-sm font-body leading-relaxed" style={{ color: textColor }}>
              {text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main reader ───────────────────────────────────────────────
export default function SurahReader({ surahNumber }: Props) {
  const router = useRouter();
  const surah  = SURAHS.find(s => s.number === surahNumber);

  const [ayahs,       setAyahs]       = useState<Ayah[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [showTrans,   setShowTrans]   = useState(true);
  const [darkMode,    setDarkMode]    = useState(false);
  const [fontSize,    setFontSize]    = useState<"sm"|"md"|"lg"|"xl">("md");
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [audioLoading,setAudioLoading]= useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ayahRefsMap  = useRef<Map<number, HTMLDivElement>>(new Map());
  const observerRef  = useRef<IntersectionObserver | null>(null);
  const mostVisibleAyahRef = useRef<number>(1);

  const {
    bookmarks,
    lastAyah,
    syncing,
    toggleBookmark,
    recordScrolledTo,
  } = useQuranProgress({ surahNumber });

  const arabicSize = { sm: "text-xl", md: "text-2xl", lg: "text-3xl", xl: "text-4xl" }[fontSize];
  const lineHeight = { sm: "leading-loose", md: "leading-loose", lg: "leading-[2.2]", xl: "leading-[2.4]" }[fontSize];

  // ── Load ayahs ────────────────────────────────────────────────
  useEffect(() => {
    if (!surah) return;
    setLoading(true); setError("");
    Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`).then(r => r.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.sahih`).then(r => r.json()),
    ]).then(([arabicData, transData]) => {
      if (arabicData.code !== 200 || transData.code !== 200) {
        setError("Failed to load surah. Please check your connection."); return;
      }
      const combined: Ayah[] = (arabicData.data.ayahs as any[]).map((a, i) => {
        let arabic = a.text as string;
        // Strip Bismillah from ayah 1 — we show it separately in the header
        // Except Al-Fatihah (1) where it IS ayah 1, and At-Tawbah (9) which has none
        if (i === 0 && surahNumber !== 1 && surahNumber !== 9) {
          // Strip everything up to and including الرَّحِيمِ (end of Bismillah)
          // Using indexOf to find the end of Bismillah — avoids Unicode regex issues
          const marker = "الرَّحِيمِ";
          const idx = arabic.indexOf(marker);
          if (idx !== -1) arabic = arabic.slice(idx + marker.length).trim();
        }
        return {
          number:        a.number,
          numberInSurah: a.numberInSurah,
          arabic,
          // Normalize ALL-CAPS translations (en.asad style) to sentence case
          translation: ((transData.data.ayahs as any[])[i]?.text ?? "").replace(
            /^[A-Z][A-Z\s,\-–—]+/,
            (m: string) => m.charAt(0) + m.slice(1).toLowerCase()
          ),
        };
      });
      setAyahs(combined);
      localStorage.setItem("quran_last_read", String(surahNumber));
    }).catch(() => setError("Network error. Please try again."))
      .finally(() => setLoading(false));
  }, [surahNumber, surah]);

  useEffect(() => {
    if (loading || ayahs.length === 0 || syncing) return;
    if (!lastAyah || lastAyah <= 1) return;

    const t = setTimeout(() => {
      const el = ayahRefsMap.current.get(lastAyah);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);

    return () => clearTimeout(t);
  // Only run when ayahs first load — not on every lastAyah change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, syncing, ayahs.length > 0]);

  useEffect(() => {
    if (ayahs.length === 0) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        let best: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!best || entry.intersectionRatio > best.intersectionRatio) {
              best = entry;
            }
          }
        }
        if (best) {
          const ayahNum = parseInt(
            (best.target as HTMLElement).dataset.ayah ?? "1", 10
          );
          if (ayahNum !== mostVisibleAyahRef.current) {
            mostVisibleAyahRef.current = ayahNum;
            recordScrolledTo(ayahNum);
          }
        }
      },
      { threshold: [0.3, 0.5, 0.8], rootMargin: "0px 0px -20% 0px" }
    );

    ayahRefsMap.current.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, [ayahs, recordScrolledTo]);

  // ── Audio ─────────────────────────────────────────────────────
  const playAyah = useCallback(async (n: number) => {
    if (playingAyah === n) { audioRef.current?.pause(); setPlayingAyah(null); return; }
    setAudioLoading(true); setPlayingAyah(n);
    try {
      const globalNum = SURAHS.slice(0, surahNumber - 1).reduce((s, x) => s + x.ayahs, 0) + n;
      const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalNum}.mp3`;
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended  = () => setPlayingAyah(null);
      audio.onerror  = () => { setPlayingAyah(null); setAudioLoading(false); };
      audio.oncanplay = () => setAudioLoading(false);
      await audio.play();
    } catch { setPlayingAyah(null); setAudioLoading(false); }
  }, [surahNumber, playingAyah]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const prev = SURAHS.find(s => s.number === surahNumber - 1);
  const next = SURAHS.find(s => s.number === surahNumber + 1);

  if (!surah) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg-primary)" }}>
      <div className="text-center p-8">
        <p className="text-4xl mb-3">📖</p>
        <p className="font-body font-bold text-theme-text">Surah not found</p>
        <button onClick={() => router.back()} className="text-sm text-theme-muted underline mt-2 block mx-auto">Go back</button>
      </div>
    </div>
  );

  const bg          = darkMode ? "#1a1208" : "var(--color-bg-primary)";
  const card        = darkMode ? "#2a1e10" : "#ffffff";
  const borderColor = darkMode ? "#3d2b1f" : "#f0e0d8";

  return (
    <div className="min-h-screen pb-16 transition-colors duration-300" style={{ background: bg }}>

      {/* ── Sticky Header ─────────────────────────────────── */}
      <div className="sticky top-0 z-30 px-4 pt-10 pb-3 transition-colors duration-300"
        style={{ background: darkMode
          ? "linear-gradient(160deg,#2a1e10,#1a1208)"
          : "linear-gradient(160deg,#f5e6df,#ecddd6)" }}>

        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()}
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
              darkMode ? "bg-theme-surface/10 text-amber-200" : "bg-theme-surface/60 text-theme-text border border-theme-border"
            }`}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <p className={`font-body text-[10px] font-bold tracking-widest uppercase ${darkMode ? "text-amber-400/70" : "text-theme-muted"}`}>
              Surah {surahNumber} · {surah.type}
            </p>
            <p className={`font-display text-base font-bold truncate ${darkMode ? "text-amber-100" : "text-theme-text"}`}>
              {surah.englishName}
            </p>
          </div>

          {syncing && (
            <div className={`w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0
              ${darkMode ? "border-amber-700/30 border-t-amber-400" : "border-theme-border border-t-nude-400"}`}
              title="Syncing bookmarks…"
            />
          )}

          <div className="hidden md:flex items-center gap-2 ml-auto">
            <div className={`flex rounded-xl overflow-hidden border ${darkMode ? "border-white/10" : "border-theme-border"}`}>
              {(["sm","md","lg","xl"] as const).map((s, i) => (
                <button key={s} onClick={() => setFontSize(s)}
                  className={`px-2.5 py-1.5 font-bold transition-colors ${
                    fontSize === s
                      ? darkMode ? "bg-amber-700 text-white" : "bg-nude-200 text-theme-text"
                      : darkMode ? "bg-transparent text-amber-400/60" : "bg-theme-surface text-theme-muted"
                  }`}
                  style={{ fontSize: [10,12,14,16][i] }}>
                  A
                </button>
              ))}
            </div>

            <button onClick={() => setShowTrans(v => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                showTrans
                  ? darkMode ? "bg-amber-700 text-white border-amber-600" : "bg-nude-200 text-theme-text border-theme-border"
                  : darkMode ? "bg-transparent text-amber-400/60 border-white/10" : "bg-theme-surface text-theme-muted border-theme-border"
              }`}>
              Translation
            </button>

            <button onClick={() => setDarkMode(v => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex-shrink-0 ${
                darkMode ? "bg-amber-700 text-white border-amber-600" : "bg-theme-surface text-theme-muted border-theme-border"
              }`}>
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>

          <p className={`text-xl font-medium flex-shrink-0 ${darkMode ? "text-amber-200" : "text-theme-text"}`}
            style={{ fontFamily: ARABIC_FONT }}>
            {surah.name}
          </p>

          <MenuButton dark={darkMode} />
        </div>

        <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-1 mt-2">
          <div className={`flex rounded-xl overflow-hidden border ${darkMode ? "border-white/10" : "border-theme-border"}`}>
            {(["sm","md","lg","xl"] as const).map((s, i) => (
              <button key={s} onClick={() => setFontSize(s)}
                className={`px-2.5 py-1.5 font-bold transition-colors ${
                  fontSize === s
                    ? darkMode ? "bg-amber-700 text-white" : "bg-nude-200 text-theme-text"
                    : darkMode ? "bg-transparent text-amber-400/60" : "bg-theme-surface text-theme-muted"
                }`}
                style={{ fontSize: [10,12,14,16][i] }}>
                A
              </button>
            ))}
          </div>

          <button onClick={() => setShowTrans(v => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              showTrans
                ? darkMode ? "bg-amber-700 text-white border-amber-600" : "bg-nude-200 text-theme-text border-theme-border"
                : darkMode ? "bg-transparent text-amber-400/60 border-white/10" : "bg-theme-surface text-theme-muted border-theme-border"
            }`}>
            Translation
          </button>

          <button onClick={() => setDarkMode(v => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex-shrink-0 ${
              darkMode ? "bg-amber-700 text-white border-amber-600" : "bg-theme-surface text-theme-muted border-theme-border"
            }`}>
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* ── Loading ───────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className={`w-10 h-10 border-4 rounded-full animate-spin ${
            darkMode ? "border-amber-700/30 border-t-amber-400" : "border-theme-border border-t-nude-500"
          }`} />
          <p className={`text-sm font-body ${darkMode ? "text-amber-300/60" : "text-theme-muted"}`}>
            Loading {surah.englishName}…
          </p>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────── */}
      {error && (
        <div className="mx-4 mt-6 p-5 rounded-3xl text-center"
          style={{ background: card, border: `1px solid ${borderColor}` }}>
          <p className="text-3xl mb-2">⚠️</p>
          <p className={`text-sm font-bold font-body mb-3 ${darkMode ? "text-amber-200" : "text-theme-text"}`}>{error}</p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(to right,#c8705a,#d4786a)" }}>
            Try Again
          </button>
        </div>
      )}

      {/* ── Surah header card ─────────────────────────────── */}
      {!loading && !error && ayahs.length > 0 && (
        <div className="mx-4 mt-4 mb-2 rounded-3xl p-6 text-center"
          style={{ background: darkMode
            ? "linear-gradient(135deg,#2a1e10,#1e1508)"
            : "linear-gradient(135deg,#fdf0ea,#f5e2d8)",
            border: `1px solid ${borderColor}` }}>
          <p className="text-4xl mb-2 font-medium"
            style={{ fontFamily: ARABIC_FONT, color: darkMode ? "#f5e6df" : "#5a3520" }}>
            {surah.name}
          </p>
          <p className={`font-display text-lg font-bold ${darkMode ? "text-amber-200" : "text-theme-text"}`}>
            {surah.englishName}
          </p>
          <p className={`font-body text-xs mt-1 ${darkMode ? "text-amber-400/60" : "text-theme-muted"}`}>
            {surah.englishMeaning} · {surah.ayahs} Ayahs · {surah.type}
          </p>
          {surahNumber !== 9 && (
            <div className={`mt-4 pt-4 border-t ${darkMode ? "border-white/10" : "border-theme-border"}`}>
              <p className={`text-2xl leading-loose ${darkMode ? "text-amber-100" : "text-theme-text"}`}
                style={{ fontFamily: ARABIC_FONT }}>
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
              <p className={`text-xs font-body mt-1 ${darkMode ? "text-amber-400/50" : "text-theme-muted"}`}>
                In the name of Allah, the Most Gracious, the Most Merciful
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Ayahs ─────────────────────────────────────────── */}
      {!loading && !error && (
        <div className="px-4 pb-8 mt-2 space-y-2">
          {ayahs.map((ayah) => {
            const isBookmarked = bookmarks.includes(ayah.numberInSurah);
            const isPlaying    = playingAyah === ayah.numberInSurah;

            return (
              <div
                key={ayah.numberInSurah}
                data-ayah={ayah.numberInSurah}
                ref={(el) => {
                  if (el) ayahRefsMap.current.set(ayah.numberInSurah, el);
                  else    ayahRefsMap.current.delete(ayah.numberInSurah);
                }}
                className="rounded-3xl px-5 py-5 transition-colors duration-200"
                style={{
                  background: isBookmarked
                    ? darkMode ? "#3a2a14" : "#fffaf6"
                    : card,
                  border: `1px solid ${isBookmarked
                    ? darkMode ? "#5a3d1a" : "#f0c8a8"
                    : borderColor}`,
                }}>

                {/* Row: ayah number + actions */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{
                      background: darkMode ? "#3d2b1f" : "#f5e6df",
                      color: darkMode ? "#c4a882" : "#9a7060",
                      border: `1px solid ${darkMode ? "#5a3d1a" : "#e8c4b8"}`,
                    }}>
                    {ayah.numberInSurah}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Play */}
                    <button onClick={() => playAyah(ayah.numberInSurah)}
                      title="Play recitation"
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs transition-all ${
                        isPlaying
                          ? "bg-amber-500 text-white"
                          : darkMode ? "bg-theme-surface/8 text-amber-400/70 border border-white/10 hover:bg-theme-surface/15"
                                     : "bg-theme-bg text-theme-muted border border-theme-border hover:bg-theme-surface"
                      }`}>
                      {audioLoading && isPlaying
                        ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : isPlaying
                          ? <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="1" y="1" width="3" height="8" rx="1"/><rect x="6" y="1" width="3" height="8" rx="1"/></svg>
                          : <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M2 1.5l7 3.5-7 3.5V1.5z"/></svg>
                      }
                    </button>

                    {/* Bookmark */}
                    <button onClick={() => toggleBookmark(ayah.numberInSurah)}
                      title={isBookmarked ? "Remove bookmark" : "Bookmark ayah"}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                        isBookmarked
                          ? "bg-amber-500 text-white"
                          : darkMode ? "bg-theme-surface/8 text-amber-400/70 border border-white/10 hover:bg-theme-surface/15"
                                     : "bg-theme-bg text-theme-muted border border-theme-border hover:bg-theme-surface"
                      }`}>
                      <svg width="12" height="14" viewBox="0 0 12 14" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 1h10v12l-5-3-5 3V1z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Arabic */}
                <p className={`text-right mb-5 ${arabicSize} ${lineHeight}`}
                  dir="rtl"
                  style={{ fontFamily: ARABIC_FONT, color: darkMode ? "#f0e0c8" : "#2a1a0e" }}>
                  {ayah.arabic}{" "}
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs align-middle"
                    style={{
                      background: darkMode ? "#3d2b1f" : "#f5e6df",
                      color: darkMode ? "#c4a882" : "#a07060",
                      fontFamily: ARABIC_FONT,
                    }}>
                    {toArabicNum(ayah.numberInSurah)}
                  </span>
                </p>

                {/* Translation */}
                {showTrans && (
                  <p className={`text-sm font-body leading-relaxed mb-4 pb-4 border-b ${
                    darkMode ? "text-amber-100/70 border-white/8" : "text-theme-muted border-theme-border"
                  }`}>
                    <span className={`font-bold mr-1 text-xs ${darkMode ? "text-amber-500/50" : "text-theme-muted/70"}`}>
                      {ayah.numberInSurah}.
                    </span>
                    {ayah.translation}
                  </p>
                )}

                {/* AI explanation */}
                <AyahExplanation
                  ayah={ayah}
                  surahName={surah.englishName}
                  surahNumber={surahNumber}
                  darkMode={darkMode}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Prev / Next ────────────────────────────────────── */}
      {!loading && !error && (
        <div className="px-4 pb-10 flex gap-3">
          {prev ? (
            <button onClick={() => router.push(`/dashboard/quran/${prev.number}`)}
              className="flex-1 rounded-2xl px-4 py-3 text-left transition-all active:scale-[0.97]"
              style={{ background: card, border: `1px solid ${borderColor}` }}>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${darkMode ? "text-amber-400/50" : "text-theme-muted/70"}`}>← Previous</p>
              <p className={`text-xs font-bold truncate ${darkMode ? "text-amber-200" : "text-theme-text"}`}>
                {prev.number}. {prev.englishName}
              </p>
            </button>
          ) : <div className="flex-1" />}

          {next ? (
            <button onClick={() => router.push(`/dashboard/quran/${next.number}`)}
              className="flex-1 rounded-2xl px-4 py-3 text-right transition-all active:scale-[0.97]"
              style={{ background: card, border: `1px solid ${borderColor}` }}>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${darkMode ? "text-amber-400/50" : "text-theme-muted/70"}`}>Next →</p>
              <p className={`text-xs font-bold truncate ${darkMode ? "text-amber-200" : "text-theme-text"}`}>
                {next.number}. {next.englishName}
              </p>
            </button>
          ) : <div className="flex-1" />}
        </div>
      )}
    </div>
  );
}