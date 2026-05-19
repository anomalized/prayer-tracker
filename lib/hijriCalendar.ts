// ─────────────────────────────────────────────────────────────────────────────
// Hijri Calendar utilities
//
// All Hijri ↔ Gregorian conversions use Intl.DateTimeFormat with
// ca-islamic-umalqura — the same calendar system already used in
// TodayHeader.tsx. No external packages required.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HijriDate {
  year:  number;
  month: number;  // 1–12
  day:   number;  // 1–30
}

export interface HijriDay {
  hijri:       HijriDate;
  gregorian:   Date;           // exact Gregorian Date object for this Hijri day
  gregorianStr: string;        // "YYYY-MM-DD" — used as map key throughout the app
  isToday:     boolean;
  event:       IslamicEvent | null;
}

export interface IslamicEvent {
  key:        string;          // stable identifier
  name:       string;          // English display name
  arabicName: string;
  emoji:      string;
  isHoliday:  boolean;         // true = Eid, false = other significant day
}

// ─── Islamic events ───────────────────────────────────────────────────────────
// Keyed as `${month}-${day}` in the Hijri calendar.
// Source: broadly accepted dates across major madhabs.

export const ISLAMIC_EVENTS: Record<string, IslamicEvent> = {
  "1-1": {
    key:        "new_year",
    name:       "Islamic New Year",
    arabicName: "رأس السنة الهجرية",
    emoji:      "🌙",
    isHoliday:  false,
  },
  "1-10": {
    key:        "ashura",
    name:       "Day of Ashura",
    arabicName: "يوم عاشوراء",
    emoji:      "🤲",
    isHoliday:  false,
  },
  "3-12": {
    key:        "mawlid",
    name:       "Mawlid al-Nabi ﷺ",
    arabicName: "المولد النبوي الشريف",
    emoji:      "⭐",
    isHoliday:  false,
  },
  "7-27": {
    key:        "isra_miraj",
    name:       "Isra and Mi'raj",
    arabicName: "الإسراء والمعراج",
    emoji:      "✨",
    isHoliday:  false,
  },
  "8-15": {
    key:        "shaban_15",
    name:       "Night of Bara'at",
    arabicName: "ليلة البراءة",
    emoji:      "🌟",
    isHoliday:  false,
  },
  "9-1": {
    key:        "ramadan_start",
    name:       "Ramadan Begins",
    arabicName: "بداية رمضان",
    emoji:      "🌙",
    isHoliday:  false,
  },
  "9-27": {
    key:        "laylatul_qadr",
    name:       "Laylatul Qadr",
    arabicName: "ليلة القدر",
    emoji:      "💫",
    isHoliday:  false,
  },
  "10-1": {
    key:        "eid_fitr",
    name:       "Eid al-Fitr",
    arabicName: "عيد الفطر",
    emoji:      "🎉",
    isHoliday:  true,
  },
  "12-9": {
    key:        "arafah",
    name:       "Day of Arafah",
    arabicName: "يوم عرفة",
    emoji:      "🕋",
    isHoliday:  false,
  },
  "12-10": {
    key:        "eid_adha",
    name:       "Eid al-Adha",
    arabicName: "عيد الأضحى",
    emoji:      "🐑",
    isHoliday:  true,
  },
  "12-11": {
    key:        "eid_adha_2",
    name:       "Eid al-Adha (Day 2)",
    arabicName: "عيد الأضحى",
    emoji:      "🐑",
    isHoliday:  true,
  },
  "12-12": {
    key:        "eid_adha_3",
    name:       "Eid al-Adha (Day 3)",
    arabicName: "عيد الأضحى",
    emoji:      "🐑",
    isHoliday:  true,
  },
};

// ─── Hijri month names ────────────────────────────────────────────────────────

export const HIJRI_MONTH_NAMES: Record<number, { arabic: string; english: string }> = {
  1:  { arabic: "مُحَرَّم",       english: "Muharram"     },
  2:  { arabic: "صَفَر",          english: "Safar"         },
  3:  { arabic: "رَبِيعُ الأَوَّل", english: "Rabi al-Awwal" },
  4:  { arabic: "رَبِيعُ الثَّاني", english: "Rabi al-Thani" },
  5:  { arabic: "جُمَادَى الأُولَى", english: "Jumada al-Awwal" },
  6:  { arabic: "جُمَادَى الآخِرَة", english: "Jumada al-Thani" },
  7:  { arabic: "رَجَب",          english: "Rajab"         },
  8:  { arabic: "شَعْبَان",        english: "Sha'ban"       },
  9:  { arabic: "رَمَضَان",        english: "Ramadan"       },
  10: { arabic: "شَوَّال",         english: "Shawwal"       },
  11: { arabic: "ذُو القَعْدَة",   english: "Dhu al-Qi'dah" },
  12: { arabic: "ذُو الحِجَّة",    english: "Dhu al-Hijjah" },
};

// ─── Intl formatter (reused across all conversions) ───────────────────────────

