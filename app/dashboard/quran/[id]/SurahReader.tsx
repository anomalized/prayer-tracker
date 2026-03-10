"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SURAHS } from "@/lib/quran";
import MenuButton from "@/components/ui/MenuButton";

interface Ayah {
  number: number;       // global ayah number
  numberInSurah: number;
  arabic: string;
  translation: string;
  transliteration?: string;
}

interface Props { surahNumber: number; }

const ARABIC_FONT = "'Scheherazade New', 'KFGQPC Uthmanic Script HAFS', 'Traditional Arabic', serif";

// ── Arabic numeral converter ──────────────────────────────────
function toArabicNum(n: number): string {
  return n.toString().replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[+d]);
}

export default function SurahReader({ surahNumber }: Props) {
  const router = useRouter();
  const surah  = SURAHS.find(s => s.number === surahNumber);

  const [ayahs,       setAyahs]       = useState<Ayah[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [showTranslit,setShowTranslit]= useState(false);
  const [showTrans,   setShowTrans]   = useState(true);
  const [darkMode,    setDarkMode]    = useState(false);
  const [fontSize,    setFontSize]    = useState<"sm"|"md"|"lg"|"xl">("md");
  const [bookmarks,   setBookmarks]   = useState<number[]>([]);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [audioLoading,setAudioLoading]= useState(false);
  const audioRef  = useRef<HTMLAudioElement | null>(null);
  const ayahRefs  = useRef<Record<number, HTMLDivElement | null>>({});

  const arabicSize = { sm: "text-xl", md: "text-2xl", lg: "text-3xl", xl: "text-4xl" }[fontSize];
  const lineHeight = { sm: "leading-loose", md: "leading-loose", lg: "leading-[2.2]", xl: "leading-[2.4]" }[fontSize];

  // ── Load ayahs from API ───────────────────────────────────────
  useEffect(() => {
    if (!surah) return;
    setLoading(true); setError("");

    // Fetch Arabic + English translation in parallel
    Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`).then(r => r.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.asad`).then(r => r.json()),
    ]).then(([arabicData, transData]) => {
      if (arabicData.code !== 200 || transData.code !== 200) {
        setError("Failed to load surah. Please check your connection."); return;
      }
      const arabicAyahs = arabicData.data.ayahs as any[];
      const transAyahs  = transData.data.ayahs  as any[];
      const combined: Ayah[] = arabicAyahs.map((a, i) => ({
        number:        a.number,
        numberInSurah: a.numberInSurah,
        arabic:        a.text,
        translation:   transAyahs[i]?.text ?? "",
      }));
      setAyahs(combined);

      // Save last read
      localStorage.setItem("quran_last_read", String(surahNumber));

      // Restore scroll to last position
      const saved = localStorage.getItem(`quran_pos_${surahNumber}`);
      if (saved) setTimeout(() => window.scrollTo(0, parseInt(saved)), 100);
    }).catch(() => setError("Network error. Please try again."))
      .finally(() => setLoading(false));
  }, [surahNumber, surah]);

  // ── Save scroll position ──────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      localStorage.setItem(`quran_pos_${surahNumber}`, String(window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [surahNumber]);

  // ── Bookmarks ─────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(`quran_bookmarks_${surahNumber}`);
    if (saved) setBookmarks(JSON.parse(saved));
  }, [surahNumber]);

  const toggleBookmark = useCallback((ayahNum: number) => {
    setBookmarks(prev => {
      const next = prev.includes(ayahNum)
        ? prev.filter(n => n !== ayahNum)
        : [...prev, ayahNum];
      localStorage.setItem(`quran_bookmarks_${surahNumber}`, JSON.stringify(next));
      return next;
    });
  }, [surahNumber]);

  // ── Audio playback ────────────────────────────────────────────
  const playAyah = useCallback(async (ayahNumber: number) => {
    if (playingAyah === ayahNumber) {
      audioRef.current?.pause();
      setPlayingAyah(null); return;
    }
    setAudioLoading(true); setPlayingAyah(ayahNumber);
    try {
      const paddedSurah = String(surahNumber).padStart(3, "0");
      const paddedAyah  = String(ayahNumber).padStart(3, "0");
      // Mishary Rashid Al-Afasy recitation
      const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${
        SURAHS.slice(0, surahNumber - 1).reduce((sum, s) => sum + s.ayahs, 0) + ayahNumber
      }.mp3`;
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlayingAyah(null);
      audio.onerror = () => { setPlayingAyah(null); setAudioLoading(false); };
      audio.oncanplay = () => setAudioLoading(false);
      await audio.play();
    } catch { setPlayingAyah(null); setAudioLoading(false); }
  }, [surahNumber, playingAyah]);

  // Stop audio on unmount
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const prev = SURAHS.find(s => s.number === surahNumber - 1);
  const next = SURAHS.find(s => s.number === surahNumber + 1);

  if (!surah) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#fdf6f3" }}>
      <div className="text-center p-8">
        <p className="text-4xl mb-3">📖</p>
        <p className="font-body font-bold text-nude-600">Surah not found</p>
        <button onClick={() => router.back()} className="text-sm text-nude-400 underline mt-2 block mx-auto">Go back</button>
      </div>
    </div>
  );

  const bg   = darkMode ? "#1a1208" : "#fdf6f3";
  const card = darkMode ? "#2a1e10" : "#ffffff";
  const textPrimary   = darkMode ? "#f5e6df" : "#3d2b1f";
  const textSecondary = darkMode ? "#c4a882" : "#9a7060";
  const borderColor   = darkMode ? "#3d2b1f" : "#f0e0d8";

  return (
    <div className="min-h-screen pb-16 transition-colors duration-300" style={{ background: bg }}>

      {/* ── Sticky Header ────────────────────────────────────── */}
      <div className="sticky top-0 z-30 px-4 pt-10 pb-3 transition-colors duration-300"
        style={{ background: darkMode
          ? "linear-gradient(160deg,#2a1e10,#1a1208)"
          : "linear-gradient(160deg,#f5e6df,#ecddd6)" }}>

        <div className="flex items-center gap-3 mb-3">
          {/* Back */}
          <button onClick={() => router.back()}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
              darkMode ? "bg-white/10 text-amber-200 hover:bg-white/20" : "bg-white/60 text-nude-600 border border-nude-200 hover:bg-white"
            }`}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <p className={`font-body text-[10px] font-bold tracking-widest uppercase ${darkMode ? "text-amber-400/70" : "text-nude-400"}`}>
              Surah {surahNumber} · {surah.type}
            </p>
            <p className={`font-display text-base font-bold truncate ${darkMode ? "text-amber-100" : "text-nude-700"}`}>
              {surah.englishName}
            </p>
          </div>

          {/* Arabic name */}
          <p className={`text-xl font-medium flex-shrink-0 ${darkMode ? "text-amber-200" : "text-nude-600"}`}
            style={{ fontFamily: ARABIC_FONT }}>
            {surah.name}
          </p>

          <MenuButton dark={darkMode} />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {/* Font size */}
          <div className={`flex rounded-xl overflow-hidden border ${darkMode ? "border-white/10" : "border-nude-200"}`}>
            {(["sm","md","lg","xl"] as const).map(s => (
              <button key={s} onClick={() => setFontSize(s)}
                className={`px-2.5 py-1.5 text-xs font-bold transition-colors ${
                  fontSize === s
                    ? darkMode ? "bg-amber-700 text-white" : "bg-nude-200 text-nude-700"
                    : darkMode ? "bg-transparent text-amber-400/60 hover:bg-white/5" : "bg-white text-nude-400 hover:bg-nude-50"
                }`}>
                {s === "sm" ? "A" : s === "md" ? "A" : s === "lg" ? "A" : "A"}
              </button>
            ))}
          </div>

          {/* Translation toggle */}
          <button onClick={() => setShowTrans(v => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              showTrans
                ? darkMode ? "bg-amber-700 text-white border-amber-600" : "bg-nude-200 text-nude-700 border-nude-300"
                : darkMode ? "bg-transparent text-amber-400/60 border-white/10" : "bg-white text-nude-400 border-nude-200"
            }`}>EN</button>

          {/* Transliteration toggle */}
          <button onClick={() => setShowTranslit(v => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              showTranslit
                ? darkMode ? "bg-amber-700 text-white border-amber-600" : "bg-nude-200 text-nude-700 border-nude-300"
                : darkMode ? "bg-transparent text-amber-400/60 border-white/10" : "bg-white text-nude-400 border-nude-200"
            }`}>Roman</button>

          {/* Dark mode */}
          <button onClick={() => setDarkMode(v => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ml-auto flex-shrink-0 ${
              darkMode ? "bg-amber-700 text-white border-amber-600" : "bg-white text-nude-400 border-nude-200 hover:bg-nude-50"
            }`}>
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* ── Loading ───────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className={`w-10 h-10 border-4 rounded-full animate-spin ${
            darkMode ? "border-amber-700/30 border-t-amber-400" : "border-nude-200 border-t-nude-500"
          }`} />
          <p className={`text-sm font-body ${darkMode ? "text-amber-300/60" : "text-nude-400"}`}>
            Loading {surah.englishName}…
          </p>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div className="mx-4 mt-6 p-5 rounded-3xl text-center" style={{ background: card, border: `1px solid ${borderColor}` }}>
          <p className="text-3xl mb-2">⚠️</p>
          <p className={`text-sm font-bold font-body mb-3 ${darkMode ? "text-amber-200" : "text-nude-700"}`}>{error}</p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(to right,#c8705a,#d4786a)" }}>
            Try Again
          </button>
        </div>
      )}

      {/* ── Surah header card ─────────────────────────────────── */}
      {!loading && !error && ayahs.length > 0 && (
        <div className="mx-4 mt-4 mb-2 rounded-3xl p-6 text-center transition-colors"
          style={{ background: darkMode
            ? "linear-gradient(135deg,#2a1e10,#1e1508)"
            : "linear-gradient(135deg,#fdf0ea,#f5e2d8)",
            border: `1px solid ${borderColor}` }}>
          <p className={`text-4xl mb-2 font-medium`}
            style={{ fontFamily: ARABIC_FONT, color: darkMode ? "#f5e6df" : "#5a3520" }}>
            {surah.name}
          </p>
          <p className={`font-display text-lg font-bold ${darkMode ? "text-amber-200" : "text-nude-700"}`}>
            {surah.englishName}
          </p>
          <p className={`font-body text-xs mt-1 ${darkMode ? "text-amber-400/60" : "text-nude-400"}`}>
            {surah.englishMeaning} · {surah.ayahs} Ayahs · {surah.type}
          </p>

          {/* Bismillah — all surahs except At-Tawbah (9) */}
          {surahNumber !== 9 && (
            <div className={`mt-4 pt-4 border-t ${darkMode ? "border-white/10" : "border-nude-200"}`}>
              <p className={`text-2xl leading-loose ${darkMode ? "text-amber-100" : "text-nude-700"}`}
                style={{ fontFamily: ARABIC_FONT }}>
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
              <p className={`text-xs font-body mt-1 ${darkMode ? "text-amber-400/50" : "text-nude-400"}`}>
                In the name of Allah, the Most Gracious, the Most Merciful
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Ayahs ─────────────────────────────────────────────── */}
      {!loading && !error && (
        <div className="px-4 space-y-1 pb-8">
          {ayahs.map((ayah) => {
            const isBookmarked = bookmarks.includes(ayah.numberInSurah);
            const isPlaying    = playingAyah === ayah.numberInSurah;

            return (
              <div
                key={ayah.numberInSurah}
                ref={el => { ayahRefs.current[ayah.numberInSurah] = el; }}
                className="rounded-3xl px-5 py-5 transition-all duration-200"
                style={{
                  background: isBookmarked
                    ? darkMode ? "#3a2a14" : "#fef8f5"
                    : card,
                  border: `1px solid ${isBookmarked
                    ? darkMode ? "#5a3d1a" : "#f0c8a8"
                    : borderColor}`,
                  marginBottom: "8px",
                }}
              >
                {/* Ayah header */}
                <div className="flex items-center justify-between mb-4">
                  {/* Ayah number bubble */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: darkMode ? "#3d2b1f" : "#f5e6df",
                      color: darkMode ? "#c4a882" : "#9a7060",
                      border: `1px solid ${darkMode ? "#5a3d1a" : "#e8c4b8"}`,
                    }}>
                    {ayah.numberInSurah}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Play */}
                    <button onClick={() => playAyah(ayah.numberInSurah)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs transition-all ${
                        isPlaying
                          ? "bg-amber-500 text-white"
                          : darkMode ? "bg-white/8 text-amber-400/70 hover:bg-white/15" : "bg-nude-50 text-nude-400 hover:bg-nude-100 border border-nude-200"
                      }`}>
                      {audioLoading && isPlaying ? (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : isPlaying ? "⏸" : "▶"}
                    </button>

                    {/* Bookmark */}
                    <button onClick={() => toggleBookmark(ayah.numberInSurah)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs transition-all ${
                        isBookmarked
                          ? "bg-amber-500 text-white"
                          : darkMode ? "bg-white/8 text-amber-400/70 hover:bg-white/15" : "bg-nude-50 text-nude-400 hover:bg-nude-100 border border-nude-200"
                      }`}>
                      {isBookmarked ? "🔖" : "🏷"}
                    </button>
                  </div>
                </div>

                {/* Arabic text */}
                <p
                  className={`text-right mb-4 ${arabicSize} ${lineHeight}`}
                  dir="rtl"
                  style={{
                    fontFamily: ARABIC_FONT,
                    color: darkMode ? "#f0e0c8" : "#2a1a0e",
                  }}
                >
                  {ayah.arabic}
                  {" "}
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs align-middle"
                    style={{
                      background: darkMode ? "#3d2b1f" : "#f5e6df",
                      color: darkMode ? "#c4a882" : "#a07060",
                      fontFamily: ARABIC_FONT,
                    }}>
                    {toArabicNum(ayah.numberInSurah)}
                  </span>
                </p>

                {/* Transliteration */}
                {showTranslit && ayah.transliteration && (
                  <p className={`text-xs font-body italic leading-relaxed mb-3 pb-3 border-b ${
                    darkMode ? "text-amber-300/50 border-white/8" : "text-nude-400 border-nude-100"
                  }`}>
                    {ayah.transliteration}
                  </p>
                )}

                {/* Translation */}
                {showTrans && (
                  <p className={`text-sm font-body leading-relaxed ${darkMode ? "text-amber-100/80" : "text-nude-600"}`}>
                    <span className={`font-bold mr-1 ${darkMode ? "text-amber-500/70" : "text-nude-300"}`}>
                      {ayah.numberInSurah}.
                    </span>
                    {ayah.translation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Prev / Next Surah ─────────────────────────────────── */}
      {!loading && !error && (
        <div className="px-4 pb-10 flex gap-3">
          {prev ? (
            <button onClick={() => router.push(`/dashboard/quran/${prev.number}`)}
              className="flex-1 rounded-2xl px-4 py-3 text-left transition-all active:scale-[0.97]"
              style={{ background: card, border: `1px solid ${borderColor}` }}>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${darkMode ? "text-amber-400/50" : "text-nude-300"}`}>← Previous</p>
              <p className={`text-xs font-bold truncate ${darkMode ? "text-amber-200" : "text-nude-600"}`}>
                {prev.number}. {prev.englishName}
              </p>
            </button>
          ) : <div className="flex-1" />}

          {next ? (
            <button onClick={() => router.push(`/dashboard/quran/${next.number}`)}
              className="flex-1 rounded-2xl px-4 py-3 text-right transition-all active:scale-[0.97]"
              style={{ background: card, border: `1px solid ${borderColor}` }}>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${darkMode ? "text-amber-400/50" : "text-nude-300"}`}>Next →</p>
              <p className={`text-xs font-bold truncate ${darkMode ? "text-amber-200" : "text-nude-600"}`}>
                {next.number}. {next.englishName}
              </p>
            </button>
          ) : <div className="flex-1" />}
        </div>
      )}
    </div>
  );
}