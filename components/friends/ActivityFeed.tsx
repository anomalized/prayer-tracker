"use client";

import { useState } from "react";
import { FriendActivity } from "@/types";

const ACTIVITY_ICONS: Record<FriendActivity["activity_type"], string> = {
  prayer: "🕌",
  qada: "🕋",
  badge: "🏅",
};

const ACTIVITY_STYLES: Record<FriendActivity["activity_type"], { bgColor: string; textColor: string }> = {
  prayer: { bgColor: "rgba(64,184,208,0.12)", textColor: "var(--color-accent)" },
  qada: { bgColor: "rgba(240,160,64,0.12)", textColor: "var(--color-accent)" },
  badge: { bgColor: "rgba(200,168,76,0.12)", textColor: "var(--color-accent)" },
};

function formatTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

interface Props {
  items: FriendActivity[];
}

export default function ActivityFeed({ items }: Props) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = items.length > 3;
  const displayedItems = expanded ? items : items.slice(0, 3);

  return (
    <div className="bg-theme-surface border border-theme-border rounded-3xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="font-display text-sm font-bold text-theme-text">Friend activity</p>
          <p className="text-xs text-theme-muted mt-1">See recent prayer, qada, and badge updates from your accepted friends.</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          disabled={items.length === 0}
          className="text-xs font-bold text-theme-muted hover:text-theme-text transition-colors disabled:opacity-50"
        >
          {items.length === 0
            ? "No activity yet"
            : expanded
            ? "Collapse"
            : hasMore
            ? `Show 3 of ${items.length}`
            : "Show all"}
        </button>
      </div>

      <div className="divide-y divide-nude-100">
        {items.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-theme-muted">
            No recent friend activity yet. When friends log prayers, update qada, or earn badges, it will appear here.
          </div>
        ) : (
          displayedItems.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold" 
                style={{ background: ACTIVITY_STYLES[item.activity_type].bgColor, color: ACTIVITY_STYLES[item.activity_type].textColor }}>
                {ACTIVITY_ICONS[item.activity_type]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-body text-sm font-bold truncate" style={{ color: "var(--color-text-primary)" }}>{item.title}</p>
                <p className="text-xs mt-1 truncate" style={{ color: "var(--color-text-muted)" }}>{item.subtitle}</p>
              </div>
              <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>{formatTime(item.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