const hijriFormatter = new Intl.DateTimeFormat("en-TN-u-ca-islamic-umalqura", {
  day:   "numeric",
  month: "numeric",
  year:  "numeric",
});

/**
 * Convert a Gregorian Date to a HijriDate.
 * Uses the same Intl approach as TodayHeader.tsx.
 */
export function gregorianToHijri(date: Date): HijriDate {
  const parts = hijriFormatter.formatToParts(date);
  const get   = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * Get today's Hijri date.
 */
export function getTodayHijri(): HijriDate {
  return gregorianToHijri(new Date());
}

/**
 * Approximate the Gregorian date for Hijri year/month/day using the
 * Tabular Islamic calendar formula. Used as the starting point for the
 * scan in getHijriMonthDays(). Never used for display — only for seeding
 * the search window.
 *
 * Formula: Schact (1994), confirmed against Saudi Umm al-Qura ±2 days.
 */
function hijriToApproxJulianDay(h: HijriDate): number {
  return (
    Math.floor((11 * h.year + 3) / 30)
    + 354 * h.year
    + 30 * h.month
    - Math.floor((h.month - 1) / 2)
    + h.day
    + 1948440
    - 385
  );
}

function julianDayToGregorian(jd: number): Date {
  // Algorithm from Richards (2013)
  const f  = jd + 1401 + Math.floor((Math.floor((4 * jd + 274277) / 146097) * 3) / 4) - 38;
  const e  = 4 * f + 3;
  const g  = Math.floor((e % 1461) / 4);
  const h  = 5 * g + 2;
  const D  = Math.floor((h % 153) / 5) + 1;
  const M  = ((Math.floor(h / 153) + 2) % 12) + 1;
  const Y  = Math.floor(e / 1461) - 4716 + Math.floor((14 - M) / 12);
  return new Date(Y, M - 1, D);
}

/**
 * Find the Gregorian Date corresponding to Hijri year/month/day = 1.
 * Scans ±6 days around the Tabular approximation to handle the
 * ±2-day variance between the Tabular and Umm al-Qura systems.
 */
function findGregorianStartOfHijriMonth(hYear: number, hMonth: number): Date {
  const approxJD   = hijriToApproxJulianDay({ year: hYear, month: hMonth, day: 1 });
  const approxDate = julianDayToGregorian(approxJD);

  // Scan in a ±6 day window for the exact day where Hijri month/year match
  for (let offset = -6; offset <= 6; offset++) {
    const candidate = new Date(approxDate);
    candidate.setDate(candidate.getDate() + offset);
    const h = gregorianToHijri(candidate);
    if (h.year === hYear && h.month === hMonth && h.day === 1) {
      return candidate;
    }
  }

  // Fallback: return the approximation (off by ≤2 days in pathological cases)
  return approxDate;
}

/**
 * Returns all days in a given Hijri month as HijriDay objects.
 * Each object carries the exact Gregorian date and its "YYYY-MM-DD" string.
 */
export function getHijriMonthDays(hYear: number, hMonth: number): HijriDay[] {
  const todayGreg    = new Date();
  const todayStr     = toGregorianStr(todayGreg);
  const eventKey     = (h: HijriDate) => `${h.month}-${h.day}`;

  const startGreg = findGregorianStartOfHijriMonth(hYear, hMonth);
  const days: HijriDay[] = [];

  // Walk forward day by day until the Hijri month changes
  // Hijri months are always 29 or 30 days, so max 30 iterations
  for (let i = 0; i < 30; i++) {
    const greg = new Date(startGreg);
    greg.setDate(greg.getDate() + i);

    const h = gregorianToHijri(greg);

    // Stop once we've moved into the next Hijri month
    if (h.month !== hMonth || h.year !== hYear) break;

    const gregStr = toGregorianStr(greg);
    const eKey    = eventKey(h);

    days.push({
      hijri:        h,
      gregorian:    greg,
      gregorianStr: gregStr,
      isToday:      gregStr === todayStr,
      event:        ISLAMIC_EVENTS[eKey] ?? null,
    });
  }

  return days;
}

/**
 * Navigate from a Hijri month to the previous or next month,
 * handling year boundaries correctly.
 */
export function navigateHijriMonth(
  year:  number,
  month: number,
  delta: -1 | 1
): HijriDate {
  let newMonth = month + delta;
  let newYear  = year;
  if (newMonth < 1)  { newMonth = 12; newYear -= 1; }
  if (newMonth > 12) { newMonth = 1;  newYear += 1; }
  return { year: newYear, month: newMonth, day: 1 };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function toGregorianStr(date: Date): string {
  const y  = date.getFullYear();
  const m  = String(date.getMonth() + 1).padStart(2, "0");
  const d  = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Day-of-week index (0=Sun) for the first day of a Hijri month */
export function getHijriMonthStartDow(hYear: number, hMonth: number): number {
  const start = findGregorianStartOfHijriMonth(hYear, hMonth);
  return start.getDay();
}
