"use client";

import {
  useState,
  useMemo,
  useTransition,
  useCallback,
} from "react";
import {
  getHijriMonthDays,
  getHijriMonthStartDow,
  getTodayHijri,
  navigateHijriMonth,
  HIJRI_MONTH_NAMES,
  toGregorianStr,
  type HijriDay,
  type HijriDate,
} from "@/lib/hijriCalendar";
import {
  getMonthPrayerData,
  type MonthPrayerMap,
  type MonthCompletionMap,
} from "@/lib/actions/calendar";
import DayDetailSheet from "./DayDetailSheet";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  // Pre-fetched from the server for the initial month
  initialDetailMap:     MonthPrayerMap;
  initialCompletionMap: MonthCompletionMap;
  initialHijriDate:     HijriDate;    // today's Hijri date
}

// ─── Completion → colour mapping (matches Heatmap.tsx scale) ─────────────────

function completionDotStyle(count: number | undefined): string {
  if (!count || count === 0) return "bg-theme-surface";
  if (count <= 2)             return "bg-nude-200";
  if (count <= 4)             return "bg-nude-300";
  return                             "bg-theme-bg0";    // 5 = all prayers
}

function completionBgStyle(count: number | undefined): string {
  if (!count || count === 0) return "";
  if (count <= 2)             return "bg-theme-bg";
  if (count <= 4)             return "bg-theme-surface/60";
  return                             "bg-nude-200/50";
}

// ─── Day cell ─────────────────────────────────────────────────────────────────

interface DayCellProps {
  day:           HijriDay;
  completionMap: MonthCompletionMap;
  onSelect:      (day: HijriDay) => void;
}

