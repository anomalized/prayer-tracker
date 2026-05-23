"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProfile(fullName: string, city: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Validate city against Aladhan API before saving
  if (city.trim()) {
    try {
      const today = new Date();
      const res = await fetch(
        `https://api.aladhan.com/v1/timingsByCity/${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}?city=${encodeURIComponent(city.trim())}&country=&method=2`
      );
      const data = await res.json();
      if (!data || data.code !== 200 || !data.data?.timings) {
        return { error: `"${city}" wasn't recognised as a valid city. Try a major city like "Lahore" or "London".` };
      }
    } catch {
      // Network error — allow save anyway, don't block the user
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, city })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard/today");
  return { success: true };
}

export async function completeOnboarding(city: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Validate city
  if (city.trim()) {
    try {
      const today = new Date();
      const res = await fetch(
        `https://api.aladhan.com/v1/timingsByCity/${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}?city=${encodeURIComponent(city.trim())}&country=&method=2`
      );
      const data = await res.json();
      if (!data || data.code !== 200 || !data.data?.timings) {
        return { error: `"${city}" wasn't recognised as a valid city. Try a major city like "Lahore" or "London".` };
      }
    } catch {
      // Network error — allow save anyway
    }
  }

  // Update city in profiles
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ city })
    .eq("id", user.id);

  if (profileError) return { error: profileError.message };

  // Mark onboarding as complete in user_stats
  const { error: statsError } = await supabase
    .from("user_stats")
    .update({ onboarding_complete: true })
    .eq("user_id", user.id);

  if (statsError) return { error: statsError.message };

  revalidatePath("/dashboard/today");
  return { success: true };
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { success: true };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function deleteAccount() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Delete profile (cascades to all user data via FK)
  await supabase.from("profiles").delete().eq("id", user.id);
  await supabase.auth.signOut();
  redirect("/auth/login");
}