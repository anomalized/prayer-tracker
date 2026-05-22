"use client";

import { useState, useTransition, useEffect } from "react";
import {
  acceptChallenge,
  declineChallenge,
  getChallengeLeaderboard,
} from "@/lib/actions/challenges";
import type { Challenge, ChallengeResult } from "@/lib/actions/challenges";

function Avatar({ name, size = 36, isWinner = false }: { name: string; size?: number; isWinner?: boolean }) {
  const initial = (name ?? "?").charAt(0).toUpperCase();
  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      <div
        className="rounded-xl flex items-center justify-center text-white font-display font-bold flex-shrink-0"
        style={{
          width:      size,
          height:     size,
          fontSize:   size * 0.38,
          background: isWinner
            ? "linear-gradient(135deg, #f59e0b, #d97706)"
            : "linear-gradient(135deg, #e8c4b888, #c8a098)",
          boxShadow: isWinner ? "0 0 0 2px #fbbf24" : undefined,
        }}
      >
        {initial}
      </div>
      {isWinner && (
        <span className="text-base leading-none" aria-label="Winner">👑</span>
      )}
    </div>
  );
}

function DualProgressBar({ myPct, theirPct, isMe }: { myPct: number; theirPct: number; isMe: "challenger" | "opponent" }) {
  const nudePct  = isMe === "challenger" ? myPct    : theirPct;
  const slatePct = isMe === "challenger" ? theirPct : myPct;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[9px] font-bold"
          style={{ background: "linear-gradient(135deg, #f0d8ce, #e8c4b8)", color: "#9a6050" }}>
          Me
        </div>
        <div className="flex-1 h-2.5 bg-theme-surface rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width:      `${nudePct}%`,
              background: "linear-gradient(90deg, #e8a898, #d4786a)",
            }}
          />
        </div>
        <span className="font-body text-xs font-bold text-theme-text w-10 text-right">
          {nudePct.toFixed(0)}%
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[9px] font-bold bg-slate-100 text-slate-500">
          🤝
        </div>
        <div className="flex-1 h-2.5 bg-theme-surface rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700 bg-slate-300" style={{ width: `${slatePct}%` }} />
        </div>
        <span className="font-body text-xs font-bold text-slate-500 w-10 text-right">
          {slatePct.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function DaysRing({ daysRemaining }: { daysRemaining: number }) {
  const total    = 7;
  const elapsed  = total - daysRemaining;
  const progress = elapsed / total;
  const r        = 16;
  const circ     = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90" aria-hidden>
          <circle cx="24" cy="24" r={r} fill="none" stroke="#f0d8ce" strokeWidth="4" />
          <circle cx="24" cy="24" r={r} fill="none" stroke="#d4786a" strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - progress)}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <span className="absolute font-display text-sm font-bold text-theme-text">
          {daysRemaining}
        </span>
      </div>
      <span className="font-body text-[9px] text-theme-muted uppercase tracking-wider">
        {daysRemaining === 1 ? "day left" : "days left"}
      </span>
    </div>
  );
}

interface Props {
  challenge: Challenge;
  myId: string;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Challenge>) => void;
}

