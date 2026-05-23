"use client";

import { useState, useTransition } from "react";
import { sendChallenge } from "@/lib/actions/challenges";
import type { Challenge } from "@/lib/actions/challenges";

interface Friend {
  id: string;
  name: string;
}

interface Props {
  friends: Friend[];
  myId: string;
  onSent: (challenge: Challenge) => void;
}

export default function ChallengeSender({ friends, myId, onSent }: Props) {
  const [selected, setSelected] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const showMsg = (text: string, ok: boolean) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSend = () => {
    if (!selected || isPending) return;
    startTransition(async () => {
      const result = await sendChallenge(selected);
      if (result.ok) {
        const friend = friends.find((f) => f.id === selected);
        onSent({
          id:             result.challengeId ?? `temp-${Date.now()}`,
          challengerId:   myId,
          opponentId:     selected,
          status:         "pending",
          startDate:      null,
          endDate:        null,
          winnerId:       null,
          pointsAwarded:  false,
          createdAt:      new Date().toISOString(),
          challengerName: "You",
          opponentName:   friend?.name ?? "Friend",
        });
        setSelected("");
        showMsg(`Challenge sent to ${friend?.name ?? "friend"}! ⚡`, true);
      } else {
        showMsg(result.error ?? "Failed to send challenge", false);
      }
    });
  };

  if (friends.length === 0) return null;

  return (
    <div className="px-4 pb-4 pt-2 border-t border-nude-50">
      <p className="font-body text-xs font-bold tracking-widest text-theme-muted uppercase mb-2">
        Send a challenge
      </p>
      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="flex-1 appearance-none bg-theme-bg border border-theme-border rounded-2xl px-3 py-2.5 font-body text-sm text-theme-text focus:outline-none focus:border-nude-400 transition-colors"
        >
          <option value="">Choose a friend…</option>
          {friends.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <button
          onClick={handleSend}
          disabled={!selected || isPending}
          className="px-4 py-2.5 rounded-2xl font-body text-sm font-bold text-white disabled:opacity-50 active:scale-95 transition-all touch-manipulation"
          style={{ background: "var(--btn-gradient)" }}
        >
          {isPending ? "…" : "⚡"}
        </button>
      </div>
      {message && (
        <p className={`font-body text-xs mt-2 text-center ${message.ok ? "text-green-600" : "text-red-400"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
