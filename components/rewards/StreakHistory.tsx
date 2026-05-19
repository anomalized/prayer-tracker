"use client";

import { useState }        from "react";
import { format }          from "date-fns";
import type { StreakEvent } from "@/lib/actions/stats";

const EVENT_CONFIG: Record<string, {
  icon:  string;
  label: (e: StreakEvent) => string;
  color: string;
}> = {
  streak_extended: {
    icon:  "🔥",
    label: (e) => `Streak extended to ${e.streakValueAfter} days`,
    color: "text-nude-600",
  },
  freeze_used: {
    icon:  "🛡️",
    label: (e) => `Freeze used — streak of ${e.streakValueAfter} preserved`,
    color: "text-blue-600",
  },
  streak_reset: {
    icon:  "💔",
    label: (e) => `Streak reset from ${e.streakValueBefore} days`,
    color: "text-red-400",
  },
  freeze_purchased: {
    icon:  "⭐",
    label: (e) => `Freeze purchased (−${e.pointsSpent} pts)`,
    color: "text-amber-600",
  },
};

interface Props {
  events: StreakEvent[];
}

export default function StreakHistory({ events }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (events.length === 0) return null;

  const visible = expanded ? events : events.slice(0, 3);

  return (
    <div className="bg-white border border-nude-100 rounded-3xl
      overflow-hidden shadow-sm">

      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4
          hover:bg-nude-50 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center
              text-lg flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #f0d8ce, #e8c4b8)" }}
          >
            📜
          </div>
          <div className="text-left">
            <p className="font-body text-sm font-bold text-nude-700">
              Streak History
            </p>
            <p className="font-body text-xs text-nude-400">
              {events.length} recent event{events.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-nude-300 transition-transform duration-200
            ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-nude-50 divide-y divide-nude-50">
          {visible.map((event, i) => {
            const cfg  = EVENT_CONFIG[event.eventType];
            if (!cfg) return null;

            const date = new Date(event.createdAt);
            const isValid = !isNaN(date.getTime());

            return (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3.5"
              >
                <span className="text-lg flex-shrink-0" aria-hidden>
                  {cfg.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-body text-sm font-bold ${cfg.color}`}>
                    {cfg.label(event)}
                  </p>
                  {isValid && (
                    <p className="font-body text-xs text-nude-300 mt-0.5">
                      {format(date, "d MMM yyyy · h:mm a")}
                    </p>
                  )}
                </div>
                {event.eventType !== "freeze_purchased" &&
                  event.streakValueBefore !== event.streakValueAfter && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="font-body text-xs text-nude-300">
                      {event.streakValueBefore}
                    </span>
                    <svg
                      className="w-3 h-3 text-nude-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span className={`font-body text-xs font-bold ${cfg.color}`}>
                      {event.streakValueAfter}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {events.length > 3 && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full py-3 font-body text-xs font-bold text-nude-400
                hover:text-nude-600 hover:bg-nude-50 transition-colors"
            >
              Show {events.length - 3} more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
