"use client";

import { useState } from "react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryTrendChart, ChartTypeToggle, type ChartType } from "@/components/charts/category-trend-chart";
import { RangeSelect } from "@/components/dashboard/range-select";
import { TREND_RANGE_OPTIONS, rangeLabel } from "@/lib/reports/dashboard-ranges";
import type { CategoryTrendSeries } from "@/lib/reports/queries";

export function CategoryTrendCard({
  series,
  months,
}: {
  series: CategoryTrendSeries[];
  months: number;
}) {
  const [chartType, setChartType] = useState<ChartType>("line");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Category trend — {rangeLabel(months, TREND_RANGE_OPTIONS).toLowerCase()}
        </CardTitle>
        <CardDescription>
          Net amount per month — click categories below to compare up to 5 at once.
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          <RangeSelect paramKey="trendMonths" value={months} options={TREND_RANGE_OPTIONS} />
          <ChartTypeToggle value={chartType} onChange={setChartType} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <CategoryTrendChart series={series} chartType={chartType} />
      </CardContent>
    </Card>
  );
}
