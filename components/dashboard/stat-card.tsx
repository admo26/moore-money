import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/hero/card";
import { cn } from "@/lib/utils";

/** A single top-of-dashboard metric: label, big value, and an optional up/down % pill. */
export function StatCard({
  label,
  value,
  changePct,
}: {
  label: string;
  value: ReactNode;
  changePct: number | null;
}) {
  const positive = (changePct ?? 0) >= 0;

  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xl font-semibold sm:text-2xl">{value}</div>
          {changePct !== null && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                positive ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"
              )}
            >
              {positive ? "↑" : "↓"} {Math.abs(changePct).toFixed(1)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
