import { PrayerCardSkeleton, HeatmapSkeleton, StatCardSkeleton } from "@/components/ui/Skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-theme-bg">
      <div className="bg-gradient-to-b from-nude-200 to-nude-100 px-5 pt-12 md:pt-6 pb-6 relative overflow-hidden">
        <div className="h-4 bg-nude-300 rounded-xl w-32 mb-2 animate-pulse" />
        <div className="h-8 bg-nude-300 rounded-xl w-48 mb-4 animate-pulse" />
        <div className="bg-theme-surface/60 rounded-2xl p-4 animate-pulse">
          <div className="h-2 bg-nude-200 rounded-full" />
        </div>
      </div>
      <div className="px-4 py-4 space-y-3">
        <PrayerCardSkeleton />
        <PrayerCardSkeleton />
        <PrayerCardSkeleton />
      </div>
    </div>
  );
}
