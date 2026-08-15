"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

/** Tiny trend line for a single account row — no axes, grid, or tooltip. */
export function Sparkline({
  data,
  positive,
}: {
  data: { value: number }[];
  positive: boolean;
}) {
  if (data.length < 2) {
    return <div className="h-8 w-24 shrink-0" />;
  }

  return (
    <div className="h-8 w-24 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, bottom: 4, left: 2, right: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={positive ? "var(--positive)" : "var(--negative)"}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
