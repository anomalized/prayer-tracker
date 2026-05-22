"use client";

export function PrayerCardSkeleton() {
  return (
    <div className="bg-theme-surface border border-theme-border rounded-3xl p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-theme-surface" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-theme-surface rounded-xl w-24" />
          <div className="h-3 bg-theme-surface rounded-xl w-16" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-9 bg-theme-surface rounded-2xl" />
        <div className="flex-1 h-9 bg-theme-surface rounded-2xl" />
        <div className="w-20 h-9 bg-theme-surface rounded-2xl" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-theme-surface border border-theme-border rounded-2xl p-3.5 animate-pulse">
      <div className="w-8 h-8 bg-theme-surface rounded-xl mb-2" />
      <div className="h-6 bg-theme-surface rounded-xl w-16 mb-1" />
      <div className="h-3 bg-theme-surface rounded-xl w-20" />
    </div>
  );
}

export function HeatmapSkeleton() {
  return (
    <div className="bg-theme-surface border border-theme-border rounded-3xl p-4 animate-pulse">
      <div className="h-5 bg-theme-surface rounded-xl w-36 mb-1" />
      <div className="h-3 bg-theme-surface rounded-xl w-24 mb-4" />
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-theme-surface" />
        ))}
      </div>
    </div>
  );
}
