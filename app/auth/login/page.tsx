"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Incorrect email or password. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/dashboard/today");
    router.refresh();
  };

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-3xl mb-3">🌸</p>
        <h1 className="font-display text-4xl font-bold text-nude-800 mb-2">
          Welcome back
        </h1>
        <p className="text-nude-600 text-sm">Your prayers, your journey</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-nude-200 p-7">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold tracking-widest text-nude-600 uppercase mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-nude-50 border border-nude-200 rounded-2xl px-4 py-3 text-nude-800 text-sm placeholder-nude-300 focus:outline-none focus:border-nude-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold tracking-widest text-nude-600 uppercase mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-nude-50 border border-nude-200 rounded-2xl px-4 py-3 text-nude-800 text-sm placeholder-nude-300 focus:outline-none focus:border-nude-400 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center bg-red-50 rounded-xl py-2 px-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-nude-400 to-nude-500 text-white font-bold text-sm tracking-wide py-3.5 rounded-2xl mt-2 disabled:opacity-60 hover:opacity-90 active:scale-95 transition-transform"
          >
            {loading ? "Signing in..." : "Sign In 🌸"}
          </button>
        </form>

        <p className="text-center text-sm text-nude-500 mt-5">
          New here?{" "}
          <Link href="/auth/signup" className="text-nude-700 font-bold underline underline-offset-2">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
