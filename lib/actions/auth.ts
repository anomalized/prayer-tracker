"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function sendMagicLink(email: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

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

export async function verifyMagicLink() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      if (process.env.NODE_ENV === "development") console.error("[verifyMagicLink]", error?.message);
      return { success: false, user: null };
    }

    // Ensure user profile exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code === "PGRST116") {
      // Profile doesn't exist, create it
      await supabase.from("profiles").insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        email: user.email,
      });
    }

    revalidatePath("/dashboard");
    return { success: true, user };
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("[verifyMagicLink]", error);
    return { success: false, user: null };
  }
}
