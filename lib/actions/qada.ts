"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PrayerName } from "@/types";

export interface QadaRow {
  id: string;
  user_id: string;
  prayer_name: PrayerName;
  made_up_count: number;
  remaining_count: number;
  updated_at: string;
}

export type QadaStats = Record<PrayerName, {
  madeUpCount: number;
  remainingCount: number;
  updatedAt: string | null;
}>;

const PRAYERS: PrayerName[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function emptyStats(): QadaStats {
  return Object.fromEntries(
    PRAYERS.map((p) => [p, { madeUpCount: 0, remainingCount: 0, updatedAt: null }])
  ) as QadaStats;
}

function assertValidPrayer(name: string): asserts name is PrayerName {
  if (!PRAYERS.includes(name as PrayerName)) {
    throw new Error(`Invalid prayer name: ${name}`);
  }
}

export async function getQadaStats(): Promise<QadaStats> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return emptyStats();

  const { data, error } = await supabase
    .from("qada_log")
    .select("prayer_name, made_up_count, remaining_count, updated_at")
    .eq("user_id", user.id);

  if (error) {
    console.error("[getQadaStats]", error.message);
    return emptyStats();
  }

  const stats = emptyStats();
  for (const row of data ?? []) {
    const name = row.prayer_name as PrayerName;
    if (PRAYERS.includes(name)) {
      stats[name] = {
        madeUpCount: row.made_up_count,
        remainingCount: row.remaining_count,
        updatedAt: row.updated_at,
      };
    }
  }

  return stats;
}

export async function incrementMadeUp(prayerName: string): Promise<{ error?: string }> {
  try {
    assertValidPrayer(prayerName);
  } catch {
    return { error: `Invalid prayer name: ${prayerName}` };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("qada_log")
    .select("made_up_count, remaining_count")
    .eq("user_id", user.id)
    .eq("prayer_name", prayerName)
    .maybeSingle();

  const currentMadeUp = existing?.made_up_count ?? 0;
  const currentRemaining = existing?.remaining_count ?? 0;

  const { error } = await supabase
    .from("qada_log")
    .upsert(
      {
        user_id: user.id,
        prayer_name: prayerName,
        made_up_count: currentMadeUp + 1,
        remaining_count: Math.max(0, currentRemaining - 1),
      },
      { onConflict: "user_id,prayer_name" }
    );

  if (error) {
    console.error("[incrementMadeUp]", error.message);
    return { error: error.message };
  }

  revalidatePath("/dashboard/qada");
  return {};
}

export async function setRemaining(prayerName: string, count: number): Promise<{ error?: string }> {
  try {
    assertValidPrayer(prayerName);
  } catch {
    return { error: `Invalid prayer name: ${prayerName}` };
  }

  if (!Number.isInteger(count) || count < 0) {
    return { error: "Count must be a non-negative integer." };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("qada_log")
    .upsert(
      {
        user_id: user.id,
        prayer_name: prayerName,
        remaining_count: count,
      },
      { onConflict: "user_id,prayer_name" }
    );

  if (error) {
    console.error("[setRemaining]", error.message);
    return { error: error.message };
  }

  revalidatePath("/dashboard/qada");
  return {};
}
