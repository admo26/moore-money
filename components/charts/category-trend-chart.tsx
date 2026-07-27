"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CategoryTrendSeries } from "@/lib/reports/queries";

const MAX_SELECTED = 5;
// Fixed order, never cycled — matches the app's validated categorical palette.
const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function monthLabel(month: string) {
  const [year, m] = month.split("-");
  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString("en-NZ", {
    month: "short",
  });
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card p-2 text-xs shadow-sm">
      <div className="mb-1 font-medium text-foreground">{monthLabel(label ?? "")}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-medium text-foreground">{formatMoney(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function CategoryTrendChart({ series }: { series: CategoryTrendSeries[] }) {
  // Stable color per category (by position in the full list), so toggling a
  // selection never repaints the colors of categories already shown.
  const colorByCategory = useMemo(() => {
    const map = new Map<string, string>();
    series.forEach((s, i) => map.set(s.categoryFilter, CHART_COLORS[i % CHART_COLORS.length]));
    return map;
  }, [series]);

  const defaultCategory = useMemo(() => {
    if (series.length === 0) return null;
    return series.reduce((best, s) => {
      const total = s.points.reduce((sum, p) => sum + p.amount, 0);
      const bestTotal = best.points.reduce((sum, p) => sum + p.amount, 0);
      return total > bestTotal ? s : best;
    }).categoryFilter;
  }, [series]);

  const [selected, setSelected] = useState<string[]>(defaultCategory ? [defaultCategory] : []);

  function toggle(categoryFilter: string) {
    setSelected((prev) => {
      if (prev.includes(categoryFilter)) return prev.filter((c) => c !== categoryFilter);
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, categoryFilter];
    });
  }

  const selectedSeries = series.filter((s) => selected.includes(s.categoryFilter));

  const chartData = useMemo(() => {
    if (selectedSeries.length === 0) return [];
    return selectedSeries[0].points.map((_, i) => {
      const row: Record<string, string | number> = { month: selectedSeries[0].points[i].month };
      for (const s of selectedSeries) {
        row[s.categoryFilter] = s.points[i]?.amount ?? 0;
      }
      return row;
    });
  }, [selectedSeries]);

  if (series.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No categorised transactions in this period.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {series.map((s) => {
          const isSelected = selected.includes(s.categoryFilter);
          const atLimit = !isSelected && selected.length >= MAX_SELECTED;
          return (
            <button
              key={s.categoryFilter}
              type="button"
              onClick={() => toggle(s.categoryFilter)}
              disabled={atLimit}
              title={atLimit ? `Up to ${MAX_SELECTED} categories at a time` : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                isSelected
                  ? "border-transparent text-white"
                  : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                atLimit && "opacity-40"
              )}
              style={isSelected ? { backgroundColor: colorByCategory.get(s.categoryFilter) } : undefined}
            >
              {s.name}
            </button>
          );
        })}
      </div>

      {selectedSeries.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Pick a category above to see its trend.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ left: 8, right: 8, top: 8 }} barGap={2} barCategoryGap="20%">
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
            {selectedSeries.length > 1 && (
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">
                    {series.find((s) => s.categoryFilter === value)?.name ?? value}
                  </span>
                )}
              />
            )}
            {selectedSeries.map((s) => (
              <Bar
                key={s.categoryFilter}
                dataKey={s.categoryFilter}
                name={s.categoryFilter}
                fill={colorByCategory.get(s.categoryFilter)}
                radius={[4, 4, 0, 0]}
                maxBarSize={selectedSeries.length > 1 ? 20 : 32}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
