"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Selection } from "react-aria-components";
import { ArrowUpDown } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/hero/popover";
import { ListBox } from "@/components/ui/hero/select";

const SORT_OPTIONS = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "amount-desc", label: "Amount: high to low" },
  { value: "amount-asc", label: "Amount: low to high" },
];

/** Client-side navigation (like RangeSelect) rather than the shared filters form — sort is a single discrete choice, not free text. */
export function TransactionsSort({ sortBy, sortDir }: { sortBy: string; sortDir: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = `${sortBy}-${sortDir}`;

  function handleChange(keys: Selection) {
    if (keys === "all") return;
    const key = [...keys][0];
    if (key == null) return;
    const [newSortBy, newSortDir] = String(key).split("-");
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", newSortBy);
    params.set("sortDir", newSortDir);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <Popover>
      <PopoverTrigger className="inline-flex! h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
        <ArrowUpDown className="h-4 w-4" />
        Sort
      </PopoverTrigger>
      <PopoverContent>
        <div className="w-52 p-1">
          <ListBox
            aria-label="Sort by"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([current])}
            onSelectionChange={handleChange}
          >
            {SORT_OPTIONS.map((opt) => (
              <ListBox.Item key={opt.value} id={opt.value}>
                {opt.label}
              </ListBox.Item>
            ))}
          </ListBox>
        </div>
      </PopoverContent>
    </Popover>
  );
}
