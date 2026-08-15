"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate, formatMoney } from "@/lib/format";
import type { NetPositionPoint } from "@/lib/reports/queries";

function shortDateLabel(date: string) {
  return new Date(date).toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
}

function NetPositionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: NetPositionPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card p-2 text-xs shadow-sm">
      <div className="mb-1 font-medium text-foreground">{formatDate(point.date)}</div>
      <div className="text-muted-foreground">
        Net position:{" "}
        <span className="font-medium text-foreground">{formatMoney(point.netPosition)}</span>
      </div>
    </div>
  );
}

export function NetPositionChart({ data }: { data: NetPositionPoint[] }) {
  // Space out ~6 evenly-distributed tick labels regardless of how many daily points there are.
  const tickInterval = Math.max(0, Math.floor(data.length / 6) - 1);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickFormatter={shortDateLabel}
          interval={tickInterval}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => new Intl.NumberFormat("en-NZ").format(v)}
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <Tooltip content={<NetPositionTooltip />} />
        <Area
          type="monotone"
          dataKey="netPosition"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="none"
          dot={false}
          activeDot={{ r: 4, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
