"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
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
} from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CategoryTrendSeries } from "@/lib/reports/queries";

type ChartType = "line" | "bar";

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
  const [chartType, setChartType] = useState<ChartType>("line");

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

  const selectedSeries = series.filter((s) => selected.includes(s.categoryFilter));
  const unselectedSeries = series.filter((s) => !selected.includes(s.categoryFilter));
  const atLimit = selected.length >= MAX_SELECTED;
  // What an unselected category would become if picked next — lets the
  // popover preview its color before it's added.
  const nextColor = CHART_COLORS[selected.length % CHART_COLORS.length];

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
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedSeries.map((s) => (
            <span
              key={s.categoryFilter}
              className="inline-flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1.5 text-xs font-medium text-white"
              style={{ backgroundColor: colorByCategory.get(s.categoryFilter) }}
            >
              {s.name}
              <button
                type="button"
                onClick={() => toggle(s.categoryFilter)}
                aria-label={`Remove ${s.name}`}
                className="rounded-full p-0.5 hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {unselectedSeries.length > 0 && (
            <Popover>
              <PopoverTrigger className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                <Plus className="h-3 w-3" />
                More
              </PopoverTrigger>
              <PopoverContent>
                <div className="max-h-64 space-y-0.5 overflow-y-auto p-1">
                  {atLimit && (
                    <p className="px-2 py-1 text-xs text-muted-foreground">
                      Up to {MAX_SELECTED} categories at a time — remove one to add another.
                    </p>
                  )}
                  {unselectedSeries.map((s) => (
                    <button
                      key={s.categoryFilter}
                      type="button"
                      onClick={() => toggle(s.categoryFilter)}
                      disabled={atLimit}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-accent disabled:opacity-40"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: atLimit ? "var(--muted-foreground)" : nextColor }}
                      />
                      {s.name}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <div className="flex shrink-0 gap-0.5 rounded-full border border-border p-0.5">
          {(["line", "bar"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setChartType(type)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                chartType === type
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-accent-foreground"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

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
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: "var(--border)" }} />
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
                <Line
                  key={s.categoryFilter}
                  type="monotone"
                  dataKey={s.categoryFilter}
                  name={s.categoryFilter}
                  stroke={colorByCategory.get(s.categoryFilter)}
                  strokeWidth={2}
                  dot={false}
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
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
