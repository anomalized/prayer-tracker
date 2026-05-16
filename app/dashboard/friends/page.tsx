import { createClient } from "@/lib/supabase/server";
import { getFriendsData, getFriendActivity } from "@/lib/actions/friends";
import FriendsClient from "./FriendsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FriendsPage() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return <FriendsClient myId="" myName="You" myStats={null} friendsData={null} friendActivity={[]} />;
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

    try {
      friendsData = await getFriendsData();
    } catch (e) {
      console.error("getFriendsData error:", e);
      friendsData = { accepted: [], pending: [] };
    }

    try {
      activityFeed = await getFriendActivity();
    } catch (e) {
      console.error("getFriendActivity error:", e);
      activityFeed = [];
    }

    return (
      <FriendsClient
        myId={user.id}
        myName={profile?.full_name ?? "You"}
        myStats={stats ?? null}
        friendsData={friendsData}
        friendActivity={activityFeed}
      />
    );
  } catch (e) {
    console.error("FriendsPage error:", e);
    return (
      <FriendsClient myId="" myName="You" myStats={null} friendsData={{ accepted: [], pending: [] }} friendActivity={[]} />
    );
  }
}
