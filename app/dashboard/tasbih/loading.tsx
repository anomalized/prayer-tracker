export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: "#fdf6f3" }}>
      {/* Header skeleton */}
      <div
        className="px-5 pt-12 pb-5"
        style={{ background: "linear-gradient(160deg, #f5e6df, #ecddd6)" }}
      >
        <div className="h-3 bg-nude-300 rounded-xl w-24 mb-2 animate-pulse" />
        <div className="h-8 bg-nude-300 rounded-xl w-36 mb-4 animate-pulse" />
        <div className="h-11 bg-nude-200 rounded-2xl animate-pulse" />
      </div>

      {/* Circle skeleton */}
      <div className="flex flex-col items-center justify-center py-12 gap-6">
        <div className="h-8 bg-nude-100 rounded-2xl w-48 animate-pulse" />
        <div
          className="rounded-full bg-nude-200 animate-pulse"
          style={{ width: 220, height: 220 }}
        />
        <div className="flex gap-2 w-64">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 h-10 bg-nude-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-10 bg-nude-100 rounded-2xl w-64 animate-pulse" />
      </div>
    </div>
  );
}