export default function ChallengeCard({ challenge, myId, onRemove, onUpdate }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const isChallenger  = challenge.challengerId === myId;
  const myName        = isChallenger ? challenge.challengerName : challenge.opponentName;
  const theirName     = isChallenger ? challenge.opponentName : challenge.challengerName;
  const myRole        = isChallenger ? "challenger" : "opponent";

  useEffect(() => {
    if (challenge.status === "pending") return;

    let cancelled = false;
    getChallengeLeaderboard(challenge.id).then((r) => {
      if (cancelled || !r) return;
      setResult(r);
      if (r.status === "completed" && challenge.status !== "completed") {
        onUpdate(challenge.id, {
          status:   "completed",
          winnerId: r.winnerId ?? undefined,
        });
      }
    });
    return () => { cancelled = true; };
  }, [challenge.id, challenge.status, onUpdate]);

  const showMsg = (text: string) => {
    setActionMsg(text);
    setTimeout(() => setActionMsg(null), 4000);
  };

  const handleAccept = () => {
    startTransition(async () => {
      const res = await acceptChallenge(challenge.id);
      if (res.ok) {
        onUpdate(challenge.id, { status: "active" });
      } else {
        showMsg(res.error ?? "Failed to accept challenge");
      }
    });
  };

  const handleDecline = () => {
    startTransition(async () => {
      const res = await declineChallenge(challenge.id);
      if (res.ok) {
        onRemove(challenge.id);
      } else {
        showMsg(res.error ?? "Failed to decline challenge");
      }
    });
  };

  const myPct    = result ? (isChallenger ? result.challengerPct : result.opponentPct) : 0;
  const theirPct = result ? (isChallenger ? result.opponentPct : result.challengerPct) : 0;

  const iWon    = challenge.status === "completed" && challenge.winnerId === myId;
  const theyWon = challenge.status === "completed" && challenge.winnerId !== myId && challenge.winnerId !== null;

  const startFormatted = challenge.startDate ? new Date(challenge.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : null;
  const endFormatted   = challenge.endDate   ? new Date(challenge.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : null;

  return (
    <div className={`rounded-3xl border overflow-hidden transition-all duration-300 ${challenge.status === "completed" ? iWon ? "border-amber-200 bg-gradient-to-br from-amber-50/60 to-white" : "border-theme-border bg-theme-surface" : challenge.status === "active" ? "border-theme-border bg-theme-surface" : "border-theme-border bg-theme-surface"} shadow-sm`}>
      <div className="px-4 py-3 border-b border-nude-50 flex items-center justify-between gap-3"
        style={{ background: challenge.status === "completed" && iWon ? "linear-gradient(135deg, #fef9e7, #fdf0d0)" : "linear-gradient(135deg, #fdf0ea, #f5e2d8)" }}>
        <div>
          <span className={`inline-flex items-center font-body text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${challenge.status === "active" ? "bg-green-50 border-green-200 text-green-700" : challenge.status === "pending" ? "bg-amber-50 border-amber-200 text-amber-700" : iWon ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-theme-bg border-theme-border text-theme-muted"}`}>
            {challenge.status === "active" ? "⚡ Active" : challenge.status === "pending" ? "⏳ Pending" : iWon ? "🏆 You won!" : theyWon ? "🌸 Completed" : "Completed"}
          </span>
          <p className="font-body text-xs text-theme-muted mt-1">
            7-day prayer challenge{startFormatted && endFormatted ? ` · ${startFormatted} – ${endFormatted}` : ""}
          </p>
        </div>
        {challenge.status === "active" && result && <DaysRing daysRemaining={result.daysRemaining} />}
      </div>

      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-4">
        <div className="flex flex-col items-center gap-1.5 text-center min-w-0">
          <Avatar name={myName} size={44} isWinner={challenge.status === "completed" && iWon} />
          <div>
            <p className="font-body text-xs font-bold text-theme-text truncate max-w-[72px]">{myName}</p>
            <p className="font-body text-[9px] text-theme-muted">(you)</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center pt-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-display text-xs font-bold text-theme-muted border border-theme-border" style={{ background: "linear-gradient(135deg, #fdf0ea, #ecddd6)" }}>
            vs
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 text-center min-w-0">
          <Avatar name={theirName} size={44} isWinner={challenge.status === "completed" && theyWon} />
          <div>
            <p className="font-body text-xs font-bold text-theme-text truncate max-w-[72px]">{theirName}</p>
            {!isChallenger && challenge.status === "pending" && (
              <p className="font-body text-[9px] text-theme-muted">challenged you</p>
            )}
          </div>
        </div>
      </div>

      {challenge.status !== "pending" && result && (
        <div className="px-4 pb-3">
          <DualProgressBar myPct={myPct} theirPct={theirPct} isMe={myRole} />
        </div>
      )}

      {challenge.status === "completed" && result && (
        <div className={`mx-4 mb-3 rounded-2xl px-4 py-3 border ${iWon ? "bg-amber-50 border-amber-100" : "bg-theme-bg border-theme-border"}`}>
          <p className={`font-body text-sm font-bold text-center ${iWon ? "text-amber-700" : "text-theme-text"}`}>
            {iWon ? `You won! 🏆 +50 pts awarded` : theyWon ? `${theirName} won this round 🌸 +20 pts for participating` : "It was a tie! 🤝"}
          </p>
          <p className="font-body text-xs text-center text-theme-muted mt-0.5">
            Your score: {myPct.toFixed(1)}% · Theirs: {theirPct.toFixed(1)}%
          </p>
        </div>
      )}

      {actionMsg && (
        <div className="mx-4 mb-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-2 text-center">
          <p className="font-body text-xs text-red-500">{actionMsg}</p>
        </div>
      )}

      {challenge.status === "pending" && !isChallenger && (
        <div className="px-4 pb-4 flex gap-2">
          <button onClick={handleDecline} disabled={isPending} className="flex-1 py-2.5 rounded-2xl font-body text-sm font-bold bg-theme-surface text-theme-muted border border-theme-border hover:bg-nude-200 disabled:opacity-60 active:scale-95 transition-all touch-manipulation">
            Decline
          </button>
          <button onClick={handleAccept} disabled={isPending} className="flex-1 py-2.5 rounded-2xl font-body text-sm font-bold text-white disabled:opacity-60 active:scale-95 transition-all touch-manipulation shadow-sm hover:opacity-90" style={{ background: "linear-gradient(to right, #e8a898, #d4786a)" }}>
            {isPending ? "Accepting…" : "Accept ⚡"}
          </button>
        </div>
      )}

      {challenge.status === "pending" && isChallenger && (
        <div className="px-4 pb-4">
          <div className="py-2.5 rounded-2xl bg-theme-bg border border-dashed border-theme-border text-center">
            <p className="font-body text-xs text-theme-muted">Waiting for {theirName} to accept…</p>
          </div>
        </div>
      )}

      {challenge.status === "active" && (
        <div className="px-4 pb-4">
          <div className="py-2.5 rounded-2xl text-center border border-theme-border" style={{ background: "linear-gradient(135deg, #fdf0ea, #ecddd6)" }}>
            <p className="font-body text-xs font-bold text-theme-text">
              {result ? myPct > theirPct ? `You're leading by ${(myPct - theirPct).toFixed(0)}% 🔥` : myPct < theirPct ? `${theirName} is ahead — keep going! 💪` : "You're tied — every prayer counts! 🌸" : "Logging prayers daily…"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
