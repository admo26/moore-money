"use client";

import { Plus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { CategoryTrendSeries } from "@/lib/reports/queries";

/**
 * Chips for the currently-selected categories (each removable) plus a
 * "+ More" popover listing the rest, capped at `maxSelected` picks. Extracted
 * out of category-trend-chart.tsx as a behaviour-neutral move ahead of
 * converting it to HeroUI's Popover + ListBox.
 */
export function CategoryPicker({
  selected,
  unselected,
  colorByCategory,
  atLimit,
  maxSelected,
  onToggle,
}: {
  selected: CategoryTrendSeries[];
  unselected: CategoryTrendSeries[];
  colorByCategory: Map<string, string>;
  atLimit: boolean;
  maxSelected: number;
  onToggle: (categoryFilter: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {selected.map((s) => (
        <span
          key={s.categoryFilter}
          className="inline-flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1.5 text-xs font-medium text-white"
          style={{ backgroundColor: colorByCategory.get(s.categoryFilter) }}
        >
          {s.name}
          <button
            type="button"
            onClick={() => onToggle(s.categoryFilter)}
            aria-label={`Remove ${s.name}`}
            className="rounded-full p-0.5 hover:bg-white/20"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {unselected.length > 0 && (
        <Popover>
          <PopoverTrigger className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
            <Plus className="h-3 w-3" />
            More
          </PopoverTrigger>
          <PopoverContent>
            <div className="max-h-64 space-y-0.5 overflow-y-auto p-1">
              {atLimit && (
                <p className="px-2 py-1 text-xs text-muted-foreground">
                  Up to {maxSelected} categories at a time — remove one to add another.
                </p>
              )}
              {unselected.map((s) => (
                <button
                  key={s.categoryFilter}
                  type="button"
                  onClick={() => onToggle(s.categoryFilter)}
                  disabled={atLimit}
                  className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-accent disabled:opacity-40"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
