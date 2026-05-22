export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-primary)" }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-6"
        style={{ background: "linear-gradient(160deg, #f5e6df, #ecddd6)" }}
      >
        <div className="h-3 bg-nude-300 rounded-xl w-32 mb-2 animate-pulse" />
        <div className="h-8 bg-nude-300 rounded-xl w-48 mb-1 animate-pulse" />
        <div className="h-3 bg-nude-200 rounded-xl w-56 animate-pulse" />
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Calendar card skeleton */}
        <div className="bg-theme-surface border border-theme-border rounded-3xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-5 py-5"
            style={{ background: "linear-gradient(135deg, #fdf0ea, #f5e2d8)" }}>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 bg-nude-200 rounded-xl animate-pulse" />
              <div className="text-center">
                <div className="h-6 bg-nude-200 rounded-xl w-28 mb-1 animate-pulse" />
                <div className="h-4 bg-theme-surface rounded-xl w-20 mx-auto animate-pulse" />
              </div>
              <div className="w-9 h-9 bg-nude-200 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-3 pt-3 pb-1 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i}
                className="h-3 bg-theme-surface rounded-full mx-1 animate-pulse" />
            ))}
          </div>

          {/* Grid cells */}
          <div className="grid grid-cols-7 gap-1 px-3 pb-4">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i}
                className="aspect-square rounded-2xl bg-theme-bg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
