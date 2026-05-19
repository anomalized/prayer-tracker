"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
} from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  DHIKR_OPTIONS,
  PRESET_TARGETS,
  LS_SESSIONS_KEY,
  LS_CURRENT_KEY,
  type DhikrOption,
  type TasbihSession,
  type TasbihCurrentState,
} from "@/lib/tasbih";
import MenuButton from "@/components/ui/MenuButton";

// ─── Constants ────────────────────────────────────────────────────────────────

const ARABIC_FONT =
  "'Scheherazade New', 'KFGQPC Uthmanic Script HAFS', 'Traditional Arabic', serif";

const MAX_HISTORY = 20;  // keep last 20 completed sessions in localStorage

// ─── Helpers ──────────────────────────────────────────────────────────────────

function vibrate(ms: number) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(ms);
  }
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadSessions(): TasbihSession[] {
  try {
    const raw = localStorage.getItem(LS_SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as TasbihSession[]) : [];
  } catch { return []; }
}

function saveSessions(sessions: TasbihSession[]) {
  try {
    localStorage.setItem(LS_SESSIONS_KEY, JSON.stringify(sessions));
  } catch {}
}

function loadCurrent(): TasbihCurrentState | null {
  try {
    const raw = localStorage.getItem(LS_CURRENT_KEY);
    return raw ? (JSON.parse(raw) as TasbihCurrentState) : null;
  } catch { return null; }
}

function saveCurrent(state: TasbihCurrentState) {
  try {
    localStorage.setItem(LS_CURRENT_KEY, JSON.stringify(state));
  } catch {}
}

function clearCurrent() {
  try { localStorage.removeItem(LS_CURRENT_KEY); } catch {}
}

// ─── Sub-component: session history row ──────────────────────────────────────

function HistoryRow({ session }: { session: TasbihSession }) {
  const date      = new Date(session.completedAt);
  const isValid   = !isNaN(date.getTime());
  const relative  = isValid ? formatDistanceToNow(date, { addSuffix: true }) : "recently";
  const formatted = isValid ? format(date, "d MMM · h:mm a") : "";
  const hasArabic = session.dhikrArabic.length > 0;

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-nude-50/60
      transition-colors">

      {/* Round count badge */}
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center
          text-sm font-bold flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #f0d8ce, #e8c4b8)",
          color:      "#9a6050",
        }}
      >
        ×{session.roundsCount}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-body text-sm font-bold text-nude-700 truncate">
            {session.dhikrName}
          </p>
          {hasArabic && (
            <p
              className="text-sm text-nude-400 truncate flex-shrink-0"
              style={{ fontFamily: ARABIC_FONT }}
            >
              {session.dhikrArabic}
            </p>
          )}
        </div>
        <p className="font-body text-xs text-nude-400 mt-0.5">
          {session.totalCount} total · target {session.target} · {relative}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="font-body text-[10px] text-nude-300">{formatted}</p>
      </div>
    </div>
  );
}

// ─── Sub-component: summary stats bar ────────────────────────────────────────

