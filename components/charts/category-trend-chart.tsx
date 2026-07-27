"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/format";
import { toDateParam } from "@/lib/reports/date-params";
import type { CategoryTrendSeries } from "@/lib/reports/queries";

function monthLabel(month: string) {
  const [year, m] = month.split("-");
  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString("en-NZ", {
    month: "short",
  });
}

/** [first day of month, last day of month] as YYYY-MM-DD params. */
function monthRange(month: string) {
  const [year, m] = month.split("-").map(Number);
  const from = new Date(year, m - 1, 1);
  const to = new Date(year, m, 0);
  return { from: toDateParam(from), to: toDateParam(to) };
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card p-2 text-xs shadow-sm">
      <div className="mb-1 font-medium text-foreground">{monthLabel(label ?? "")}</div>
      <div className="text-muted-foreground">
        Net: <span className="font-medium text-foreground">{formatMoney(payload[0].value)}</span>
      </div>
    </div>
  );
}

export function CategoryTrendChart({ series }: { series: CategoryTrendSeries[] }) {
  const defaultCategory = useMemo(() => {
    if (series.length === 0) return "";
    const biggest = series.reduce((best, s) => {
      const total = s.points.reduce((sum, p) => sum + p.amount, 0);
      const bestTotal = best.points.reduce((sum, p) => sum + p.amount, 0);
      return total > bestTotal ? s : best;
    });
    return biggest.categoryFilter;
  }, [series]);

  const [selected, setSelected] = useState(defaultCategory);
  const router = useRouter();

  const current = series.find((s) => s.categoryFilter === selected);

  function handleClick(entry: { month: string }) {
    if (!current) return;
    const { from, to } = monthRange(entry.month);
    router.push(`/transactions?categoryId=${current.categoryFilter}&from=${from}&to=${to}`);
  }

  if (series.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No categorised transactions in this period.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="h-9 w-56 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {series.map((s) => (
          <option key={s.categoryFilter} value={s.categoryFilter}>
            {s.name}
          </option>
        ))}
      </select>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={current?.points ?? []} margin={{ left: 8, right: 8, top: 8 }}>
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
          <Tooltip content={<TrendTooltip />} cursor={{ fill: "var(--accent)" }} />
          <Bar
            dataKey="amount"
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
            cursor="pointer"
            onClick={(entry: unknown) =>
              handleClick((entry as { payload: { month: string } }).payload)
            }
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
