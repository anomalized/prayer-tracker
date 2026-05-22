"use client";

import { format } from "date-fns";
import { CheckCircle2, Lock } from "lucide-react";
import RewardBadgeIcon, { getBadgeShape } from "@/components/rewards/RewardBadgeIcon";

interface Props {
  id: string;
  label: string;
  icon: string;
  description: string;
  earned: boolean;
  earned_at?: string | null;
}

export default function BadgeCard({ id, label, description, earned, earned_at }: Props) {
  return (
    <div className={`flex items-center gap-4 rounded-3xl border p-4 transition-all ${earned
      ? "bg-gradient-to-br from-nude-100 to-nude-200 border-theme-border shadow-sm"
      : "bg-theme-surface border-theme-border opacity-50"
    }`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${earned
        ? "bg-gradient-to-br from-nude-300 to-nude-400 shadow-sm"
        : "bg-theme-surface"
      }`}>
        <div className="w-10 h-10 text-nude-900">
          <RewardBadgeIcon shape={getBadgeShape(id)} earned={earned} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-display text-base font-bold ${earned ? "text-theme-text" : "text-theme-muted"}`}>
          {label}
        </p>
        <p className="font-body text-xs text-theme-muted mt-0.5">{description}</p>
        {earned && earned_at && (
          <p className="font-body text-xs text-theme-muted mt-1">
            Earned {format(new Date(earned_at), "d MMM yyyy")}
          </p>
        )}
      </div>

      <div className="flex-shrink-0">
        {earned
          ? <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          : <span className="font-body text-xs text-theme-muted/70 bg-theme-surface px-2.5 py-1 rounded-xl inline-flex items-center gap-1"><Lock className="w-3.5 h-3.5" />Locked</span>
        }
      </div>
    </div>
  );
}
