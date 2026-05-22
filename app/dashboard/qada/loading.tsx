import { PrayerCardSkeleton } from "@/components/ui/Skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-primary)" }}>
      <div
        className="px-5 pt-12 pb-6"
        style={{ background: "linear-gradient(160deg, #f5e6df, #ecddd6)" }}
      >
        <div className="h-3 bg-nude-300 rounded-xl w-28 mb-2 animate-pulse" />
        <div className="h-7 bg-nude-300 rounded-xl w-44 mb-2 animate-pulse" />
        <div className="h-3 bg-nude-200 rounded-xl w-52 animate-pulse" />
      </div>
      <div className="px-4 py-4 space-y-3">
        <div className="h-24 bg-theme-surface rounded-3xl animate-pulse" />
        <PrayerCardSkeleton />
        <PrayerCardSkeleton />
        <PrayerCardSkeleton />
        <PrayerCardSkeleton />
        <PrayerCardSkeleton />
      </div>
    </div>
  );
}
