"use client";

import type { HijriDay }         from "@/lib/hijriCalendar";
import type { DayPrayerDetail }  from "@/lib/actions/calendar";

const PRAYER_META: Record<string, { icon: string; label: string }> = {
  Fajr:    { icon: "🌙", label: "Fajr"    },
  Dhuhr:   { icon: "☀️", label: "Dhuhr"   },
  Asr:     { icon: "🌤️", label: "Asr"     },
  Maghrib: { icon: "🌇", label: "Maghrib" },
  Isha:    { icon: "🌌", label: "Isha"    },
};

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  ontime: { bg: "bg-theme-surface",  text: "text-theme-text",  label: "On time" },
  late:   { bg: "bg-amber-50",  text: "text-amber-700", label: "Late"    },
  missed: { bg: "bg-red-50",    text: "text-red-400",   label: "Missed"  },
};

interface Props {
  day:     HijriDay;
  prayers: DayPrayerDetail[];   // may be empty if not yet logged
  onClose: () => void;
}

export default function DayDetailSheet({ day, prayers, onClose }: Props) {
  const { hijri, gregorian, event } = day;

  const gregFormatted = gregorian.toLocaleDateString("en-GB", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
    year:    "numeric",
  });

  const hijriFormatted = `${hijri.day} / ${hijri.month} / ${hijri.year} AH`;

  const allPrayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const prayerMap  = Object.fromEntries(prayers.map((p) => [p.prayer_name, p.status]));
  const doneCount  = prayers.filter((p) => p.status !== "missed").length;
  const hasData    = prayers.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(122,64,53,0.18)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md
          bg-theme-bg rounded-t-3xl animate-slide-up pb-safe"
        style={{ boxShadow: "0 -8px 40px rgba(180,100,80,0.12)" }}
        role="dialog"
        aria-modal="true"
        aria-label={`Prayer details for ${gregFormatted}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-nude-300" />
        </div>

        {/* Header */}
        <div
          className="px-5 pt-3 pb-5 relative overflow-hidden"
          style={{
            background: event?.isHoliday
              ? "linear-gradient(135deg, #fef9e7, #fdf0d0)"
              : "linear-gradient(135deg, #fdf0ea, #f5e2d8)",
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-4 w-8 h-8 rounded-xl bg-theme-surface/60
              flex items-center justify-center text-theme-muted
              hover:bg-theme-surface transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Event badge */}
          {event && (
            <div className="inline-flex items-center gap-1.5 bg-theme-surface/70 border
              border-amber-200 rounded-full px-3 py-1 mb-3">
              <span className="text-sm" aria-hidden>{event.emoji}</span>
              <span className="font-body text-xs font-bold text-amber-700">
                {event.name}
              </span>
            </div>
          )}

          {/* Dates */}
          <p className="font-display text-xl font-bold text-theme-text leading-snug">
            {gregFormatted}
          </p>
          <p className="font-body text-xs text-theme-muted mt-1">{hijriFormatted}</p>

          {/* Arabic event name */}
          {event?.arabicName && (
            <p
              className="text-lg text-theme-text mt-2 leading-relaxed"
              style={{
                fontFamily:
                  "'Scheherazade New', 'Traditional Arabic', serif",
                direction: "rtl",
              }}
            >
              {event.arabicName}
            </p>
          )}
        </div>

        {/* Prayer breakdown */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-body text-xs font-bold tracking-widest
              text-theme-muted uppercase">
              Prayer Log
            </p>
            {hasData && (
              <p className="font-body text-xs text-theme-muted">
                {doneCount}/5 completed
              </p>
            )}
          </div>

          {hasData ? (
            <div className="space-y-2">
              {allPrayers.map((name) => {
                const status = prayerMap[name] as string | undefined;
                const meta   = PRAYER_META[name];
                const style  = status ? STATUS_STYLE[status] : null;

                return (
                  <div
                    key={name}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl
                      ${style ? style.bg : "bg-theme-bg"}`}
                  >
                    <span className="text-lg flex-shrink-0" aria-hidden>
                      {meta.icon}
                    </span>
                    <p className={`font-body text-sm font-bold flex-1
                      ${style ? style.text : "text-theme-muted/70"}`}>
                      {meta.label}
                    </p>
                    <span className={`font-body text-xs font-bold
                      ${style ? style.text : "text-theme-muted/70"}`}>
                      {style ? style.label : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* No prayer data for this day */
            <div className="py-6 text-center">
              <p className="text-2xl mb-2">🌱</p>
              <p className="font-body text-sm font-bold text-theme-text">
                {day.isToday ? "No prayers logged yet today" : "No prayer data for this day"}
              </p>
              {!day.isToday && (
                <p className="font-body text-xs text-theme-muted mt-1">
                  Prayer logs appear here once you start tracking
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom safe area spacer */}
        <div className="h-6" />
      </div>
    </>
  );
}
