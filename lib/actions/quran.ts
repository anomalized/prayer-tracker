"use server";

import { createClient } from "@/lib/supabase/server";

export interface QuranProgress {
  surahNumber:     number;
  lastAyah:        number;
  bookmarkedAyahs: number[];
  lastReadAt:      string | null;
}

function assertSurah(n: number): void {
  if (!Number.isInteger(n) || n < 1 || n > 114) {
    throw new Error(`Invalid surah number: ${n}`);
  }
}

function assertAyah(n: number): void {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`Invalid ayah number: ${n}`);
  }
}

async function upsertProgress(
  userId:      string,
  surahNumber: number,
  patch: Partial<{
    last_ayah:        number;
    bookmarked_ayahs: number[];
  }>
): Promise<{ error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("quran_progress")
    .upsert(
      {
        user_id:      userId,
        surah_number: surahNumber,
        ...patch,
      },
      {
        onConflict:      "user_id,surah_number",
        ignoreDuplicates: false,
      }
    );

  if (error) {
    if (process.env.NODE_ENV === "development") console.error("[quran:upsertProgress]", error.message);
    return { error: error.message };
  }

  return {};
}

export async function getProgress(
  surahNumber: number
): Promise<QuranProgress | null> {
  try { assertSurah(surahNumber); } catch { return null; }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("quran_progress")
    .select("surah_number, last_ayah, bookmarked_ayahs, last_read_at")
    .eq("user_id", user.id)
    .eq("surah_number", surahNumber)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") console.error("[quran:getProgress]", error.message);
    return null;
  }

  if (!data) return null;

  return {
    surahNumber:     data.surah_number,
    lastAyah:        data.last_ayah,
    bookmarkedAyahs: data.bookmarked_ayahs ?? [],
    lastReadAt:      data.last_read_at,
  };
}

export async function getAllProgress(): Promise<QuranProgress[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("quran_progress")
    .select("surah_number, last_ayah, bookmarked_ayahs, last_read_at")
    .eq("user_id", user.id)
    .order("last_read_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") console.error("[quran:getAllProgress]", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    surahNumber:     row.surah_number,
    lastAyah:        row.last_ayah,
    bookmarkedAyahs: row.bookmarked_ayahs ?? [],
    lastReadAt:      row.last_read_at,
  }));
}

export async function saveBookmark(
  surahNumber: number,
  ayahNumber:  number
): Promise<{ error?: string }> {
  try {
    assertSurah(surahNumber);
    assertAyah(ayahNumber);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const upsertResult = await upsertProgress(user.id, surahNumber, {});
  if (upsertResult.error) return upsertResult;

  const { error } = await supabase.rpc("append_quran_bookmark", {
    p_user_id:      user.id,
    p_surah_number: surahNumber,
    p_ayah_number:  ayahNumber,
  });

  if (error?.message?.includes("function") && error.message.includes("does not exist")) {
    return saveBookmarkFallback(user.id, surahNumber, ayahNumber, supabase);
  }

  if (error) {
    if (process.env.NODE_ENV === "development") console.error("[quran:saveBookmark]", error.message);
    return { error: error.message };
  }

  return {};
}

async function saveBookmarkFallback(
  userId:      string,
  surahNumber: number,
  ayahNumber:  number,
  supabase:    ReturnType<typeof createClient>
): Promise<{ error?: string }> {
  const { data } = await supabase
    .from("quran_progress")
    .select("bookmarked_ayahs")
    .eq("user_id", userId)
    .eq("surah_number", surahNumber)
    .maybeSingle();

  const current = data?.bookmarked_ayahs ?? [];
  if (current.includes(ayahNumber)) return {};

  return upsertProgress(userId, surahNumber, {
    bookmarked_ayahs: Array.from(new Set((current as number[]).concat(ayahNumber))).sort((a, b) => a - b),
  });
}

export async function removeBookmark(
  surahNumber: number,
  ayahNumber:  number
): Promise<{ error?: string }> {
  try {
    assertSurah(surahNumber);
    assertAyah(ayahNumber);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data } = await supabase
    .from("quran_progress")
    .select("bookmarked_ayahs")
    .eq("user_id", user.id)
    .eq("surah_number", surahNumber)
    .maybeSingle();

  if (!data) return {};

  const updated = (data.bookmarked_ayahs ?? []).filter((n: number) => n !== ayahNumber);
  return upsertProgress(user.id, surahNumber, { bookmarked_ayahs: updated });
}

export async function saveScrollPosition(
  surahNumber: number,
  ayahNumber:  number
): Promise<{ error?: string }> {
  try {
    assertSurah(surahNumber);
    assertAyah(ayahNumber);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  return upsertProgress(user.id, surahNumber, { last_ayah: ayahNumber });
}