function DayCell({ day, completionMap, onSelect }: DayCellProps) {
  const count    = completionMap[day.gregorianStr];
  const hasEvent = day.event !== null;
  const isHoliday = day.event?.isHoliday ?? false;

  return (
    <button
      onClick={() => onSelect(day)}
      aria-label={`${day.hijri.day}${day.event ? `, ${day.event.name}` : ""}`}
      className={`
        relative flex flex-col items-center justify-center
        aspect-square rounded-2xl
        transition-all duration-150 active:scale-90
        touch-manipulation
        ${day.isToday
          ? "ring-2 ring-nude-500 ring-offset-1"
          : "hover:bg-theme-surface/60"
        }
        ${completionBgStyle(count)}
      `}
      style={isHoliday ? { background: "rgba(200, 168, 76, 0.15)" } : {}}
    >
      {/* Event star badge */}
      {hasEvent && (
        <span
          className="absolute top-0.5 right-0.5 text-[10px] leading-none"
          aria-hidden
        >
          {isHoliday ? "🌟" : "⭐"}
        </span>
      )}

      {/* Hijri day number */}
      <span
        className={`font-body text-sm font-bold leading-none
          ${day.isToday   ? "text-theme-text"  :
            hasEvent      ? "text-theme-text"  :
                            "text-theme-text"  }
        `}
        style={isHoliday ? { color: "var(--color-accent)" } : {}}
      >
        {day.hijri.day}
      </span>

      {/* Prayer completion dot */}
      <div
        className={`w-1.5 h-1.5 rounded-full mt-1 transition-colors duration-300
          ${completionDotStyle(count)}`}
        aria-hidden
      />
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HijriCalendar({
  initialDetailMap,
  initialCompletionMap,
  initialHijriDate,
}: Props) {
  // ── Navigation state ──────────────────────────────────────────────────────
  const [currentHijri, setCurrentHijri] = useState<HijriDate>(initialHijriDate);

  // ── Prayer data — re-fetched on month navigation ──────────────────────────
  const [detailMap,     setDetailMap]     = useState<MonthPrayerMap>(initialDetailMap);
  const [completionMap, setCompletionMap] = useState<MonthCompletionMap>(initialCompletionMap);
  const [isPending, startTransition]      = useTransition();

  // ── Selected day → bottom sheet ───────────────────────────────────────────
  const [selectedDay, setSelectedDay] = useState<HijriDay | null>(null);

  // ── Calendar grid ─────────────────────────────────────────────────────────
  const monthDays = useMemo(
    () => getHijriMonthDays(currentHijri.year, currentHijri.month),
    [currentHijri.year, currentHijri.month]
  );

  // How many blank cells before the first day (Sunday = 0)
  const startDow = useMemo(
    () => getHijriMonthStartDow(currentHijri.year, currentHijri.month),
    [currentHijri.year, currentHijri.month]
  );

  // ── Month navigation ──────────────────────────────────────────────────────
  const navigate = useCallback((delta: -1 | 1) => {
    const next = navigateHijriMonth(currentHijri.year, currentHijri.month, delta);
    setCurrentHijri(next);

    // Fetch prayer data for the new month
    startTransition(async () => {
      const newDays = getHijriMonthDays(next.year, next.month);
      if (newDays.length === 0) return;

      const fromDate = newDays[0].gregorianStr;
      const toDate   = newDays[newDays.length - 1].gregorianStr;

      const { detailMap: d, completionMap: c } =
        await getMonthPrayerData(fromDate, toDate);

      setDetailMap(d);
      setCompletionMap(c);
    });
  }, [currentHijri.year, currentHijri.month]);

  const monthMeta   = HIJRI_MONTH_NAMES[currentHijri.month];
  const todayHijri  = getTodayHijri();
  const isThisMonth =
    currentHijri.year  === todayHijri.year &&
    currentHijri.month === todayHijri.month;

  // ── Events in this month ──────────────────────────────────────────────────
  const monthEvents = useMemo(
    () => monthDays.filter((d) => d.event !== null),
    [monthDays]
  );

  return (
    <>
      <div className="bg-theme-surface border border-theme-border rounded-3xl
        overflow-hidden shadow-sm">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div
          className="px-5 pt-5 pb-4 relative overflow-hidden"
          style={{ background: "var(--card-gradient)" }}
        >
          {/* Gregorian month context */}
          <p className="font-body text-[10px] tracking-widest text-theme-muted
            uppercase mb-1">
            {/* Show the Gregorian months this Hijri month spans */}
            {monthDays.length > 0 &&
              (() => {
                const first = monthDays[0].gregorian;
                const last  = monthDays[monthDays.length - 1].gregorian;
                const fStr  = first.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
                const lStr  = last.toLocaleDateString("en-GB",  { month: "short", year: "numeric" });
                return fStr === lStr ? fStr : `${fStr} – ${lStr}`;
              })()
            }
          </p>

          {/* Month name row */}
          <div className="flex items-center justify-between">
            {/* Prev */}
            <button
              onClick={() => navigate(-1)}
              disabled={isPending}
              aria-label="Previous Hijri month"
              className="w-9 h-9 rounded-xl bg-theme-surface/60 flex items-center justify-center
                text-theme-text border border-theme-border hover:bg-theme-surface/80
                disabled:opacity-40 transition-all active:scale-90"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Month + year */}
            <div className="text-center flex-1 px-3">
              <p
                className="font-display text-2xl font-bold text-theme-text
                  leading-tight"
              >
                {monthMeta?.english ?? ""}
              </p>
              <p
                className="text-base text-theme-muted mt-0.5"
                style={{
                  fontFamily:
                    "'Scheherazade New', 'Traditional Arabic', serif",
                  direction: "rtl",
                }}
              >
                {monthMeta?.arabic ?? ""} {currentHijri.year} هـ
              </p>
            </div>

            {/* Next */}
            <button
              onClick={() => navigate(1)}
              disabled={isPending}
              aria-label="Next Hijri month"
              className="w-9 h-9 rounded-xl bg-theme-surface/60 flex items-center justify-center
                text-theme-text border border-theme-border hover:bg-theme-surface/80
                disabled:opacity-40 transition-all active:scale-90"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Loading bar */}
          {isPending && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-surface">
              <div
                className="h-full bg-nude-400 rounded-full"
                style={{ animation: "slideRight 0.8s ease infinite" }}
              />
            </div>
          )}
        </div>

        {/* ── Day-of-week headers ─────────────────────────────────── */}
        <div className="grid grid-cols-7 px-3 pt-3 pb-1">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} className="text-center">
              <span
                className={`font-body text-[10px] font-bold tracking-wider uppercase
                  ${d === "Fri" ? "text-theme-muted" : "text-theme-muted/70"}`}
              >
                {d}
              </span>
            </div>
          ))}
        </div>

        {/* ── Calendar grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-7 gap-1 px-3 pb-3">
          {/* Leading blank cells */}
          {Array.from({ length: startDow }).map((_, i) => (
            <div key={`blank-${i}`} className="aspect-square" />
          ))}

          {/* Day cells */}
          {monthDays.map((day) => (
            <DayCell
              key={day.gregorianStr}
              day={day}
              completionMap={completionMap}
              onSelect={setSelectedDay}
            />
          ))}
        </div>

        {/* ── Legend ──────────────────────────────────────────────── */}
        <div className="px-4 pb-4 pt-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-theme-surface" />
              <span className="font-body text-[10px] text-theme-muted/70">0</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-nude-200" />
              <span className="font-body text-[10px] text-theme-muted/70">1–2</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-nude-300" />
              <span className="font-body text-[10px] text-theme-muted/70">3–4</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-theme-bg0" />
              <span className="font-body text-[10px] text-theme-muted/70">5</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px]">⭐</span>
            <span className="font-body text-[10px] text-theme-muted/70">Event</span>
          </div>
        </div>
      </div>

      {/* ── Islamic events this month ───────────────────────────── */}
      {monthEvents.length > 0 && (
        <div className="bg-theme-surface border border-theme-border rounded-3xl
          overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-nude-50">
            <p className="font-body text-[10px] font-bold tracking-widest
              text-theme-muted uppercase">
              This month
            </p>
          </div>
          <div className="divide-y divide-nude-50">
            {monthEvents.map((day) => (
              <button
                key={day.gregorianStr}
                onClick={() => setSelectedDay(day)}
                className="w-full flex items-center gap-3 px-4 py-3.5
                  hover:bg-theme-bg transition-colors active:scale-[0.98]
                  text-left touch-manipulation"
              >
                {/* Event emoji */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center
                    text-lg flex-shrink-0 bg-theme-bg`}
                  style={day.event!.isHoliday ? { background: "rgba(200, 168, 76, 0.15)" } : {}}
                >
                  {day.event!.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-bold text-theme-text truncate">
                    {day.event!.name}
                  </p>
                  <p className="font-body text-xs text-theme-muted mt-0.5">
                    {day.hijri.day} {HIJRI_MONTH_NAMES[day.hijri.month]?.english} ·{" "}
                    {day.gregorian.toLocaleDateString("en-GB", {
                      day: "numeric", month: "short",
                    })}
                  </p>
                </div>

                {/* Arabic name */}
                <p
                  className="text-sm text-theme-muted flex-shrink-0"
                  style={{
                    fontFamily:
                      "'Scheherazade New', 'Traditional Arabic', serif",
                    direction: "rtl",
                  }}
                >
                  {day.event!.arabicName}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Jump to today (shown when not on current month) ────────── */}
      {!isThisMonth && (
        <button
          onClick={() => {
            const today = getTodayHijri();
            setCurrentHijri(today);
            startTransition(async () => {
              const days = getHijriMonthDays(today.year, today.month);
              if (!days.length) return;
              const { detailMap: d, completionMap: c } = await getMonthPrayerData(
                days[0].gregorianStr,
                days[days.length - 1].gregorianStr
              );
              setDetailMap(d);
              setCompletionMap(c);
            });
          }}
          className="w-full py-3 rounded-2xl font-body text-sm font-bold
            text-theme-text bg-theme-surface border border-theme-border
            hover:bg-theme-bg transition-colors active:scale-[0.98]
            touch-manipulation"
        >
          Jump to today ↩
        </button>
      )}

      {/* ── Day detail bottom sheet ─────────────────────────────── */}
      {selectedDay && (
        <DayDetailSheet
          day={selectedDay}
          prayers={detailMap[selectedDay.gregorianStr] ?? []}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {/* Loading animation keyframe */}
      <style>{`
        @keyframes slideRight {
          0%   { width: 0%;   margin-left: 0; }
          50%  { width: 60%;  margin-left: 20%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </>
  );
}
