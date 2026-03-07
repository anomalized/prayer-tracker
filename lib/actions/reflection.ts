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