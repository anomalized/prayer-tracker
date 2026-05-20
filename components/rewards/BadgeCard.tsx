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
      ? "bg-gradient-to-br from-nude-100 to-nude-200 border-nude-300 shadow-sm"
      : "bg-white border-nude-100 opacity-50"
    }`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${earned
        ? "bg-gradient-to-br from-nude-300 to-nude-400 shadow-sm"
        : "bg-nude-100"
      }`}>
        <div className="w-10 h-10 text-nude-900">
          <RewardBadgeIcon shape={getBadgeShape(id)} earned={earned} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-display text-base font-bold ${earned ? "text-nude-800" : "text-nude-400"}`}>
          {label}
        </p>
        <p className="font-body text-xs text-nude-400 mt-0.5">{description}</p>
        {earned && earned_at && (
          <p className="font-body text-xs text-nude-500 mt-1">
            Earned {format(new Date(earned_at), "d MMM yyyy")}
          </p>
        )}
      </div>

      <div className="flex-shrink-0">
        {earned
          ? <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          : <span className="font-body text-xs text-nude-300 bg-nude-100 px-2.5 py-1 rounded-xl inline-flex items-center gap-1"><Lock className="w-3.5 h-3.5" />Locked</span>
        }
      </div>
    </div>
  );
}
