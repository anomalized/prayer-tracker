"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ChallengeStatus = "pending" | "active" | "completed" | "declined";

export interface Challenge {
  id:            string;
  challengerId:  string;
  opponentId:    string;
  status:        ChallengeStatus;
  startDate:     string | null;
  endDate:       string | null;
  winnerId:      string | null;
  pointsAwarded: boolean;
  createdAt:     string;
  challengerName: string;
  opponentName:   string;
}

export interface ChallengeResult {
  challengeId:    string;
  status:         ChallengeStatus;
  challengerName: string;
  opponentName:   string;
  challengerPct:  number;
  opponentPct:    number;
  winnerId:       string | null;
  daysRemaining:  number;
  pointsAwarded:  boolean;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export async function sendChallenge(opponentId: string): Promise<{ ok: boolean; error?: string; challengeId?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  if (user.id === opponentId) return { ok: false, error: "Cannot challenge yourself" };

  const { data: friendship } = await supabase
    .from("friendships")
    .select("id")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${opponentId}),` +
      `and(requester_id.eq.${opponentId},addressee_id.eq.${user.id})`
    )
    .eq("status", "accepted")
    .maybeSingle();

  if (!friendship) {
    return { ok: false, error: "You must be friends to send a challenge" };
  }

  const { data, error } = await supabase
    .from("challenges")
    .insert({
      challenger_id: user.id,
      opponent_id:   opponentId,
      status:        "pending",
      type:          "seven_day_completion",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23P01") {
      return { ok: false, error: "A challenge already exists between you" };
    }
    console.error("[sendChallenge]", error.message);
    return { ok: false, error: "Failed to send challenge" };
  }

  revalidatePath("/dashboard/friends");
  return { ok: true, challengeId: data.id };
}

export async function acceptChallenge(challengeId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const today = getTodayStr();

  const { error } = await supabase
    .from("challenges")
    .update({
      status:     "active",
      start_date: today,
      end_date:   addDays(today, 6),
    })
    .eq("id", challengeId)
    .eq("opponent_id", user.id)
    .eq("status", "pending");

  if (error) {
    console.error("[acceptChallenge]", error.message);
    return { ok: false, error: "Failed to accept challenge" };
  }

  revalidatePath("/dashboard/friends");
  return { ok: true };
}

export async function declineChallenge(challengeId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("challenges")
    .update({ status: "declined" })
    .eq("id", challengeId)
    .eq("opponent_id", user.id)
    .eq("status", "pending");

  if (error) {
    console.error("[declineChallenge]", error.message);
    return { ok: false, error: "Failed to decline challenge" };
  }

  revalidatePath("/dashboard/friends");
  return { ok: true };
}

export async function getActiveChallenges(): Promise<Challenge[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const sevenDaysAgo = addDays(getTodayStr(), -7);

  const { data, error } = await supabase
    .from("challenges")
    .select(`
      id, challenger_id, opponent_id, status, start_date, end_date,
      winner_id, points_awarded, created_at,
      challenger:profiles!challenges_challenger_id_fkey(full_name),
      opponent:profiles!challenges_opponent_id_fkey(full_name)
    `)
    .or(
      `challenger_id.eq.${user.id},opponent_id.eq.${user.id}`
    )
    .or(
      `status.in.(pending,active),` +
      `and(status.eq.completed,end_date.gte.${sevenDaysAgo})`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getActiveChallenges]", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id:             row.id,
    challengerId:   row.challenger_id,
    opponentId:     row.opponent_id,
    status:         row.status as ChallengeStatus,
    startDate:      row.start_date,
    endDate:        row.end_date,
    winnerId:       row.winner_id,
    pointsAwarded:  row.points_awarded,
    createdAt:      row.created_at,
    challengerName: row.challenger?.full_name ?? "Challenger",
    opponentName:   row.opponent?.full_name   ?? "Opponent",
  }));
}

export async function getChallengeLeaderboard(challengeId: string): Promise<ChallengeResult | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("get_challenge_results", {
    p_challenge_id: challengeId,
  });

  if (error) {
    console.error("[getChallengeLeaderboard]", error.message);
    return null;
  }

  const r = data as any;
  if (!r?.ok) return null;

  if (r.status === "completed") {
    revalidatePath("/dashboard/friends");
  }

  return {
    challengeId,
    status:         r.status as ChallengeStatus,
    challengerName: r.challengerName,
    opponentName:   r.opponentName,
    challengerPct:  r.challengerPct ?? 0,
    opponentPct:    r.opponentPct ?? 0,
    winnerId:       r.winnerId ?? null,
    daysRemaining:  r.daysRemaining ?? 0,
    pointsAwarded:  r.pointsAwarded ?? false,
  };
}
