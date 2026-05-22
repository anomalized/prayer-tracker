"use client";

import { useState, useTransition } from "react";
import { sendFriendRequest } from "@/lib/actions/friends";

export default function AddFriendForm() {
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    startTransition(async () => {
      const result = await sendFriendRequest(email);
      if (result.error) {
        setMessage({ text: result.error, ok: false });
      } else {
        setMessage({ text: `Request sent to ${result.name}! 🌸`, ok: true });
        setEmail("");
      }
      setTimeout(() => setMessage(null), 4000);
    });
  };

  return (
    <div className="bg-theme-surface border border-theme-border rounded-3xl p-4 shadow-sm">
      <p className="font-display text-lg font-bold text-theme-text mb-1">Add a Friend</p>
      <p className="font-body text-xs text-theme-muted mb-4">
        Enter their email address to send a friend request
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="friend@email.com"
          required
          className="flex-1 bg-theme-bg border border-theme-border rounded-2xl px-4 py-2.5 text-theme-text text-sm placeholder-nude-300 focus:outline-none focus:border-nude-400 transition-colors font-body"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2.5 bg-gradient-to-r from-nude-400 to-nude-500 text-white rounded-2xl text-sm font-bold font-body disabled:opacity-60 active:scale-95 transition-transform whitespace-nowrap"
        >
          {isPending ? "..." : "Send 🌸"}
        </button>
      </form>
      {message && (
        <p className={`mt-3 text-xs font-body text-center rounded-xl py-2 px-3
          ${message.ok ? "bg-green-50 text-green-600" : "bg-red-50 text-red-400"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
