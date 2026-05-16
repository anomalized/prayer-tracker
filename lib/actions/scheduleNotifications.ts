"use server";

import { createClient } from "@/lib/supabase/server";
import type { PrayerTime } from "@/types";

export interface SchedulePayload {
  prayers: PrayerTime[];
  timezone: string;
  dateGregorian: string;
}

interface ScheduleResult {
  scheduled: number;
  skipped: number;
  error?: string;
}

function normalizePrayerTime(timeStr: string): string {
  let normalised = timeStr.trim();
  if (/am|pm/i.test(normalised)) {
    const [time, meridiem] = normalised.split(/\s+/);
    let [h, m] = time.split(":").map(Number);
    if (/pm/i.test(meridiem) && h !== 12) h += 12;
    if (/am/i.test(meridiem) && h === 12) h = 0;
    normalised = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  return normalised;
}

function prayerTimeToUTC(timeStr: string, dateStr: string, timezone: string): Date | null {
  try {
    const normalised = normalizePrayerTime(timeStr);
    const [hh, mm] = normalised.split(":").map(Number);
    const [year, month, day] = dateStr.split("-").map(Number);

    const candidate = new Date(Date.UTC(year, month - 1, day, hh, mm, 0));

    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(candidate);
    const get = (type: string) =>
      parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);

    const localHour = get("hour");
    const localMinute = get("minute");
    const diffMinutes = (hh - localHour) * 60 + (mm - localMinute);

    return new Date(candidate.getTime() - diffMinutes * 60 * 1000);
  } catch {
    return null;
  }
}

const ONESIGNAL_API = "https://onesignal.com/api/v1/notifications";

interface OneSignalPayload {
  app_id: string;
  target_channel: "push";
  include_subscription_ids: string[];
  headings: { en: string };
  contents: { en: string };
  send_after: string;
  small_icon: string;
  data: Record<string, string>;
}

async function sendOneSignalNotification(
  payload: OneSignalPayload,
  restApiKey: string
): Promise<{ id?: string; error?: string }> {
  const res = await fetch(ONESIGNAL_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${restApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || data.errors) {
    const errMsg = Array.isArray(data.errors)
      ? data.errors.join(", ")
      : `HTTP ${res.status}`;
    return { error: errMsg };
  }

  return { id: data.id };
}

const PRAYER_COPY: Record<string, { heading: string; body: string }> = {
  Fajr: {
    heading: "Fajr prayer in 5 minutes 🌙",
    body: "The angels of the night are still present. Start your day with Fajr.",
  },
  Dhuhr: {
    heading: "Dhuhr prayer in 5 minutes ☀️",
    body: "Take a moment from your day to stand before Allah.",
  },
  Asr: {
    heading: "Asr prayer in 5 minutes 🌤️",
    body: "Don't let the afternoon pass without Asr. The Prophet ﷺ emphasised its importance.",
  },
  Maghrib: {
    heading: "Maghrib prayer in 5 minutes 🌇",
    body: "The sun has set. Maghrib time is short — pray as soon as you can.",
  },
  Isha: {
    heading: "Isha prayer in 5 minutes 🌌",
    body: "Close your day with Isha. Whoever prays Isha in congregation is as if they prayed half the night.",
  },
};

export async function schedulePrayerNotifications(
  payload: SchedulePayload
): Promise<ScheduleResult> {
  const { prayers, timezone, dateGregorian } = payload;
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !restApiKey) {
    return { scheduled: 0, skipped: 0, error: "OneSignal credentials not configured." };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { scheduled: 0, skipped: 0, error: "Not authenticated." };

  const { data: tokenRow } = await supabase
    .from("notification_tokens")
    .select("token")
    .eq("user_id", user.id)
    .eq("platform", "web")
    .maybeSingle();

  if (!tokenRow?.token) {
    return {
      scheduled: 0,
      skipped: 0,
      error: "No push subscription found. User may not have granted notification permission.",
    };
  }

  const { data: existingLog } = await supabase
    .from("notification_schedule_log")
    .select("id")
    .eq("user_id", user.id)
    .eq("scheduled_date", dateGregorian)
    .maybeSingle();

  if (existingLog) {
    return { scheduled: 0, skipped: prayers.length };
  }

  const nowUTC = Date.now();
  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  const toSchedule: { name: string; sendAfter: Date }[] = [];
  let skipped = 0;

  for (const prayer of prayers) {
    const utcTime = prayerTimeToUTC(prayer.time, dateGregorian, timezone);
    if (!utcTime) {
      skipped++;
      continue;
    }

    const notifyAt = new Date(utcTime.getTime() - FIVE_MINUTES_MS);
    if (notifyAt.getTime() < nowUTC + 30_000) {
      skipped++;
      continue;
    }

    toSchedule.push({ name: prayer.name, sendAfter: notifyAt });
  }

  if (toSchedule.length === 0) {
    await supabase.from("notification_schedule_log").insert({
      user_id: user.id,
      scheduled_date: dateGregorian,
      prayer_count: 0,
    });
    return { scheduled: 0, skipped };
  }

  const results = await Promise.allSettled(
    toSchedule.map(({ name, sendAfter }) => {
      const copy = PRAYER_COPY[name] ?? {
        heading: `${name} prayer in 5 minutes`,
        body: "Time to pray.",
      };

      const payload: OneSignalPayload = {
        app_id: appId,
        target_channel: "push",
        include_subscription_ids: [tokenRow.token],
        headings: { en: copy.heading },
        contents: { en: copy.body },
        send_after: sendAfter.toUTCString(),
        small_icon: "ic_stat_onesignal_default",
        data: {
          prayer: name,
          type: "prayer_reminder",
          targetUrl: "/dashboard/today",
        },
      };

      return sendOneSignalNotification(payload, restApiKey);
    })
  );

  let scheduled = 0;
  let firstError: string | undefined;

  for (const result of results) {
    if (result.status === "fulfilled" && !result.value.error) {
      scheduled++;
    } else {
      const err =
        result.status === "rejected"
          ? String(result.reason)
          : result.value.error;
      if (!firstError) firstError = err;
    }
  }

  if (scheduled > 0) {
    await supabase.from("notification_schedule_log").upsert(
      {
        user_id: user.id,
        scheduled_date: dateGregorian,
        prayer_count: scheduled,
      },
      { onConflict: "user_id,scheduled_date" }
    );
  }

  return {
    scheduled,
    skipped: skipped + (toSchedule.length - scheduled),
    error: firstError,
  };
}