function TodayStats({
  sessions,
  currentRoundsToday,
}: {
  sessions:           TasbihSession[];
  currentRoundsToday: number;
}) {
  const today = new Date().toDateString();

  const todaySessions = sessions.filter(
    (s) => new Date(s.completedAt).toDateString() === today
  );

  const completedRoundsToday = todaySessions.reduce(
    (sum, s) => sum + s.roundsCount, 0
  );
  const totalRoundsToday = completedRoundsToday + currentRoundsToday;
  const totalCountToday  = todaySessions.reduce(
    (sum, s) => sum + s.totalCount, 0
  );

  if (totalRoundsToday === 0 && totalCountToday === 0) return null;

  return (
    <div
      className="flex gap-3 mx-4 px-4 py-3 rounded-2xl border border-nude-100"
      style={{ background: "linear-gradient(135deg, #fdf0ea, #f5e2d8)" }}
    >
      <div className="flex-1 text-center">
        <p className="font-display text-xl font-bold text-nude-800">
          {totalRoundsToday}
        </p>
        <p className="font-body text-[10px] text-nude-400 uppercase tracking-wider">
          rounds today
        </p>
      </div>
      <div className="w-px bg-nude-200" />
      <div className="flex-1 text-center">
        <p className="font-display text-xl font-bold text-nude-800">
          {totalCountToday}
        </p>
        <p className="font-body text-[10px] text-nude-400 uppercase tracking-wider">
          dhikr today
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TasbihCounter() {
  const selectId = useId();

  // ── Dhikr selection ───────────────────────────────────────────────────────
  const [selectedDhikrId, setSelectedDhikrId] = useState("subhanallah");
  const [customText,       setCustomText]       = useState("");
  const [showCustomInput,  setShowCustomInput]  = useState(false);

  const activeDhikr: DhikrOption =
    DHIKR_OPTIONS.find((d) => d.id === selectedDhikrId) ?? DHIKR_OPTIONS[0];

  const displayName   = selectedDhikrId === "custom" ? (customText || "Custom") : activeDhikr.name;
  const displayArabic = selectedDhikrId === "custom" ? ""                        : activeDhikr.arabic;
  const displayTranslit = selectedDhikrId === "custom" ? ""                      : activeDhikr.transliteration;
  const displayTrans  = selectedDhikrId === "custom" ? ""                        : activeDhikr.translation;

  // ── Counter state ─────────────────────────────────────────────────────────
  const [count,         setCount]         = useState(0);
  const [target,        setTarget]        = useState(33);
  const [customTarget,  setCustomTarget]  = useState("");
  const [showCustomTgt, setShowCustomTgt] = useState(false);
  const [roundsToday,   setRoundsToday]   = useState(0);
  const [sessionStart,  setSessionStart]  = useState<string>(new Date().toISOString());

  // ── Animation state ───────────────────────────────────────────────────────
  // 'idle' | 'tapped' | 'celebrating'
  const [circleAnim, setCircleAnim] = useState<"idle" | "tapped" | "celebrating">("idle");
  const [countAnim,  setCountAnim]  = useState(false);
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapAnimTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Reset confirmation ────────────────────────────────────────────────────
  const [resetArmed,  setResetArmed]  = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── History ───────────────────────────────────────────────────────────────
  const [sessions,        setSessions]        = useState<TasbihSession[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [hydrated,        setHydrated]        = useState(false);

  // ── Hydrate from localStorage ─────────────────────────────────────────────
  useEffect(() => {
    const saved    = loadCurrent();
    const sessions = loadSessions();
    setSessions(sessions);

    if (saved) {
      setSelectedDhikrId(saved.dhikrId);
      setCustomText(saved.customText ?? "");
      setCount(saved.count);
      setTarget(saved.target);
      setRoundsToday(saved.roundsToday);
      setSessionStart(saved.startedAt ?? new Date().toISOString());
      if (saved.dhikrId === "custom") setShowCustomInput(true);
      if (!PRESET_TARGETS.includes(saved.target as typeof PRESET_TARGETS[number])) {
        setCustomTarget(String(saved.target));
        setShowCustomTgt(true);
      }
    }

    setHydrated(true);

    return () => {
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
      if (tapAnimTimer.current)   clearTimeout(tapAnimTimer.current);
      if (resetTimer.current)     clearTimeout(resetTimer.current);
    };
  }, []);

  // ── Persist current state on every relevant change ────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    saveCurrent({
      dhikrId:     selectedDhikrId,
      customText,
      count,
      target,
      roundsToday,
      startedAt:   sessionStart,
    });
  }, [hydrated, selectedDhikrId, customText, count, target, roundsToday, sessionStart]);

  // ── Core tap handler ──────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    // Block taps during celebration to prevent double-counting
    if (circleAnim === "celebrating") return;

    vibrate(10);

    // Trigger tap animation
    if (tapAnimTimer.current) clearTimeout(tapAnimTimer.current);
    setCircleAnim("tapped");
    setCountAnim(false);
    // Force re-trigger by clearing then setting
    requestAnimationFrame(() => {
      setCountAnim(true);
      tapAnimTimer.current = setTimeout(() => {
        setCountAnim(false);
      }, 220);
    });

    const newCount = count + 1;

    if (newCount >= target) {
      // ── Target reached ────────────────────────────────────────────────────
      vibrate(50);
      setCount(newCount);
      setCircleAnim("celebrating");

      const newRounds  = roundsToday + 1;
      const now        = new Date().toISOString();

      setRoundsToday(newRounds);

      // Write completed session to history
      const newSession: TasbihSession = {
        id:           genId(),
        dhikrId:      selectedDhikrId,
        dhikrName:    displayName,
        dhikrArabic:  displayArabic,
        roundsCount:  1,
        totalCount:   newCount,
        target,
        startedAt:    sessionStart,
        completedAt:  now,
      };

      setSessions((prev) => {
        const updated = [newSession, ...prev].slice(0, MAX_HISTORY);
        saveSessions(updated);
        return updated;
      });

      // Auto-reset after celebration window
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
      celebrateTimer.current = setTimeout(() => {
        setCount(0);
        setCircleAnim("idle");
        setSessionStart(new Date().toISOString());
      }, 1500);

    } else {
      // ── Normal increment ──────────────────────────────────────────────────
      setCount(newCount);
      // Restore idle after tap animation
      tapAnimTimer.current = setTimeout(() => {
        setCircleAnim("idle");
      }, 180);
    }
  }, [
    circleAnim, count, target, roundsToday,
    selectedDhikrId, displayName, displayArabic, sessionStart,
  ]);

  // ── Dhikr change ──────────────────────────────────────────────────────────
  const handleDhikrChange = (id: string) => {
    setSelectedDhikrId(id);
    setShowCustomInput(id === "custom");
    // Reset counter when dhikr changes
    setCount(0);
    setCircleAnim("idle");
    setRoundsToday(0);
    setSessionStart(new Date().toISOString());
    // Apply the dhikr's default target
    const dhikr = DHIKR_OPTIONS.find((d) => d.id === id);
    if (dhikr && id !== "custom") {
      setTarget(dhikr.defaultTarget);
      setShowCustomTgt(false);
      setCustomTarget("");
    }
  };

  // ── Target change ─────────────────────────────────────────────────────────
  const handleTargetSelect = (t: number | "custom") => {
    if (t === "custom") {
      setShowCustomTgt(true);
    } else {
      setTarget(t);
      setShowCustomTgt(false);
      setCustomTarget("");
      // Reset count if new target is lower than current count
      if (count > t) setCount(0);
    }
  };

  const handleCustomTargetCommit = () => {
    const parsed = parseInt(customTarget, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 10000) {
      setTarget(parsed);
      if (count > parsed) setCount(0);
    } else {
      setCustomTarget(String(target));
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleResetPress = () => {
    if (resetArmed) {
      // Second tap — execute reset
      if (resetTimer.current) clearTimeout(resetTimer.current);
      setResetArmed(false);
      setCount(0);
      setRoundsToday(0);
      setCircleAnim("idle");
      setSessionStart(new Date().toISOString());
      clearCurrent();
      vibrate(20);
    } else {
      // First tap — arm the reset
      setResetArmed(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setResetArmed(false), 3000);
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const progress      = Math.min(count / target, 1);
  const isCelebrating = circleAnim === "celebrating";
  const progressDeg   = progress * 360;

  // Circle colours
  const circleBackground = isCelebrating
    ? "linear-gradient(135deg, #86efac, #22c55e)"
    : "linear-gradient(135deg, #e8c4b8, #d4786a)";

  const circleClass = [
    "transition-none select-none cursor-pointer",
    circleAnim === "tapped"      ? "animate-tasbih-tap"       : "",
    circleAnim === "celebrating" ? "animate-tasbih-celebrate" : "",
  ].filter(Boolean).join(" ");

  const countClass = [
    "font-display font-bold leading-none text-white",
    countAnim ? "animate-tasbih-count-pop" : "",
  ].filter(Boolean).join(" ");

  if (!hydrated) return null; // avoid localStorage hydration mismatch

  return (
    <div
      className="min-h-screen flex flex-col select-none"
      style={{ background: "#fdf6f3" }}
    >

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        className="px-5 pt-12 md:pt-6 pb-5 relative overflow-hidden flex-shrink-0"
        style={{
          background: "linear-gradient(160deg, #f5e6df 0%, #f0d8ce 60%, #ecddd6 100%)",
        }}
      >
        <div
          className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-40"
          style={{ background: "#e8c4b8" }}
        />
        <MenuButton className="absolute top-12 md:top-6 right-5 z-10" dark={false} />

        <p className="font-body text-[10px] tracking-widest text-nude-400 uppercase
          mb-1 relative z-10">
          Remembrance
        </p>
        <h1 className="font-display text-3xl font-bold text-nude-700 mb-4 relative z-10">
          Tasbih 📿
        </h1>

        {/* ── Dhikr selector ─────────────────────────────────────── */}
        <div className="relative z-10">
          <label
            htmlFor={selectId}
            className="block font-body text-[10px] font-bold tracking-widest
              text-nude-400 uppercase mb-1.5"
          >
            Dhikr
          </label>
          <div className="relative">
            <select
              id={selectId}
              value={selectedDhikrId}
              onChange={(e) => handleDhikrChange(e.target.value)}
              className="w-full appearance-none bg-white/70 border border-nude-200
                rounded-2xl px-4 py-3 pr-10 font-body text-sm text-nude-800
                focus:outline-none focus:border-nude-400 transition-colors
                cursor-pointer"
            >
              {DHIKR_OPTIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id === "custom" ? "Custom dhikr…" : `${d.name} — ${d.translation}`}
                </option>
              ))}
            </select>
            {/* Chevron */}
            <svg
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4
                text-nude-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Custom text input */}
          {showCustomInput && (
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Type your dhikr…"
              maxLength={60}
              className="mt-2 w-full bg-white/70 border border-nude-200 rounded-2xl
                px-4 py-2.5 font-body text-sm text-nude-800 placeholder-nude-300
                focus:outline-none focus:border-nude-400 transition-colors"
            />
          )}
        </div>
      </div>

      {/* ── Today stats ──────────────────────────────────────────── */}
      <div className="mt-4 mb-0">
        <TodayStats sessions={sessions} currentRoundsToday={roundsToday} />
      </div>

      {/* ── Arabic display ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-2 pb-4 gap-6">

        {displayArabic ? (
          <div className="text-center space-y-1">
            <p
              className="text-4xl leading-loose text-nude-700"
              style={{ fontFamily: ARABIC_FONT, direction: "rtl" }}
            >
              {displayArabic}
            </p>
            <p className="font-body text-sm text-nude-500 italic">
              {displayTranslit}
            </p>
            <p className="font-body text-xs text-nude-400">
              {displayTrans}
            </p>
          </div>
        ) : customText ? (
          <div className="text-center">
            <p className="font-display text-2xl text-nude-700">{customText}</p>
          </div>
        ) : (
          <div className="h-16" />
        )}

        {/* ── Main counter circle ─────────────────────────────────── */}
        <div className="relative flex items-center justify-center">

          {/* SVG progress ring — sits behind the circle */}
          <svg
            className="absolute"
            width="240" height="240"
            viewBox="0 0 240 240"
            style={{ transform: "rotate(-90deg)" }}
            aria-hidden
          >
            {/* Track */}
            <circle
              cx="120" cy="120" r="108"
              fill="none"
              stroke="#f0d8ce"
              strokeWidth="6"
            />
            {/* Progress arc */}
            <circle
              cx="120" cy="120" r="108"
              fill="none"
              stroke={isCelebrating ? "#22c55e" : "#d4786a"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 108}`}
              strokeDashoffset={`${2 * Math.PI * 108 * (1 - progress)}`}
              style={{ transition: "stroke-dashoffset 0.15s ease, stroke 0.4s ease" }}
            />
          </svg>

          {/* Celebration ring pulse */}
          {isCelebrating && (
            <div
              className="absolute rounded-full border-4 border-green-400"
              style={{
                width: 224, height: 224,
                animation: "tasbihRing 1s ease-out forwards",
              }}
            />
          )}

          {/* The tap circle */}
          <div
            role="button"
            aria-label={`Tap to count ${displayName}. Count: ${count} of ${target}`}
            tabIndex={0}
            className={circleClass}
            style={{
              width:        220,
              height:       220,
              borderRadius: "50%",
              background:   circleBackground,
              display:      "flex",
              flexDirection:"column",
              alignItems:   "center",
              justifyContent: "center",
              gap:          4,
              boxShadow:    isCelebrating
                ? "0 20px 60px -12px rgba(34,197,94,0.4)"
                : "0 20px 60px -12px rgba(200,112,90,0.3)",
              transition:   "background 0.4s ease, box-shadow 0.4s ease",
              // Prevent text selection on rapid taps
              WebkitUserSelect: "none",
              userSelect:       "none",
              // Prevent double-tap zoom on iOS
              touchAction:      "manipulation",
            }}
            onClick={handleTap}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleTap(); }}
          >
            {/* Count number */}
            <span
              className={countClass}
              style={{ fontSize: "5rem" }}
              aria-live="polite"
              aria-atomic="true"
            >
              {count}
            </span>

            {/* Target fraction */}
            <span
              className="font-body text-white/70 text-xs font-bold tracking-wider"
              style={{ marginTop: -4 }}
            >
              of {target}
            </span>

            {/* Celebration label */}
            {isCelebrating && (
              <span className="font-body text-white text-xs font-bold mt-1 animate-fade-up">
                🌸 Masha'Allah!
              </span>
            )}
          </div>
        </div>

        {/* ── Target selector ─────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-2 w-full max-w-xs">
          <p className="font-body text-[10px] font-bold tracking-widest text-nude-400 uppercase">
            Target
          </p>
          <div className="flex gap-2 w-full justify-center">
            {PRESET_TARGETS.map((t) => (
              <button
                key={t}
                onClick={() => handleTargetSelect(t)}
                className={`flex-1 py-2.5 rounded-2xl font-body text-sm font-bold
                  transition-all active:scale-95 touch-manipulation
                  ${target === t && !showCustomTgt
                    ? "text-white shadow-sm"
                    : "bg-white border border-nude-200 text-nude-500 hover:bg-nude-50"
                  }`}
                style={
                  target === t && !showCustomTgt
                    ? { background: "linear-gradient(135deg, #e8a898, #d4786a)" }
                    : {}
                }
              >
                {t}
              </button>
            ))}
            <button
              onClick={() => handleTargetSelect("custom")}
              className={`flex-1 py-2.5 rounded-2xl font-body text-sm font-bold
                transition-all active:scale-95 touch-manipulation
                ${showCustomTgt
                  ? "text-white shadow-sm"
                  : "bg-white border border-nude-200 text-nude-500 hover:bg-nude-50"
                }`}
              style={
                showCustomTgt
                  ? { background: "linear-gradient(135deg, #e8a898, #d4786a)" }
                  : {}
              }
            >
              Custom
            </button>
          </div>

          {/* Custom target input */}
          {showCustomTgt && (
            <div className="flex gap-2 w-full">
              <input
                type="number"
                min="1"
                max="10000"
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                onBlur={handleCustomTargetCommit}
                onKeyDown={(e) => { if (e.key === "Enter") handleCustomTargetCommit(); }}
                placeholder="e.g. 500"
                className="flex-1 bg-white border border-nude-200 rounded-2xl px-4 py-2.5
                  font-body text-sm text-nude-800 text-center focus:outline-none
                  focus:border-nude-400 transition-colors"
                autoFocus
              />
              <button
                onClick={handleCustomTargetCommit}
                className="px-4 py-2.5 rounded-2xl font-body text-sm font-bold text-white
                  active:scale-95 transition-transform"
                style={{ background: "linear-gradient(135deg, #e8a898, #d4786a)" }}
              >
                Set
              </button>
            </div>
          )}
        </div>

        {/* ── Reset button ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 w-full max-w-xs">
          <button
            onClick={handleResetPress}
            className={`flex-1 py-3 rounded-2xl font-body text-sm font-bold
              transition-all active:scale-95 touch-manipulation
              ${resetArmed
                ? "bg-red-50 border-2 border-red-300 text-red-500"
                : "bg-white border border-nude-200 text-nude-500 hover:bg-nude-50"
              }`}
          >
            {resetArmed ? "Tap again to reset ⚠️" : "Reset"}
          </button>

          {/* Rounds indicator */}
          {roundsToday > 0 && (
            <div
              className="px-4 py-3 rounded-2xl border border-nude-200 text-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #fdf0ea, #f5e2d8)" }}
            >
              <p className="font-display text-xl font-bold text-nude-800">
                ×{roundsToday}
              </p>
              <p className="font-body text-[9px] text-nude-400 uppercase tracking-wider">
                rounds
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Session history ──────────────────────────────────────── */}
      <div className="px-4 pb-28 md:pb-8 flex-shrink-0">
        <div className="bg-white border border-nude-100 rounded-3xl overflow-hidden shadow-sm">

          {/* History header / toggle */}
          <button
            onClick={() => setHistoryExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-4
              hover:bg-nude-50 transition-colors"
            aria-expanded={historyExpanded}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #f0d8ce, #e8c4b8)" }}
              >
                📜
              </div>
              <div className="text-left">
                <p className="font-body text-sm font-bold text-nude-700">
                  Session History
                </p>
                <p className="font-body text-xs text-nude-400">
                  {sessions.length > 0
                    ? `${sessions.length} completed round${sessions.length !== 1 ? "s" : ""}`
                    : "No completed rounds yet"}
                </p>
              </div>
            </div>
            <svg
              className={`w-4 h-4 text-nude-300 transition-transform duration-200
                ${historyExpanded ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* History list */}
          {historyExpanded && (
            <div className="border-t border-nude-50">
              {sessions.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-3xl mb-2">📿</p>
                  <p className="font-body text-sm font-bold text-nude-600">
                    No history yet
                  </p>
                  <p className="font-body text-xs text-nude-400 mt-1">
                    Complete your first round to see it here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-nude-50">
                    {sessions.slice(0, 5).map((session) => (
                      <HistoryRow key={session.id} session={session} />
                    ))}
                  </div>

                  {sessions.length > 5 && (
                    <div className="px-4 py-3 border-t border-nude-50">
                      <p className="font-body text-xs text-nude-300 text-center">
                        Showing last 5 of {sessions.length} rounds
                      </p>
                    </div>
                  )}

                  {/* Clear history */}
                  <div className="px-4 py-3 border-t border-nude-50">
                    <button
                      onClick={() => {
                        setSessions([]);
                        saveSessions([]);
                      }}
                      className="w-full py-2 rounded-2xl font-body text-xs font-bold
                        text-nude-300 hover:text-red-400 hover:bg-red-50
                        transition-colors border border-nude-100 hover:border-red-100"
                    >
                      Clear history
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-nude-300 font-body mt-4">
          Every dhikr is recorded with Allah 🌸
        </p>
      </div>
    </div>
  );
}
