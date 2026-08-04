"use client";

import { useState } from "react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryTrendChart, ChartTypeToggle, type ChartType } from "@/components/charts/category-trend-chart";
import type { CategoryTrendSeries } from "@/lib/reports/queries";

export function CategoryTrendCard({ series }: { series: CategoryTrendSeries[] }) {
  const [chartType, setChartType] = useState<ChartType>("line");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Category trend — last 6 months</CardTitle>
        <CardDescription>
          Net amount per month — click categories below to compare up to 5 at once.
        </CardDescription>
        <CardAction>
          <ChartTypeToggle value={chartType} onChange={setChartType} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <CategoryTrendChart series={series} chartType={chartType} />
      </CardContent>
    </Card>
  );
}
