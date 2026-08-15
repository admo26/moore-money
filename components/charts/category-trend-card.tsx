"use client";

import { useState } from "react";
import {
  Card,
  CardActions,
  CardContent,
  CardDescription,
  CardHeaderRow,
  CardTitle,
  CardTitleBlock,
} from "@/components/ui/hero/card";
import { CategoryTrendChart } from "@/components/charts/category-trend-chart";
import { ChartTypeToggle, type ChartType } from "@/components/charts/chart-type-toggle";
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
      <CardHeaderRow>
        <CardTitleBlock>
          <CardTitle className="text-base">
            Category trend — {rangeLabel(months, TREND_RANGE_OPTIONS).toLowerCase()}
          </CardTitle>
          <CardDescription>
            Net amount per month — click categories below to compare up to 5 at once.
          </CardDescription>
        </CardTitleBlock>
        <CardActions>
          <RangeSelect paramKey="trendMonths" value={months} options={TREND_RANGE_OPTIONS} />
          <ChartTypeToggle value={chartType} onChange={setChartType} />
        </CardActions>
      </CardHeaderRow>
      <CardContent>
        <CategoryTrendChart series={series} chartType={chartType} />
      </CardContent>
    </Card>
  );
}
