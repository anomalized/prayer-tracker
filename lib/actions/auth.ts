"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Unified profile creation/upsert ──────────────────────────
async function ensureUserProfile(userId: string, fullName?: string, email?: string) {
  const supabase = createClient();

  try {
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // If profile exists, skip creation
    if (profile) return { success: true };

    // If PGRST116 (not found) error, create profile
    if (profileError && profileError.code === "PGRST116") {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: userId,
        full_name: fullName || email?.split("@")[0] || "User",
        email: email || null,
      });

      if (insertError) {
        if (process.env.NODE_ENV === "development") console.error("[ensureUserProfile]", insertError.message);
        return { success: false, error: insertError.message };
      }

      return { success: true };
    }

    // Other errors
    if (profileError) {
      if (process.env.NODE_ENV === "development") console.error("[ensureUserProfile]", profileError.message);
      return { success: false, error: profileError.message };
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("[ensureUserProfile]", error);
    return { success: false, error: "Failed to ensure profile" };
  }

  return { success: true };
}

// ── Send magic link (OTP-based) ──────────────────────────────
export async function sendMagicLink(email: string) {
  const supabase = createClient();

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/magiclink/callback`,
      },
    });

    if (error) {
      if (process.env.NODE_ENV === "development") console.error("[sendMagicLink]", error.message);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: `Magic link sent to ${email}. Check your email!`,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("[sendMagicLink]", error);
    return {
      success: false,
      error: "Failed to send magic link. Please try again.",
    };
  }
}

// ── Verify magic link & create profile ──────────────────────
export async function verifyMagicLink() {
  const supabase = createClient();

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      if (process.env.NODE_ENV === "development") console.error("[verifyMagicLink]", error?.message);
      return { success: false, user: null };
    }

    // Ensure user profile exists
    await ensureUserProfile(user.id, user.user_metadata?.full_name, user.email);

    revalidatePath("/dashboard");
    return { success: true, user };
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("[verifyMagicLink]", error);
    return { success: false, user: null };
  }
}

// ── Unified profile creation handler (for both password & magic link auth) ──
export async function createUserProfile(userId: string, fullName: string, email: string) {
  return ensureUserProfile(userId, fullName, email);
}
