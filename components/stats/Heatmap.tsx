"use client";

interface DayData {
  date: string;
  count: number; // 0-5 prayers done
}

interface Props {
  days: DayData[];
}

export default function Heatmap({ days }: Props) {
  const getColor = (count: number) => {
    if (count === 0) return "bg-theme-surface";
    if (count <= 1)  return "bg-nude-200";
    if (count <= 2)  return "bg-nude-300";
    if (count <= 3)  return "bg-nude-400";
    if (count <= 4)  return "bg-theme-bg0";
    return "bg-nude-600"; // all 5
  };

  const getLabel = (count: number) => {
    if (count === 0) return "No prayers logged";
    if (count === 5) return "Perfect day! All 5 prayers";
    return `${count} prayer${count > 1 ? "s" : ""} logged`;
  };

  // Pad to fill a 5-row grid (35 cells)
  const padded = Array.from({ length: 35 }, (_, i) => days[i] ?? { date: "", count: 0 });

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-theme-surface border border-theme-border rounded-3xl p-4 shadow-sm">
      <p className="font-display text-lg font-bold text-theme-text mb-1">Monthly Heatmap</p>
      <p className="font-body text-xs text-theme-muted mb-4">Last 35 days of prayers</p>

      <div className="grid grid-cols-7 gap-1.5">
        {padded.map((day, i) => (
          <div
            key={i}
            title={day.date ? `${day.date} — ${getLabel(day.count)}` : ""}
            className={`aspect-square rounded-lg transition-all ${getColor(day.count)}
              ${day.date === today ? "ring-2 ring-nude-500 ring-offset-1" : ""}
              ${day.date ? "cursor-pointer hover:opacity-75" : ""}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-4 justify-end">
        <p className="font-body text-xs text-theme-muted mr-1">Less</p>
        {["bg-theme-surface", "bg-nude-200", "bg-nude-300", "bg-nude-400", "bg-theme-bg0", "bg-nude-600"].map(c => (
          <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <p className="font-body text-xs text-theme-muted ml-1">More</p>
      </div>
    </div>
  );
}
