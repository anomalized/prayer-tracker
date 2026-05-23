"use client";

import { useState, useCallback } from "react";
import ChallengeCard from "./ChallengeCard";
import ChallengeSender from "./ChallengeSender";
import type { Challenge } from "@/lib/actions/challenges";

interface Friend {
  id: string;
  name: string;
}

interface Props {
  initialChallenges: Challenge[];
  acceptedFriends: Friend[];
  myId: string;
}

export default function ChallengesSection({ initialChallenges, acceptedFriends, myId }: Props) {
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges);
  const [showSend, setShowSend] = useState(false);
  const [collapsed, setCollapsed] = useState(initialChallenges.length === 0);

  const activeChallengeCount = challenges.filter((c) => c.status === "active" || c.status === "pending").length;

  const handleRemove = useCallback((id: string) => {
    setChallenges((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleUpdate = useCallback((id: string, patch: Partial<Challenge>) => {
    setChallenges((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const handleSent = useCallback((challenge: Challenge) => {
    setChallenges((prev) => [challenge, ...prev]);
    setCollapsed(false);
  }, []);

  return (
    <div className="bg-theme-surface border border-theme-border rounded-3xl overflow-hidden shadow-sm">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-theme-bg transition-colors text-left"
        aria-expanded={!collapsed}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: "var(--card-gradient)" }}>
          ⚡
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-body text-sm font-bold text-theme-text">Prayer Challenges</p>
            {activeChallengeCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--color-surface)", color: "var(--color-accent)", border: "1px solid var(--color-border)" }}>
                {activeChallengeCount} active
              </span>
            )}
          </div>
          <p className="font-body text-xs text-theme-muted">7-day head-to-head competitions</p>
        </div>
        <svg className={`w-4 h-4 text-theme-muted/70 flex-shrink-0 transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <div className="border-t border-nude-50">
          {challenges.length > 0 ? (
            <div className="divide-y divide-nude-50">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="p-4">
                  <ChallengeCard challenge={challenge} myId={myId} onRemove={handleRemove} onUpdate={handleUpdate} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center px-6">
              <p className="text-3xl mb-2">⚡</p>
              <p className="font-body text-sm font-bold text-theme-text">No challenges yet</p>
              <p className="font-body text-xs text-theme-muted mt-1 leading-relaxed">
                Challenge a friend to a 7-day prayer competition. Whoever completes more prayers wins!
              </p>
            </div>
          )}

          {acceptedFriends.length > 0 && (
            <div className="border-t border-nude-50">
              <button
                onClick={() => setShowSend((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-theme-bg transition-colors"
              >
                <p className="font-body text-sm font-bold text-theme-text">⚡ Challenge a friend</p>
                <span className={`text-theme-muted transition-transform duration-200 text-sm ${showSend ? "rotate-180" : ""}`}>▾</span>
              </button>
              {showSend && <ChallengeSender friends={acceptedFriends} myId={myId} onSent={handleSent} />}
            </div>
          )}

          <div className="px-4 py-3 border-t border-nude-50">
            <p className="font-body text-[10px] text-theme-muted/70 text-center">Winner gets 50 pts · Participation earns 20 pts 🌸</p>
          </div>
        </div>
      )}
    </div>
  );
}
