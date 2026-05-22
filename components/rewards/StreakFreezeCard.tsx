"use client";

import { useState, useTransition } from "react";
import { purchaseStreakFreeze }     from "@/lib/actions/stats";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FREEZES   = 3;
const FREEZE_COST   = 100;

function ShieldIcon({
  filled,
  size = 28,
}: {
  filled: boolean;
  size?:  number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" />
    </svg>
  );
}

interface Props {
  freezeCount:  number;
  totalPoints:  number;
  currentStreak: number;
}

export default function StreakFreezeCard({
  freezeCount:  initialFreezeCount,
  totalPoints:  initialPoints,
  currentStreak,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const [freezeCount, setFreezeCount] = useState(initialFreezeCount);
  const [points,      setPoints]      = useState(initialPoints);

  const [message, setMessage] = useState<{
    text:  string;
    kind:  "success" | "error" | "info";
  } | null>(null);

  const [justPurchased, setJustPurchased] = useState(false);

  const showMsg = (
    text: string,
    kind: "success" | "error" | "info",
    durationMs = 4000
  ) => {
    setMessage({ text, kind });
    setTimeout(() => setMessage(null), durationMs);
  };

  const canAfford   = points >= FREEZE_COST;
  const atMax       = freezeCount >= MAX_FREEZES;
  const buttonDisabled = isPending || atMax || !canAfford;

  const handlePurchase = () => {
    if (buttonDisabled) return;

    const prevFreeze = freezeCount;
    const prevPoints = points;
    setFreezeCount((c) => c + 1);
    setPoints((p) => p - FREEZE_COST);

    startTransition(async () => {
      const result = await purchaseStreakFreeze();

      if (!result.ok) {
        setFreezeCount(prevFreeze);
        setPoints(prevPoints);

        if (result.error === "insufficient_points") {
          showMsg(
            `You need ${result.pointsNeeded} more points to buy a freeze.`,
            "error"
          );
        } else if (result.error === "max_freezes_reached") {
          showMsg("You already have the maximum of 3 freezes.", "info");
        } else {
          showMsg("Something went wrong. Please try again.", "error");
        }
        return;
      }

      setFreezeCount(result.newFreezeCount);
      setPoints(result.newPoints);
      setJustPurchased(true);
      setTimeout(() => setJustPurchased(false), 2000);
      showMsg("Streak freeze purchased! Your streak is protected. 🛡️", "success");
    });
  };

  const msgStyle = {
    success: "bg-green-50 border-green-100 text-green-700",
    error:   "bg-red-50 border-red-100 text-red-500",
    info:    "bg-theme-bg border-theme-border text-theme-text",
  } as const;

  return (
    <div
      className={`rounded-3xl border overflow-hidden transition-all duration-300
        ${justPurchased
          ? "border-green-200 bg-gradient-to-br from-green-50 to-white"
          : "border-theme-border bg-theme-surface"
        } shadow-sm`}
    >
      <div
        className="px-5 py-4 border-b border-nude-50"
        style={{ background: "linear-gradient(135deg, #fdf0ea, #f5e2d8)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center
              flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #e8c4b8, #d4786a)" }}
          >
            <span className="text-white" style={{ color: "white" }}>
              <ShieldIcon filled size={22} />
            </span>
          </div>
          <div>
            <p className="font-display text-base font-bold text-theme-text">
              Streak Freeze
            </p>
            <p className="font-body text-xs text-theme-muted">
              Protect your streak for one missed day
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <p className="font-body text-[10px] font-bold tracking-widest
            text-theme-muted uppercase">
            Your freezes
          </p>
          <p className="font-body text-xs text-theme-muted">
            {freezeCount} / {MAX_FREEZES}
          </p>
        </div>

        <div className="flex items-center gap-3 mb-1">
          {Array.from({ length: MAX_FREEZES }).map((_, i) => {
            const isFilled    = i < freezeCount;
            const isNewlyFilled = justPurchased && i === freezeCount - 1;
            return (
              <div
                key={i}
                className={`transition-all duration-500
                  ${isFilled
                    ? isNewlyFilled
                      ? "text-green-500 scale-125"
                      : "text-theme-muted"
                    : "text-nude-200"
                  }`}
              >
                <ShieldIcon filled={isFilled} size={32} />
              </div>
            );
          })}

          <div className="ml-auto flex items-center gap-1.5 bg-theme-bg
            border border-theme-border rounded-full px-3 py-1.5">
            <span className="text-sm" aria-hidden>⭐</span>
            <span className="font-body text-sm font-bold text-theme-text">
              {points.toLocaleString()}
            </span>
            <span className="font-body text-xs text-theme-muted">pts</span>
          </div>
        </div>

        <p className="font-body text-xs text-theme-muted mt-1 leading-relaxed">
          {freezeCount === 0
            ? "Buy a freeze to protect your streak if you miss a day of prayers."
            : freezeCount === MAX_FREEZES
              ? "You have the maximum number of freezes. Use them wisely! 🛡️"
              : `You have ${freezeCount} freeze${freezeCount > 1 ? "s" : ""}. ` +
                `Each protects you for one missed day.`
          }
        </p>
      </div>

      <div className="mx-4 mb-4 bg-theme-bg border border-theme-border rounded-2xl
        px-4 py-3 space-y-2">
        <p className="font-body text-[10px] font-bold tracking-widest
          text-theme-muted uppercase">
          How it works
        </p>
        {[
          { icon: "🛡️", text: "Buy a freeze for 100 points (max 3 at a time)" },
          { icon: "😴", text: "Miss a day of prayers — freeze auto-activates" },
          { icon: "🔥", text: "Your streak is preserved for that missed day" },
          { icon: "⚠️", text: "Only works for a gap of 1 day — not consecutive misses" },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-start gap-2">
            <span className="text-sm flex-shrink-0 mt-0.5" aria-hidden>
              {icon}
            </span>
            <p className="font-body text-xs text-theme-text leading-relaxed">
              {text}
            </p>
          </div>
        ))}
      </div>

      {currentStreak > 0 && (
        <div className="mx-4 mb-4 flex items-center gap-3 bg-theme-surface
          rounded-2xl px-4 py-3">
          <span className="text-xl" aria-hidden>🔥</span>
          <div>
            <p className="font-body text-sm font-bold text-theme-text">
              {currentStreak}-day streak active
            </p>
            <p className="font-body text-xs text-theme-muted">
              {freezeCount > 0
                ? `Protected by ${freezeCount} freeze${freezeCount > 1 ? "s" : ""}`
                : "Not protected — buy a freeze to guard it"}
            </p>
          </div>
          {freezeCount > 0 && (
            <div className="ml-auto text-theme-muted">
              <ShieldIcon filled size={20} />
            </div>
          )}
        </div>
      )}

      {message && (
        <div
          className={`mx-4 mb-4 rounded-2xl px-4 py-2.5 border
            font-body text-xs text-center transition-all
            ${msgStyle[message.kind]}`}
        >
          {message.text}
        </div>
      )}

      <div className="px-4 pb-5">
        <button
          onClick={handlePurchase}
          disabled={buttonDisabled}
          aria-label={
            atMax
              ? "Maximum freezes reached"
              : !canAfford
                ? `Not enough points. Need ${FREEZE_COST - points} more.`
                : `Buy streak freeze for ${FREEZE_COST} points`
          }
          className={`w-full py-3.5 rounded-2xl font-body text-sm font-bold
            tracking-wide transition-all active:scale-95 touch-manipulation
            disabled:cursor-not-allowed
            ${atMax
              ? "bg-theme-surface text-theme-muted border border-theme-border"
              : !canAfford
                ? "bg-theme-bg text-theme-muted/70 border border-theme-border"
                : isPending
                  ? "opacity-70 text-white"
                  : "text-white shadow-sm hover:shadow-md hover:opacity-90"
            }`}
          style={
            !atMax && canAfford && !isPending
              ? { background: "linear-gradient(to right, #e8a898, #d4786a)" }
              : {}
          }
        >
          {isPending
            ? "Purchasing…"
            : atMax
              ? "Maximum freezes held 🛡️"
              : !canAfford
                ? `Need ${FREEZE_COST - points} more points`
                : `Buy Freeze · ${FREEZE_COST} pts 🛡️`
          }
        </button>

        {!canAfford && !atMax && (
          <p className="text-center font-body text-xs text-theme-muted/70 mt-2">
            Earn points by logging prayers on time
          </p>
        )}
      </div>
    </div>
  );
}
