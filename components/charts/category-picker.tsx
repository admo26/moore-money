"use client";

import { Plus, X } from "lucide-react";
import type { Selection } from "react-aria-components";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/hero/popover";
import { ListBox } from "@/components/ui/hero/select";
import type { CategoryTrendSeries } from "@/lib/reports/queries";

/**
 * Chips for the currently-selected categories (each removable) plus a
 * "+ More" popover listing the rest, capped at `maxSelected` picks.
 *
 * The popover's ListBox only ever lists *unselected* categories (selected
 * ones become chips instead), so its controlled `selectedKeys` is always
 * empty — every key `onSelectionChange` reports back is therefore a fresh
 * pick, never a category already in `selected`. That lets us hand each key
 * straight to the existing `onToggle` (per-item, append-to-array) reducer
 * one at a time instead of replacing the selection wholesale — preserving
 * the append-on-add/filter-on-remove order that the chart's color-by-position
 * assignment depends on. Replacing wholesale from the (unordered) Set RAC
 * hands back would silently reshuffle series colors.
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
  function handleSelectionChange(keys: Selection) {
    // "all" can't occur here in practice (there's no select-all affordance),
    // but Selection's type includes it — guard rather than assume.
    if (keys === "all") return;
    for (const key of keys) onToggle(String(key));
  }

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
          <PopoverTrigger className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
            <Plus className="h-3 w-3" />
            More
          </PopoverTrigger>
          <PopoverContent>
            <div className="max-h-64 w-48 space-y-0.5 overflow-y-auto p-1">
              {atLimit && (
                <p className="px-2 py-1 text-xs text-muted-foreground">
                  Up to {maxSelected} categories at a time — remove one to add another.
                </p>
              )}
              <ListBox
                aria-label="Add category to trend"
                selectionMode="multiple"
                selectedKeys={new Set()}
                disabledKeys={atLimit ? unselected.map((s) => s.categoryFilter) : []}
                onSelectionChange={handleSelectionChange}
              >
                {unselected.map((s) => (
                  <ListBox.Item key={s.categoryFilter} id={s.categoryFilter}>
                    {s.name}
                  </ListBox.Item>
                ))}
              </ListBox>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
