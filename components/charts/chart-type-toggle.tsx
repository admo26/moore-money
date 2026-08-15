"use client";

import { cn } from "@/lib/utils";

export type ChartType = "line" | "bar";

export function ChartTypeToggle({
  value,
  onChange,
}: {
  value: ChartType;
  onChange: (type: ChartType) => void;
}) {
  return (
    <div className="flex shrink-0 gap-0.5 rounded-full border border-border p-0.5">
      {(["line", "bar"] as const).map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors",
            value === type
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-accent-foreground"
          )}
        >
          {type}
        </button>
      ))}
    </div>
  );
}
