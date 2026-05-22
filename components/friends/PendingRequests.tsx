"use client";

import { useTransition } from "react";
import { acceptFriendRequest, removeFriend } from "@/lib/actions/friends";

interface PendingRequest {
  friendshipId: string;
  id: string;
  name: string;
}

interface Props {
  requests: PendingRequest[];
}

export default function PendingRequests({ requests }: Props) {
  const [isPending, startTransition] = useTransition();

  if (!requests?.length) return null;

  const handleAccept = (friendshipId: string) => {
    startTransition(async () => { await acceptFriendRequest(friendshipId); });
  };

  const handleDecline = (friendshipId: string) => {
    startTransition(async () => { await removeFriend(friendshipId); });
  };

  return (
    <div className="bg-theme-surface border border-theme-border rounded-3xl overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 border-b border-amber-100">
        <p className="font-display text-base font-bold text-amber-700">
          Friend Requests 🌸
          <span className="ml-2 bg-amber-200 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {requests.length}
          </span>
        </p>
      </div>
      <div className="divide-y divide-nude-50">
        {requests.map(req => {
          const safeName = req?.name && req.name.length > 0 ? req.name : "Friend";
          return (
            <div key={req.friendshipId} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nude-200 to-nude-300 flex items-center justify-center text-theme-text font-display font-bold flex-shrink-0">
                {safeName.charAt(0).toUpperCase()}
              </div>
              <p className="flex-1 font-body text-sm font-bold text-theme-text">{safeName}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(req.friendshipId)}
                  disabled={isPending}
                  className="px-3 py-1.5 bg-gradient-to-r from-nude-400 to-nude-500 text-white text-xs font-bold font-body rounded-xl disabled:opacity-60 active:scale-95 transition-transform"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(req.friendshipId)}
                  disabled={isPending}
                  className="px-3 py-1.5 bg-theme-surface text-theme-muted text-xs font-bold font-body rounded-xl disabled:opacity-60 active:scale-95 transition-transform"
                >
                  Decline
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}