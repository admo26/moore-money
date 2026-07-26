"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { ResponsiveContainer } from "recharts";
import { formatMoney } from "@/lib/format";
import type { CategorySpend } from "@/lib/reports/queries";

export function CategorySpendChart({ data }: { data: CategorySpend[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No spend in this period.
      </div>
    );
  }

  const height = Math.max(160, data.length * 36);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 56 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {data.map((d) => (
            <Cell key={d.name} fill="var(--chart-1)" />
          ))}
          <LabelList
            dataKey="amount"
            position="right"
            formatter={((v: unknown) =>
              v == null ? "" : formatMoney(v as number)) as (value: unknown) => string}
            style={{ fill: "var(--foreground)", fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
