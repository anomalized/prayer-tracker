"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import type { Friendship, PrayerLog, Profile, UserStats } from "@/types";

type FriendshipRow = Pick<Friendship, "id" | "requester_id" | "addressee_id" | "status">;
type PendingFriend = { friendshipId: string; id: string; name: string };
type ProfileSummary = Pick<Profile, "id" | "full_name">;
type FriendProfile = Pick<Profile, "id" | "full_name" | "city">;
type TodayPrayer = Pick<PrayerLog, "user_id" | "prayer_name" | "status">;
type UserBadgeRow = { user_id: string; badge_id: string };

// ─── Send friend request ─────────────────────────────────────
export async function sendFriendRequest(email: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Use the admin client to look up by email — the anon client is blocked
  // by RLS from seeing profiles of users who aren't already friends.
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  const { data: target } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (!target) return { error: "No user found with that email." };
  if (target.id === user.id) return { error: "You can't add yourself!" };

  const { data: existing } = await supabase
    .from("friendships")
    .select("id, status")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${user.id})`
    )
    .single();

  if (existing) {
    if (existing.status === "accepted") return { error: "You're already friends!" };
    if (existing.status === "pending")  return { error: "Request already sent." };
  }

  const { error } = await supabase.from("friendships").insert({
    requester_id: user.id,
    addressee_id: target.id,
    status: "pending",
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/friends");
  return { success: true, name: target.full_name };
}

// ─── Accept friend request ───────────────────────────────────
export async function acceptFriendRequest(friendshipId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId)
    .eq("addressee_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/friends");
  return { success: true };
}

// ─── Reject / remove friend ──────────────────────────────────
export async function removeFriend(friendshipId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/friends");
  return { success: true };
}

// ─── Get all friends data ────────────────────────────────────
export async function getFriendsData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { accepted: [], pending: [] };

  const { data: friendshipsData } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
  const friendships = (friendshipsData ?? []) as FriendshipRow[];

  if (!friendships?.length) return { accepted: [], pending: [] };

  const accepted = friendships.filter(f => f.status === "accepted");
  const pending  = friendships.filter(f => f.status === "pending");

  // ── Pending requests incoming to me ─────────────────────
  const incomingPending = pending.filter(f => f.addressee_id === user.id);
  let pendingFriends: PendingFriend[] = [];

  if (incomingPending.length > 0) {
    const incomingIds = incomingPending.map(f => f.requester_id);
    const { data: pendingProfilesData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", incomingIds);
    const pendingProfiles = (pendingProfilesData ?? []) as ProfileSummary[];

    pendingFriends = incomingPending.map(f => ({
      friendshipId: f.id,
      id: f.requester_id,
      name: pendingProfiles?.find(p => p.id === f.requester_id)?.full_name ?? "Friend",
    }));
  }

  // ── Accepted friends ─────────────────────────────────────
  if (!accepted.length) {
    return { accepted: [], pending: pendingFriends };
  }

  const friendIds = accepted.map(f =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  );

  const today = new Date().toISOString().split("T")[0];

  const [profilesRes, statsRes, todayPrayersRes, badgesRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, city").in("id", friendIds),
    supabase.from("user_stats").select("*").in("user_id", friendIds),
    supabase.from("prayers").select("user_id, prayer_name, status").in("user_id", friendIds).eq("date", today),
    supabase.from("user_badges").select("user_id, badge_id").in("user_id", friendIds),
  ]);

  const profiles     = (profilesRes.data ?? []) as FriendProfile[];
  const stats        = (statsRes.data ?? []) as UserStats[];
  const todayPrayers = (todayPrayersRes.data ?? []) as TodayPrayer[];
  const badges       = (badgesRes.data ?? []) as UserBadgeRow[];

  const enrichedFriends = accepted.map(friendship => {
    const friendId = friendship.requester_id === user.id ? friendship.addressee_id : friendship.requester_id;
    const profile  = profiles.find(p => p.id === friendId);
    const stat     = stats.find(s => s.user_id === friendId);
    const prayers  = todayPrayers.filter(p => p.user_id === friendId);
    const earnedBadges = badges.filter(b => b.user_id === friendId).map(b => b.badge_id);

    return {
      friendshipId: friendship.id,
      id: friendId,
      name: profile?.full_name ?? "Friend",       // always a string
      city: profile?.city ?? "—",
      totalPoints: stat?.total_points ?? 0,
      currentStreak: stat?.current_streak ?? 0,
      bestStreak: stat?.best_streak ?? 0,
      todayPrayers: prayers,
      donePrayers: prayers.filter(p => p.status !== "missed").length,
      badges: earnedBadges,
    };
  });

  return { accepted: enrichedFriends, pending: pendingFriends };
}

export async function getFriendActivity(limit = 20) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc("get_friend_activity", { p_limit: limit });
  if (error) {
    if (process.env.NODE_ENV === "development") console.error("getFriendActivity error:", error);
    return [];
  }

  return data ?? [];
}

// ─── Send nudge ──────────────────────────────────────────────
export async function sendNudge(friendId: string) {
  return { success: true };
}
