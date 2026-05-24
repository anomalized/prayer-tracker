"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    startTransition(async () => {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      // Insert into profiles table
      if (data.user) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: name,
          email,
        });
      }

      // Check if email confirmation is required
      // If session is null but user exists, confirmation email was sent
      if (data.user && !data.session) {
        setConfirmed(true); // show "check your email" screen
        return;
      }

      // If session exists, go straight in (email confirmation is off)
      window.location.href = "/dashboard/today";
    });
  };

  // ── Check your email screen ──────────────────────────────
  if (confirmed) {
    return (
      <div className="animate-fade-up text-center">
        <p className="text-5xl mb-5">📬</p>
        <h1 className="font-display text-3xl font-bold text-nude-800 mb-3">
          Check your email!
        </h1>
        <div className="bg-white rounded-3xl shadow-sm border border-nude-200 p-6 mb-4">
          <p className="font-body text-sm text-nude-600 leading-relaxed mb-4">
            We sent a confirmation link to:
          </p>
          <p className="font-body text-base font-bold text-nude-800 bg-nude-50 rounded-2xl py-2 px-4 mb-4">
            {email}
          </p>
          <p className="font-body text-sm text-nude-500 leading-relaxed">
            Click the link in that email to activate your account, then come back here to sign in. Check your spam folder if you don't see it!
          </p>
        </div>
        <p className="text-center text-sm text-nude-500">
          Already confirmed?{" "}
          <Link href="/auth/login" className="text-nude-700 font-bold underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  // ── Signup form ──────────────────────────────────────────
  return (
    <div className="animate-fade-up">
      <div className="text-center mb-10">
        <p className="text-3xl mb-3">✨</p>
        <h1 className="font-display text-4xl font-bold text-nude-800 mb-2">
          Begin your journey
        </h1>
        <p className="text-nude-600 text-sm font-body">Track your prayers, grow every day</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-nude-200 p-7">
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold tracking-widest text-nude-600 uppercase mb-2 font-body">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fatima"
              required
              className="w-full bg-nude-50 border border-nude-200 rounded-2xl px-4 py-3 text-nude-800 text-sm placeholder-nude-300 focus:outline-none focus:border-nude-400 transition-colors font-body"
            />
          </div>

          <div>
            <label className="block text-xs font-bold tracking-widest text-nude-600 uppercase mb-2 font-body">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-nude-50 border border-nude-200 rounded-2xl px-4 py-3 text-nude-800 text-sm placeholder-nude-300 focus:outline-none focus:border-nude-400 transition-colors font-body"
            />
          </div>

          <div>
            <label className="block text-xs font-bold tracking-widest text-nude-600 uppercase mb-2 font-body">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min. 8 characters"
              required
              className="w-full bg-nude-50 border border-nude-200 rounded-2xl px-4 py-3 text-nude-800 text-sm placeholder-nude-300 focus:outline-none focus:border-nude-400 transition-colors font-body"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center bg-red-50 rounded-xl py-2 px-3 font-body">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-nude-400 to-nude-500 text-white font-bold text-sm tracking-wide py-3.5 rounded-2xl mt-2 disabled:opacity-60 hover:opacity-90 active:scale-95 transition-transform font-body"
          >
            {isPending ? "Creating account..." : "Create Account 🌸"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-nude-200"></div>
          <span className="text-xs text-nude-400 font-bold">OR</span>
          <div className="flex-1 h-px bg-nude-200"></div>
        </div>

        {/* Magic Link Option */}
        <Link
          href="/auth/magiclink"
          className="block w-full border-2 border-nude-300 text-nude-700 font-bold text-sm tracking-wide py-3 rounded-2xl text-center hover:bg-nude-50 active:scale-95 transition-all"
        >
          Sign up with Magic Link 🔮
        </Link>

        <p className="text-center text-sm text-nude-500 mt-5 font-body">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-nude-700 font-bold underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
