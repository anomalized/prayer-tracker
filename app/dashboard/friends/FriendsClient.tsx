"use client";

import AddFriendForm from "@/components/friends/AddFriendForm";
import FriendCard from "@/components/friends/FriendCard";
import Leaderboard from "@/components/friends/Leaderboard";
import PendingRequests from "@/components/friends/PendingRequests";

interface Props {
  myId: string;
  myName: string;
  myStats: { total_points: number; current_streak: number; best_streak: number } | null;
  friendsData: {
    accepted: Array<{
      friendshipId: string;
      id: string;
      name: string;
      city: string;
      totalPoints: number;
      currentStreak: number;
      bestStreak: number;
      donePrayers: number;
      todayPrayers: Array<{ prayer_name: string; status: string }>;
      badges: string[];
    }>;
    pending: Array<{ friendshipId: string; id: string; name: string }>;
  } | null;
}

export default function FriendsClient({ myId, myName, myStats, friendsData }: Props) {
  const myPoints = myStats?.total_points ?? 0;
  const myStreak = myStats?.current_streak ?? 0;

  // Safe fallback if friendsData is null/undefined
  const accepted = friendsData?.accepted ?? [];
  const pending  = friendsData?.pending ?? [];

  const leaderboardEntries = [
    { id: myId, name: myName ?? "You", points: myPoints, streak: myStreak, isMe: true },
    ...accepted.map(f => ({
      id: f.id,
      name: f.name ?? "Friend",
      points: f.totalPoints ?? 0,
      streak: f.currentStreak ?? 0,
      isMe: false,
    })),
  ];

  return (
    <div className="min-h-screen bg-nude-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-nude-200 to-nude-100 px-5 pt-12 pb-6 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-nude-300 opacity-20" />
        <p className="font-body text-xs tracking-widest text-nude-500 uppercase mb-1">Community</p>
        <h1 className="font-display text-3xl font-bold text-nude-800 mb-1">Friends 👯‍♀️</h1>
        <p className="font-body text-sm text-nude-500">
          {accepted.length === 0
            ? "Add a friend to see their progress"
            : `${accepted.length} friend${accepted.length > 1 ? "s" : ""} on your journey`}
        </p>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Pending requests */}
        {pending.length > 0 && (
          <PendingRequests requests={pending} />
        )}

        {/* Add friend */}
        <AddFriendForm />

        {/* Leaderboard — only show if there are friends */}
        {accepted.length > 0 && (
          <Leaderboard entries={leaderboardEntries} />
        )}

        {/* Friend cards */}
        {accepted.length > 0 ? (
          accepted.map(friend => (
            <FriendCard
              key={friend.id}
              friend={friend}
              myPoints={myPoints}
              myStreak={myStreak}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🌸</p>
            <p className="font-display text-xl font-bold text-nude-600 mb-1">No friends yet</p>
            <p className="font-body text-sm text-nude-400">
              Enter a friend's email above to invite them
            </p>
          </div>
        )}

        <p className="text-center text-xs text-nude-300 font-body pb-6">
          Grow together 🌸
        </p>
      </div>
    </div>
  );
}
