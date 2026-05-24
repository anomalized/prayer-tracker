"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveReflection({
  prayerName,
  dhikr,
  duas,
  note,
}: {
  prayerName: string;
  dhikr: string[];
  duas: string[];
  note: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Validate payload bounds
  const VALID_PRAYERS = new Set(["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]);
  if (!VALID_PRAYERS.has(prayerName)) return { error: "Invalid prayer name" };
  if (typeof note !== "string" || note.length > 2000) return { error: "Note too long (max 2000 chars)" };
  if (!Array.isArray(dhikr) || dhikr.length > 50) return { error: "Too many dhikr items (max 50)" };
  if (!Array.isArray(duas)  || duas.length > 50)  return { error: "Too many dua items (max 50)" };
  const MAX_STR = 500;
  if (dhikr.some((s) => typeof s !== "string" || s.length > MAX_STR)) return { error: "Dhikr item too long" };
  if (duas.some((s)  => typeof s !== "string" || s.length > MAX_STR)) return { error: "Dua item too long" };

  const today = new Date().toISOString().split("T")[0];

  // Upsert — update if exists, insert if not
  const { error } = await supabase
    .from("prayers")
    .update({
      dhikr: JSON.stringify(dhikr),
      duas:  JSON.stringify(duas),
      note,
    })
    .eq("user_id", user.id)
    .eq("prayer_name", prayerName)
    .eq("date", today);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/today");
  return { success: true };
}