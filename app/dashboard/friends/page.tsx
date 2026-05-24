import { createClient } from "@/lib/supabase/server";
import { getFriendsData, getFriendActivity } from "@/lib/actions/friends";
import { getActiveChallenges } from "@/lib/actions/challenges";
import type { Challenge } from "@/lib/actions/challenges";
import FriendsClient from "./FriendsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FriendsPage() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return <FriendsClient myId="" myName="You" myStats={null} friendsData={null} friendActivity={[]} challenges={[]} />;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const { data: stats } = await supabase
      .from("user_stats")
      .select("total_points, current_streak, best_streak")
      .eq("user_id", user.id)
      .single();

    let friendsData = null;
    let activityFeed = [];
    let challenges: Challenge[] = [];

    try {
      friendsData = await getFriendsData();
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.error("getFriendsData error:", e);
      friendsData = { accepted: [], pending: [] };
    }

    try {
      activityFeed = await getFriendActivity();
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.error("getFriendActivity error:", e);
      activityFeed = [];
    }

    try {
      challenges = await getActiveChallenges();
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.error("getActiveChallenges error:", e);
      challenges = [];
    }

    return (
      <FriendsClient
        myId={user.id}
        myName={profile?.full_name ?? "You"}
        myStats={stats ?? null}
        friendsData={friendsData}
        friendActivity={activityFeed}
        challenges={challenges}
      />
    );
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.error("FriendsPage error:", e);
    return (
      <FriendsClient myId="" myName="You" myStats={null} friendsData={{ accepted: [], pending: [] }} friendActivity={[]} challenges={[]} />
    );
  }
}
