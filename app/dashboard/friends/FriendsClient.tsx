"use client";

import { useState, useTransition } from "react";
import AddFriendForm from "@/components/friends/AddFriendForm";
import ActivityFeed from "@/components/friends/ActivityFeed";
import PendingRequests from "@/components/friends/PendingRequests";
import ChallengesSection from "@/components/friends/ChallengesSection";
import { sendNudge } from "@/lib/actions/nudge";
import { removeFriend } from "@/lib/actions/friends";
import type { Challenge } from "@/lib/actions/challenges";
import MenuButton from "@/components/ui/MenuButton";
import { FriendActivity } from "@/types";

const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const MEDALS = ["🥇", "🥈", "🥉"];
const RANK_COLORS = ["#F59E0B", "#9CA3AF", "#B45309"];

interface Friend {
  friendshipId: string;
  id: string;
  name: string;
  city: string;
  totalPoints: number;
  currentStreak: number;
  donePrayers: number;
  todayPrayers: Array<{ prayer_name: string; status: string }>;
  badges: string[];
}

interface Props {
  myId: string;
  myName: string;
  myStats: { total_points: number; current_streak: number; best_streak: number } | null;
  myTodayPrayers?: Array<{ prayer_name: string; status: string }>;
  friendsData: {
    accepted: Friend[];
    pending: Array<{ friendshipId: string; id: string; name: string }>;
  } | null;
  friendActivity?: FriendActivity[];
  challenges: Challenge[];
}

interface LeaderboardEntry {
  id: string;
  friendshipId?: string;
  name: string;
  points: number;
  streak: number;
  donePrayers: number;
  todayPrayers: Array<{ prayer_name: string; status: string }>;
  isMe: boolean;
}

function PrayerDots({ todayPrayers }: { todayPrayers: Array<{ prayer_name: string; status: string }> }) {
  const prayerMap = Object.fromEntries(todayPrayers.map(p => [p.prayer_name, p.status]));
  return (
    <div className="flex gap-1 items-center">
      {PRAYER_NAMES.map(p => {
        const status = prayerMap[p];
        return (
          <div key={p} title={p}
            className={`w-2 h-2 rounded-full transition-all
              ${status === "ontime" ? "bg-nude-500" :
                status === "late"   ? "bg-nude-300" :
                status === "missed" ? "bg-red-200"  : "bg-nude-100"}`}
          />
        );
      })}
    </div>
  );
}

