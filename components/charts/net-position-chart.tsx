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
import { formatMoney } from "@/lib/format";
import type { NetPositionPoint } from "@/lib/reports/queries";

function monthLabel(month: string) {
  const [year, m] = month.split("-");
  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString("en-NZ", {
    month: "short",
  });
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
      <div className="mb-1 font-medium text-foreground">{monthLabel(point.month)}</div>
      <div className="text-muted-foreground">
        Net position:{" "}
        <span className="font-medium text-foreground">{formatMoney(point.netPosition)}</span>
      </div>
    </div>
  );
}

export function NetPositionChart({ data }: { data: NetPositionPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ left: 8, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="netPositionFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.1} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tickFormatter={monthLabel}
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
          fill="url(#netPositionFill)"
          dot={{ r: 3, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 2 }}
          activeDot={{ r: 4, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
