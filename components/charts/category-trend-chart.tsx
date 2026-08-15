"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type DotItemDotProps,
} from "recharts";
import { CategoryPicker } from "@/components/charts/category-picker";
import { formatMoney } from "@/lib/format";
import { monthRange } from "@/lib/reports/date-params";
import type { CategoryTrendSeries } from "@/lib/reports/queries";
import type { ChartType } from "@/components/charts/chart-type-toggle";

export type { ChartType };

const MAX_SELECTED = 5;
// Fixed order, never cycled — matches the app's validated categorical palette.
const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/** A small filled circle at each point, clickable through to that month's filtered transactions. */
function ClickableDot(
  categoryFilter: string,
  color: string | undefined,
  onDotClick: (categoryFilter: string, month: string) => void
) {
  function Dot({ cx, cy, payload }: DotItemDotProps) {
    if (cx == null || cy == null) return null;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={color}
        stroke="var(--card)"
        strokeWidth={1.5}
        style={{ cursor: "pointer" }}
        onClick={() => onDotClick(categoryFilter, payload.month)}
      />
    );
  }
  return Dot;
}

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
  resolveName,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  resolveName: (categoryFilter: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card p-2 text-xs shadow-sm">
      <div className="mb-1 font-medium text-foreground">{monthLabel(label ?? "")}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          {resolveName(p.name)}: <span className="font-medium text-foreground">{formatMoney(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function CategoryTrendChart({
  series,
  chartType,
}: {
  series: CategoryTrendSeries[];
  chartType: ChartType;
}) {
  const router = useRouter();

  function goToTransactions(categoryFilter: string, month: string) {
    const { from, to } = monthRange(month);
    router.push(`/transactions?categoryId=${categoryFilter}&from=${from}&to=${to}`);
  }

  const defaultSelected = useMemo(() => {
    if (series.length === 0) return [];

    const favourites = series.filter((s) => s.isFavourite).slice(0, MAX_SELECTED);
    if (favourites.length > 0) return favourites.map((s) => s.categoryFilter);

    const groceries = series.find((s) => s.name.toLowerCase() === "groceries");
    if (groceries) return [groceries.categoryFilter];

    const biggest = series.reduce((best, s) => {
      const total = s.points.reduce((sum, p) => sum + p.amount, 0);
      const bestTotal = best.points.reduce((sum, p) => sum + p.amount, 0);
      return total > bestTotal ? s : best;
    });
    return [biggest.categoryFilter];
  }, [series]);

  const [selected, setSelected] = useState<string[]>(defaultSelected);

  function toggle(categoryFilter: string) {
    setSelected((prev) => {
      if (prev.includes(categoryFilter)) return prev.filter((c) => c !== categoryFilter);
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, categoryFilter];
    });
  }

  // Colored by position within the current *selection*, not the full
  // category list — since at most MAX_SELECTED (= CHART_COLORS.length) can
  // be shown at once, every category on screen gets a distinct color.
  // Selection order is append-on-add/filter-on-remove, so an existing pick
  // keeps its color as others are toggled around it.
  const colorByCategory = useMemo(() => {
    const map = new Map<string, string>();
    selected.forEach((categoryFilter, i) => map.set(categoryFilter, CHART_COLORS[i % CHART_COLORS.length]));
    return map;
  }, [selected]);

  function resolveName(categoryFilter: string) {
    return series.find((s) => s.categoryFilter === categoryFilter)?.name ?? categoryFilter;
  }

  const selectedSeries = series.filter((s) => selected.includes(s.categoryFilter));
  const unselectedSeries = series.filter((s) => !selected.includes(s.categoryFilter));
  const atLimit = selected.length >= MAX_SELECTED;

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
      <CategoryPicker
        selected={selectedSeries}
        unselected={unselectedSeries}
        colorByCategory={colorByCategory}
        atLimit={atLimit}
        maxSelected={MAX_SELECTED}
        onToggle={toggle}
      />

      {selectedSeries.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          Pick a category above to see its trend.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          {chartType === "line" ? (
            <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8 }}>
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
              <Tooltip content={<TrendTooltip resolveName={resolveName} />} cursor={{ stroke: "var(--border)" }} />
              {selectedSeries.length > 1 && (
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">
                      {resolveName(value)}
                    </span>
                  )}
                />
              )}
              {selectedSeries.map((s) => (
                <Line
                  key={s.categoryFilter}
                  type="monotone"
                  dataKey={s.categoryFilter}
                  name={s.categoryFilter}
                  stroke={colorByCategory.get(s.categoryFilter)}
                  strokeWidth={2}
                  dot={ClickableDot(s.categoryFilter, colorByCategory.get(s.categoryFilter), goToTransactions)}
                  activeDot={false}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{ left: 8, right: 8, top: 8 }}
              barGap={2}
              barCategoryGap="20%"
            >
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
              <Tooltip content={<TrendTooltip resolveName={resolveName} />} cursor={{ fill: "var(--accent)" }} />
              {selectedSeries.length > 1 && (
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">
                      {resolveName(value)}
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
                  className="cursor-pointer"
                  onClick={(data) => goToTransactions(s.categoryFilter, data.payload.month)}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
