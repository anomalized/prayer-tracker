"use client";

import { useState } from "react";
import { FriendActivity } from "@/types";

const ACTIVITY_ICONS: Record<FriendActivity["activity_type"], string> = {
  prayer: "🕌",
  qada: "🕋",
  badge: "🏅",
};

const ACTIVITY_STYLES: Record<FriendActivity["activity_type"], string> = {
  prayer: "bg-blue-100 text-blue-700",
  qada: "bg-amber-100 text-amber-700",
  badge: "bg-emerald-100 text-emerald-700",
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
    <div className="bg-white border border-nude-100 rounded-3xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="font-display text-sm font-bold text-nude-800">Friend activity</p>
          <p className="text-xs text-nude-400 mt-1">See recent prayer, qada, and badge updates from your accepted friends.</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          disabled={items.length === 0}
          className="text-xs font-bold text-nude-500 hover:text-nude-700 transition-colors disabled:opacity-50"
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
          <div className="px-5 py-10 text-center text-sm text-nude-400">
            No recent friend activity yet. When friends log prayers, update qada, or earn badges, it will appear here.
          </div>
        ) : (
          displayedItems.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold ${ACTIVITY_STYLES[item.activity_type]}`}>
                {ACTIVITY_ICONS[item.activity_type]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-body text-sm font-bold text-nude-800 truncate">{item.title}</p>
                <p className="text-xs text-nude-400 mt-1 truncate">{item.subtitle}</p>
              </div>
              <span className="text-[11px] text-nude-300 whitespace-nowrap">{formatTime(item.created_at)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
