"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProfile(fullName: string, city: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, city })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
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