function LeaderboardRow({ entry, rank, myPoints, showActions }: {
  entry: LeaderboardEntry; rank: number; myPoints: number; showActions: boolean;
}) {
  const [nudgeSent, setNudgeSent] = useState(false);
  const [showMenu, setShowMenu]   = useState(false);
  const [isPending, startTransition] = useTransition();

  const safeName = entry.name?.length > 0 ? entry.name : "Friend";
  const initial  = safeName.charAt(0).toUpperCase();
  const isMedal  = rank <= 3;
  const diff     = entry.points - myPoints;

  const handleNudge = () => {
    if (nudgeSent || !entry.friendshipId) return;
    startTransition(async () => {
      await sendNudge(entry.id);
      setNudgeSent(true);
      setTimeout(() => setNudgeSent(false), 4000);
    });
  };

  const handleRemove = () => {
    if (!entry.friendshipId) return;
    startTransition(async () => { await removeFriend(entry.friendshipId!); });
    setShowMenu(false);
  };

  return (
    <div className={`relative flex items-center gap-3 px-5 py-4 transition-colors
      ${entry.isMe ? "bg-nude-100 border-l-4 border-nude-400"
        : isMedal  ? "bg-gradient-to-r from-amber-50/50 to-transparent"
        : "hover:bg-nude-50/60"}`}
    >
      <div className="w-7 flex-shrink-0 flex items-center justify-center">
        {isMedal ? <span className="text-lg leading-none">{MEDALS[rank-1]}</span>
          : <span className="font-display text-xs font-bold text-nude-300">#{rank}</span>}
      </div>

      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0"
        style={{ background: isMedal
          ? `linear-gradient(135deg, ${RANK_COLORS[rank-1]}66, ${RANK_COLORS[rank-1]})`
          : entry.isMe ? "linear-gradient(135deg, #c8a09888, #d4786a)"
          : "linear-gradient(135deg, #e8c4b888, #c8a098)" }}
      >{initial}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`font-body text-sm font-bold truncate ${entry.isMe ? "text-nude-800" : "text-nude-700"}`}>
            {safeName}
          </p>
          {entry.isMe && <span className="text-nude-400 font-body text-xs flex-shrink-0">(you)</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <PrayerDots todayPrayers={entry.todayPrayers} />
          <span className="text-nude-300 text-xs">{entry.donePrayers}/5</span>
          <span className="text-nude-200 text-xs">·</span>
          <span className="text-nude-400 text-xs">🔥{entry.streak}</span>
        </div>
      </div>

      <div className="text-right flex-shrink-0 mr-1">
        <p className="font-display text-base font-bold"
          style={{ color: isMedal ? RANK_COLORS[rank-1] : entry.isMe ? "#d4786a" : "#b08070" }}>
          {entry.points.toLocaleString()}
        </p>
        {!entry.isMe && (
          <p className={`text-xs font-body ${diff > 0 ? "text-red-400" : diff < 0 ? "text-green-500" : "text-nude-300"}`}>
            {diff > 0 ? `▲${diff}` : diff < 0 ? `▼${Math.abs(diff)}` : "tied"}
          </p>
        )}
      </div>

      {showActions && !entry.isMe && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {entry.donePrayers < 5 && (
            <button onClick={handleNudge} disabled={nudgeSent || isPending}
              title={nudgeSent ? "Nudge sent!" : "Send gentle nudge"}
              className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs transition-all
                ${nudgeSent ? "bg-nude-200 text-nude-400" : "bg-nude-100 hover:bg-nude-200 text-nude-500"}`}>
              {nudgeSent ? "✓" : "🌸"}
            </button>
          )}
          <div className="relative">
            <button onClick={() => setShowMenu(v => !v)}
              className="w-7 h-7 rounded-xl flex items-center justify-center text-nude-300 hover:text-nude-500 hover:bg-nude-100 transition-colors text-xs font-bold">
              ···
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-nude-200 rounded-2xl shadow-lg py-1 z-20 min-w-[130px]">
                <button onClick={handleRemove}
                  className="w-full text-left px-4 py-2.5 text-xs font-body text-red-400 hover:bg-nude-50">
                  Remove friend
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FriendsClient({ myId, myName, myStats, myTodayPrayers = [], friendsData, friendActivity, challenges }: Props) {
  const [showAdd, setShowAdd] = useState(false);

  const myPoints   = myStats?.total_points   ?? 0;
  const myStreak   = myStats?.current_streak ?? 0;
  const accepted   = friendsData?.accepted   ?? [];
  const pending    = friendsData?.pending    ?? [];
  const myDonePrayers = myTodayPrayers.filter(p => p.status !== "missed").length;
  const friendsForChallenge = accepted.map((f) => ({ id: f.id, name: f.name ?? "Friend" }));
  const activityItems = friendActivity ?? [];

  const myEntry: LeaderboardEntry = {
    id: myId, name: myName ?? "You",
    points: myPoints, streak: myStreak,
    donePrayers: myDonePrayers,
    todayPrayers: myTodayPrayers,
    isMe: true,
  };

  const friendEntries: LeaderboardEntry[] = accepted.map(f => ({
    id: f.id, friendshipId: f.friendshipId,
    name: f.name ?? "Friend",
    points: f.totalPoints ?? 0,
    streak: f.currentStreak ?? 0,
    donePrayers: f.donePrayers ?? 0,
    todayPrayers: f.todayPrayers ?? [],
    isMe: false,
  }));

  const allEntries  = [myEntry, ...friendEntries].sort((a, b) => b.points - a.points);
  const myRank      = allEntries.findIndex(e => e.isMe) + 1;
  const leader      = allEntries[0];
  const pointsToTop = leader?.isMe ? 0 : (leader?.points ?? 0) - myPoints;

  return (
    <div className="min-h-screen pb-28 md:pb-0" style={{ background: "#fdf6f3" }}>

      {/* Header — light peach matching Qibla and other pages */}
      <div className="px-5 pt-12  md:pt-6 pb-6 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #f5e6df 0%, #f0d8ce 60%, #ecddd6 100%)" }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-40" style={{ background: "#e8c4b8" }} />
        <MenuButton className="absolute top-12 md:top-6 right-5 z-10" dark={false} />
        <p className="font-body text-xs tracking-widest text-nude-400 uppercase mb-1 relative z-10">Leaderboard</p>
        <h1 className="font-display text-3xl font-bold text-nude-700 mb-3 relative z-10">Friends 🏆</h1>
        <div className="flex gap-2 flex-wrap relative z-10">
          <div className="bg-white/60 backdrop-blur rounded-2xl px-3 py-1.5 border border-nude-200">
            <p className="text-nude-600 text-xs font-bold">{myRank === 1 ? "👑 You're #1!" : `#${myRank} of ${allEntries.length}`}</p>
          </div>
          {pointsToTop > 0 && (
            <div className="bg-white/60 backdrop-blur rounded-2xl px-3 py-1.5 border border-nude-200">
              <p className="text-nude-600 text-xs font-bold">⚡ {pointsToTop} pts to #1</p>
            </div>
          )}
          {myStreak > 0 && (
            <div className="bg-white/60 backdrop-blur rounded-2xl px-3 py-1.5 border border-nude-200">
              <p className="text-nude-600 text-xs font-bold">🔥 {myStreak} day streak</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {pending.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <PendingRequests requests={pending} />
          </div>
        )}

        <ActivityFeed items={activityItems} />

        {/* Leaderboard table */}
        <div className="bg-white border border-nude-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="flex items-center px-5 py-3 bg-nude-50/80 border-b border-nude-100">
            <div className="w-8 flex-shrink-0" />
            <div className="w-10 flex-shrink-0 mr-3" />
            <p className="flex-1 font-body text-[10px] font-bold tracking-widest text-nude-400 uppercase">Player · Today · Streak</p>
            <p className="font-body text-[10px] font-bold tracking-widest text-nude-400 uppercase mr-14">Pts</p>
          </div>
          <div className="divide-y divide-nude-50">
            {allEntries.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-4xl mb-2">🌸</p>
                <p className="font-display text-base font-bold text-nude-600">No friends yet</p>
                <p className="font-body text-sm text-nude-400 mt-1">Add friends below to start competing!</p>
              </div>
            ) : allEntries.map((entry, i) => (
              <LeaderboardRow key={entry.id} entry={entry} rank={i+1} myPoints={myPoints} showActions={accepted.length > 0} />
            ))}
          </div>
          {allEntries.length > 1 && (
            <div className="px-5 py-3 bg-nude-50/80 border-t border-nude-100 flex justify-between">
              <p className="font-body text-xs text-nude-400">🌸 = nudge · ··· = options</p>
              <p className="font-body text-xs text-nude-300">●●●●● = today's prayers</p>
            </div>
          )}
        </div>

        {(accepted.length > 0 || challenges.length > 0) && (
          <ChallengesSection
            initialChallenges={challenges}
            acceptedFriends={friendsForChallenge}
            myId={myId}
          />
        )}

        {/* Add friend */}
        <div className="bg-white border border-nude-100 rounded-3xl overflow-hidden shadow-sm">
          <button onClick={() => setShowAdd(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-nude-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-nude-100 flex items-center justify-center text-lg">➕</div>
              <div className="text-left">
                <p className="font-body text-sm font-bold text-nude-700">Add a friend</p>
                <p className="font-body text-xs text-nude-400">Invite by email address</p>
              </div>
            </div>
            <span className={`text-nude-400 transition-transform duration-200 ${showAdd ? "rotate-180" : ""}`}>▾</span>
          </button>
          {showAdd && (
            <div className="px-5 pb-5 border-t border-nude-100 pt-4">
              <AddFriendForm />
            </div>
          )}
        </div>

        <p className="text-center text-xs text-nude-300 font-body pb-2">Points are all-time · Compete every day 🏆</p>
      </div>
    </div>
  );
}