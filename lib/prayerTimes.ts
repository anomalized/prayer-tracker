import type { PrayerTime, PrayerName } from "@/types";

const PRAYER_META: Record<string, { arabic: string; icon: string }> = {
  Fajr:    { arabic: "الفجر",  icon: "🌙" },
  Dhuhr:   { arabic: "الظهر",  icon: "☀️" },
  Asr:     { arabic: "العصر",  icon: "🌤️" },
  Maghrib: { arabic: "المغرب", icon: "🌇" },
  Isha:    { arabic: "العشاء", icon: "🌌" },
};

export async function getPrayerTimes(city: string = "Islamabad"): Promise<PrayerTime[]> {
  const fallback: PrayerTime[] = [
    { name: "Fajr",    arabic: "الفجر",  icon: "🌙", time: "5:10 AM"  },
    { name: "Dhuhr",   arabic: "الظهر",  icon: "☀️", time: "12:30 PM" },
    { name: "Asr",     arabic: "العصر",  icon: "🌤️", time: "3:45 PM"  },
    { name: "Maghrib", arabic: "المغرب", icon: "🌇", time: "6:20 PM"  },
    { name: "Isha",    arabic: "العشاء", icon: "🌌", time: "7:50 PM"  },
  ];

  try {
    const today = new Date();
    const day   = today.getDate();
    const month = today.getMonth() + 1;
    const year  = today.getFullYear();

    const res = await fetch(
      `https://api.aladhan.com/v1/timingsByCity/${day}-${month}-${year}?city=${encodeURIComponent(city)}&country=&method=2`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) return fallback;

    const data = await res.json();

    // Aladhan returns { code: 400, status: "Bad Request" } for invalid cities
    // Guard against missing data at every level
    if (!data || data.code !== 200 || !data.data || !data.data.timings) {
      return fallback;
    }

    const timings = data.data.timings;
    const prayers: PrayerName[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    return prayers.map((name) => ({
      name,
      arabic: PRAYER_META[name].arabic,
      icon:   PRAYER_META[name].icon,
      time:   formatTime(timings[name]),
    }));
  } catch {
    return fallback;
  }
}

function formatTime(time24: string): string {
  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr);
  const minute = minuteStr;
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
}

export function isPrayerTimePassed(prayerTime: string): boolean {
  const now = new Date();
  const [timePart, period] = prayerTime.split(" ");
  const [hourStr, minuteStr] = timePart.split(":");
  let hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  const prayerDate = new Date();
  prayerDate.setHours(hour, minute, 0, 0);
  return now >= prayerDate;
}