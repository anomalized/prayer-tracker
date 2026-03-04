"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ─── Save OneSignal subscription ID to profile ───────────────
export async function saveNotificationToken(token: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ notification_token: token })
    .eq("id", user.id);
}

// ─── Send a real push nudge via OneSignal REST API ───────────
export async function sendNudge(friendId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get sender's name
  const { data: sender } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Get friend's notification token
  const { data: friend } = await supabase
    .from("profiles")
    .select("notification_token, full_name")
    .eq("id", friendId)
    .single();

  if (!friend?.notification_token) {
    return { error: "Friend hasn't enabled notifications yet" };
  }

  const apiKey = process.env.ONESIGNAL_REST_API_KEY;
  const appId  = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

  if (!apiKey || !appId) return { error: "Notifications not configured" };

  const senderName = sender?.full_name ?? "Your friend";

  const response = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      include_subscription_ids: [friend.notification_token],
      headings: { en: "🌸 Prayer Reminder" },
      contents: { en: `${senderName} is thinking of you — don't forget your prayers!` },
      url: "/dashboard/today",
      chrome_web_icon: "/icon-192.png",
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    return { error: err.errors?.[0] ?? "Failed to send nudge" };
  }

  return { success: true };
}