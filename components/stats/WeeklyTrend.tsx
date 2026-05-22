"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface WeekData {
  week: string;
  prayers: number;
  possible: number;
}

interface Props {
  data: WeekData[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pct = d.possible > 0 ? Math.round((d.prayers / d.possible) * 100) : 0;
  return (
    <div className="bg-theme-surface border border-theme-border rounded-2xl px-3 py-2 shadow-sm">
      <p className="font-body text-xs font-bold text-theme-text">{label}</p>
      <p className="font-body text-xs text-theme-muted">{d.prayers}/{d.possible} prayers · {pct}%</p>
    </div>
  );
}

export default function WeeklyTrend({ data }: Props) {
  return (
    <div className="bg-theme-surface border border-theme-border rounded-3xl p-4 shadow-sm">
      <p className="font-display text-lg font-bold text-theme-text mb-1">Weekly Trend</p>
      <p className="font-body text-xs text-theme-muted mb-4">Prayers completed per week</p>

      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0c8bc" strokeOpacity={0.5} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10, fill: "#c4917a", fontFamily: "Lato" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 35]}
            tick={{ fontSize: 10, fill: "#c4917a", fontFamily: "Lato" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="prayers"
            stroke="#d4786a"
            strokeWidth={2.5}
            dot={{ fill: "#d4786a", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: "#c4917a" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
