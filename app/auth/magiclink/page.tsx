"use client";

import { useState } from "react";
import Link from "next/link";
import { sendMagicLink } from "@/lib/actions/auth";

export default function MagicLinkPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"initial" | "loading" | "sent" | "error">("initial");
  const [message, setMessage] = useState("");

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setMessage("");

    if (!email || !email.includes("@")) {
      setState("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    const result = await sendMagicLink(email);

    if (result.success) {
      setState("sent");
      setMessage(result.message || "Magic link sent! Check your email.");
    } else {
      setState("error");
      setMessage(result.error || "Failed to send magic link. Please try again.");
    }
  };

  // ── Sent confirmation screen ──────────────────────────────
  if (state === "sent") {
    return (
      <div className="animate-fade-up text-center">
        <p className="text-5xl mb-5">✨</p>
        <h1 className="font-display text-3xl font-bold text-nude-800 mb-3">
          Check your email!
        </h1>
        <div className="bg-white rounded-3xl shadow-sm border border-nude-200 p-6 mb-4">
          <p className="font-body text-sm text-nude-600 leading-relaxed mb-4">
            We sent a magic link to:
          </p>
          <p className="font-body text-base font-bold text-nude-800 bg-nude-50 rounded-2xl py-2 px-4 mb-4">
            {email}
          </p>
          <p className="font-body text-sm text-nude-500 leading-relaxed">
            Click the link in that email to sign in instantly. No password needed! Check your spam folder if you don't see it.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              setState("initial");
              setEmail("");
            }}
            className="w-full bg-gradient-to-r from-nude-400 to-nude-500 text-white font-bold text-sm tracking-wide py-3.5 rounded-2xl hover:opacity-90 active:scale-95 transition-transform"
          >
            Send to different email
          </button>
          <p className="text-center text-sm text-nude-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-nude-700 font-bold underline underline-offset-2">
              Sign in with password
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Magic link request form ──────────────────────────────
  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-3xl mb-3">🔮</p>
        <h1 className="font-display text-4xl font-bold text-nude-800 mb-2">
          Sign in with Magic Link
        </h1>
        <p className="text-nude-600 text-sm">No password needed—we'll send you a secure link</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-nude-200 p-7">
        <form onSubmit={handleSendMagicLink} className="space-y-4">
          <div>
            <label className="block text-xs font-bold tracking-widest text-nude-600 uppercase mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setState("initial");
              }}
              placeholder="you@example.com"
              required
              className="w-full bg-nude-50 border border-nude-200 rounded-2xl px-4 py-3 text-nude-800 text-sm placeholder-nude-300 focus:outline-none focus:border-nude-400 transition-colors"
            />
          </div>

          {(message && state === "error") && (
            <p className="text-red-400 text-xs text-center bg-red-50 rounded-xl py-2 px-3">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={state === "loading"}
            className="w-full bg-gradient-to-r from-nude-400 to-nude-500 text-white font-bold text-sm tracking-wide py-3.5 rounded-2xl mt-2 disabled:opacity-60 hover:opacity-90 active:scale-95 transition-transform"
          >
            {state === "loading" ? "Sending link..." : "Send Magic Link 🔮"}
          </button>
        </form>

        <p className="text-center text-sm text-nude-500 mt-5">
          Prefer a password?{" "}
          <Link href="/auth/login" className="text-nude-700 font-bold underline underline-offset-2">
            Sign in instead
          </Link>
        </p>
      </div>
    </div>
  );
}
