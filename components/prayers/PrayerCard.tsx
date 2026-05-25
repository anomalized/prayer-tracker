"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { markPrayer, saveNote } from "@/lib/actions/prayers";
import { checkAndAwardBadges } from "@/lib/actions/badges";
import { isPrayerTimePassed } from "@/lib/prayerTimes";
import { queuePrayerLog } from "@/lib/offlineQueue";
import type { PrayerTime, PrayerStatus } from "@/types";


interface Props {
  userId: string;
  prayer: PrayerTime;
  currentStatus: PrayerStatus | null;
  currentNote: string | null;
  index: number;
  onPointsEarned: (points: number) => void;
}

export default function PrayerCard({ userId, prayer, currentStatus, currentNote, index, onPointsEarned }: Props) {
  const [status, setStatus] = useState<PrayerStatus | null>(currentStatus);
  const [note, setNote] = useState(currentNote ?? "");
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();


  const timePassed = isPrayerTimePassed(prayer.time);
  const isDone = status === "ontime" || status === "late";

  useEffect(() => {
    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [router]);

  const showToast = useCallback((message: string, duration = 900) => {
    setToast(message);
    window.setTimeout(() => setToast(null), duration);
  }, []);

  const handleMark = (newStatus: PrayerStatus) => {
    if (!timePassed) return;

    const previousStatus = status;
    setStatus(newStatus);

    const points = newStatus === "ontime" ? 20 : newStatus === "late" ? 10 : 0;
    const previousPoints = previousStatus === "ontime" ? 20 : previousStatus === "late" ? 10 : 0;
    const diff = points - previousPoints;
    if (diff > 0) {
      showToast(`+${diff} pts`);
      onPointsEarned(diff);
    }

    if (typeof navigator === "undefined" || navigator.onLine) {
      startTransition(async () => {
        const result = await markPrayer(prayer.name, newStatus, previousStatus);
        if (result?.error) {
          setStatus(previousStatus);
          if (diff > 0) onPointsEarned(-diff);
          showToast(result.error, 1800);
          return;
        }
        await checkAndAwardBadges();
        router.refresh();
      });
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    startTransition(async () => {
      try {
        await queuePrayerLog(userId, prayer.name, newStatus, previousStatus, today);
        showToast("Saved offline 🌙");
      } catch {
        setStatus(previousStatus);
        if (diff > 0) onPointsEarned(-diff);
        showToast("Could not save offline", 1800);
      }
    });
  };



  return (
    <>
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-theme-surface shadow-[0_20px_70px_rgba(0,0,0,0.06)]">

        <div className="relative p-5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl shadow-lg" style={{ background: "var(--btn-gradient)" }}>
              <span className="text-2xl">{prayer.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-display text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{prayer.name}</p>
                <span className="rounded-full bg-theme-surface/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/75">
                  {status ?? "Pending"}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{prayer.arabic}</p>
              <p className="text-xs mt-2 font-body" style={{ color: "var(--color-text-muted)" }}>{prayer.time}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleMark("ontime")}
              disabled={!timePassed || isPending}
              className="rounded-3xl py-3 text-xs font-bold uppercase tracking-[0.18em] transition-transform active:scale-95 disabled:cursor-not-allowed"
              style={status === "ontime" ? { background: "var(--btn-gradient)", color: "#fff" } : { background: "rgba(255,255,255,0.04)", color: "var(--color-text-primary)" }}
            >
              On time
            </button>
            <button
              type="button"
              onClick={() => handleMark("late")}
              disabled={!timePassed || isPending}
              className="rounded-3xl py-3 text-xs font-bold uppercase tracking-[0.18em] transition-transform active:scale-95 disabled:cursor-not-allowed"
              style={status === "late" ? { background: "rgba(255,185,95,0.16)", color: "var(--color-text-primary)" } : { background: "rgba(255,255,255,0.04)", color: "var(--color-text-muted)" }}
            >
              Late
            </button>
            <button
              type="button"
              onClick={() => handleMark("missed")}
              disabled={!timePassed || isPending}
              className="rounded-3xl py-3 text-xs font-bold uppercase tracking-[0.18em] transition-transform active:scale-95 disabled:cursor-not-allowed"
              style={status === "missed" ? { background: "rgba(255,80,80,0.14)", color: "var(--color-accent)" } : { background: "rgba(255,255,255,0.04)", color: "var(--color-text-muted)" }}
            >
              Missed
            </button>
          </div>

          {note && (
            <div className="rounded-3xl border border-white/10 bg-theme-surface/5 p-4 text-sm italic" style={{ color: "var(--color-text-secondary)" }}>
              “{note}”
            </div>
          )}

          {!timePassed && (
            <p className="text-center text-xs font-body uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>
              Prayer time hasn't arrived yet
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/today/reflection/${prayer.name}`)}
              className="flex-1 rounded-3xl border border-white/10 bg-theme-surface/5 py-3 text-sm font-semibold transition-all hover:border-white/20"
              style={{ color: "var(--color-text-primary)" }}
            >
              {note ? "Edit reflection" : "Write reflection"}
            </button>
            <div className="rounded-3xl px-4 py-3 text-xs font-bold uppercase tracking-[0.18em]" style={{ background: "rgba(255,255,255,0.05)", color: "var(--color-text-secondary)" }}>
              {isDone ? "Completed" : timePassed ? "Ready" : "Upcoming"}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,380px)] -translate-x-1/2 rounded-3xl border border-white/10 bg-black/80 px-4 py-3 text-center text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}


    </>
  );
}
