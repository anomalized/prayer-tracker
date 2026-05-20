"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { markPrayer, saveNote } from "@/lib/actions/prayers";
import { checkAndAwardBadges } from "@/lib/actions/badges";
import { isPrayerTimePassed } from "@/lib/prayerTimes";
import { queuePrayerLog } from "@/lib/offlineQueue";
import type { PrayerTime, PrayerStatus } from "@/types";

interface Props {
  prayer: PrayerTime;
  currentStatus: PrayerStatus | null;
  currentNote: string | null;
  index: number;
  onPointsEarned: (points: number) => void;
}

export default function PrayerCard({ prayer, currentStatus, currentNote, index, onPointsEarned }: Props) {
  const [status, setStatus]       = useState<PrayerStatus | null>(currentStatus);
  const [animateStatus, setAnimateStatus] = useState<PrayerStatus | null>(null);
  const [note, setNote]           = useState(currentNote ?? "");
  const [showNote, setShowNote]   = useState(false);
  const [toast, setToast]         = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const timePassed = isPrayerTimePassed(prayer.time);

  // Refresh data when user returns from reflection page
  useEffect(() => {
    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [router]);

  // ── showToast helper ──────────────────────────────────────────────────────
  const showToast = useCallback((msg: string, durationMs = 900) => {
    setToast(msg);
    setTimeout(() => setToast(null), durationMs);
  }, []);

  // ── handleMark ────────────────────────────────────────────────────────────
  // Changed: checks navigator.onLine before deciding to queue or call server.
  const handleMark = (newStatus: PrayerStatus) => {
    if (!timePassed) return;

    const prev = status;
    setStatus(newStatus);   // optimistic — always immediate
    if (newStatus !== prev) {
      setAnimateStatus(newStatus);
    }

    // Points feedback (same as before)
    const points     = newStatus === "ontime" ? 20 : newStatus === "late" ? 10 : 0;
    const prevPoints = prev    === "ontime"   ? 20 : prev    === "late"   ? 10 : 0;
    const diff = points - prevPoints;
    if (diff > 0) {
      showToast(`+${diff} pts`);
      onPointsEarned(diff);
    }

    // ── Online path — unchanged behaviour ────────────────────────────────────
    if (typeof navigator === "undefined" || navigator.onLine) {
      startTransition(async () => {
        await markPrayer(prayer.name, newStatus, prev);
        await checkAndAwardBadges();
        router.refresh();
      });
      return;
    }

    // ── Offline path — queue and show feedback ────────────────────────────────
    const today = new Date().toISOString().split("T")[0];

    startTransition(async () => {
      try {
        await queuePrayerLog(prayer.name, newStatus, prev, today);
        // Show offline toast — overrides the points toast if both would fire
        showToast("saved offline 🔌", 2200);
      } catch {
        // Queue write failed (e.g. IndexedDB unavailable) — roll back
        setStatus(prev);
        showToast("save failed", 1500);
      }
    });
  };

  const handleSaveNote = () => {
    startTransition(async () => {
      await saveNote(prayer.name, note);
      setShowNote(false);
    });
  };

  const isDone = status !== null;

  return (
    <>
      <div
        className={`relative rounded-3xl border p-4 transition-all duration-200 animate-fade-up delay-${index + 1}
          ${isDone
            ? "bg-gradient-to-br from-nude-100 to-nude-200 border-nude-300 shadow-sm"
            : "bg-white border-nude-100"
          }`}
      >
        {/* Floating toast — now handles both points and offline messages */}
        {toast && (
          <div
            className={`absolute top-3 right-3 font-bold text-sm
              animate-float-up pointer-events-none
              ${toast.startsWith("saved offline") || toast.startsWith("Saved offline")
                ? "text-amber-500"   // amber for offline
                : "text-nude-600"    // terracotta for points
              }`}
          >
            {toast}
          </div>
        )}

        {/* Header row */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0
            ${isDone ? "bg-gradient-to-br from-nude-300 to-nude-400" : "bg-nude-100"}`}>
            {prayer.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl font-bold text-nude-800">{prayer.name}</span>
              <span className="text-xs text-nude-400 font-body">{prayer.arabic}</span>
            </div>
            <span className="text-xs text-nude-500 font-body">{prayer.time}</span>
          </div>
          {isDone && status !== "missed" && (
            <button
              onClick={() => router.push(`/dashboard/today/reflection/${encodeURIComponent(prayer.name)}`)}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center text-sm transition-colors
                ${currentNote ? "bg-nude-200 border-nude-300" : "bg-white border-nude-200 hover:border-nude-300"}`}
            >
              {currentNote ? "📝" : "✍️"}
            </button>
          )}
        </div>

        {/* Status buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleMark("ontime")}
            disabled={!timePassed || isPending}
            aria-label="Mark prayer on time"
            className={`flex-1 py-2.5 rounded-2xl text-xs font-bold tracking-wide transition-all active:scale-95
              ${!timePassed
                ? "bg-nude-50 text-nude-300 cursor-not-allowed"
                : status === "ontime"
                  ? "bg-gradient-to-r from-nude-400 to-nude-500 text-white shadow-sm"
                  : "bg-nude-100 text-nude-600 hover:bg-nude-200"
              }`}
          >
            <span className="inline-flex items-center justify-center w-full h-full">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-5 h-5 ${animateStatus === "ontime" && status === "ontime" ? "animate-draw-check" : ""}`}
                onAnimationEnd={() => animateStatus === "ontime" && setAnimateStatus(null)}
              >
                <path d="M6 12.5l4 4 8-8" />
              </svg>
            </span>
          </button>
          <button
            onClick={() => handleMark("late")}
            disabled={!timePassed || isPending}
            aria-label="Mark prayer late"
            className={`flex-1 py-2.5 rounded-2xl text-xs font-bold tracking-wide transition-all active:scale-95
              ${!timePassed
                ? "bg-nude-50 text-nude-300 cursor-not-allowed"
                : status === "late"
                  ? "bg-nude-300 text-nude-800"
                  : "bg-nude-100 text-nude-400 hover:bg-nude-200"
              }`}
          >
            <span className="inline-flex items-center justify-center w-full h-full">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <circle cx="12" cy="12" r="8" />
                <path
                  d="M12 12l0-4"
                  className={animateStatus === "late" && status === "late" ? "origin-center animate-clock-spin" : ""}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  onAnimationEnd={() => animateStatus === "late" && setAnimateStatus(null)}
                />
              </svg>
            </span>
          </button>
          <button
            onClick={() => handleMark("missed")}
            disabled={!timePassed || isPending}
            aria-label="Mark prayer missed"
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold tracking-wide transition-all active:scale-95
              ${!timePassed
                ? "bg-nude-50 text-nude-300 cursor-not-allowed"
                : status === "missed"
                  ? "bg-red-100 text-red-400"
                  : "bg-nude-100 text-nude-300 hover:bg-nude-200"
              }`}
          >
            <span className="inline-flex items-center justify-center w-full h-full">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
                onAnimationEnd={() => animateStatus === "missed" && setAnimateStatus(null)}
              >
                <path
                  d="M7 7l10 10"
                  className={animateStatus === "missed" && status === "missed" ? "animate-draw-x-line1" : ""}
                />
                <path
                  d="M17 7l-10 10"
                  className={animateStatus === "missed" && status === "missed" ? "animate-draw-x-line2" : ""}
                />
              </svg>
            </span>
          </button>
        </div>

        {/* Note preview */}
        {note && !showNote && (
          <p className="mt-2 text-xs text-nude-500 italic pl-1 font-body">"{note}"</p>
        )}

        {/* Not yet available */}
        {!timePassed && (
          <p className="mt-2 text-center text-xs text-nude-300 font-body">
            Prayer time hasn't arrived yet
          </p>
        )}
      </div>

      {/* Note modal */}
      {showNote && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(122,64,53,0.15)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowNote(false)}
        >
          <div
            className="bg-nude-50 rounded-t-3xl w-full max-w-md p-6 pb-10 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <p className="font-display text-2xl font-bold text-nude-800 mb-1">
              📝 After {prayer.name}
            </p>
            <p className="text-xs text-nude-500 font-body mb-4">A dua, a thought, a gratitude...</p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What's on your heart?"
              className="w-full min-h-[100px] bg-white border border-nude-200 rounded-2xl p-4 text-nude-800 font-display text-base resize-none focus:outline-none focus:border-nude-400 transition-colors"
            />
            <button
              onClick={handleSaveNote}
              disabled={isPending}
              className="w-full mt-3 py-3.5 rounded-2xl bg-gradient-to-r from-nude-400 to-nude-500 text-white font-bold text-sm tracking-wide active:scale-95 transition-transform disabled:opacity-60"
            >
              Save Reflection 🌸
            </button>
          </div>
        </div>
      )}
    </>
  );
}