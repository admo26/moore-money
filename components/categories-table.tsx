"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/hero/button";
import { CategoryRow, type CategoryRowData } from "@/components/category-row";

const PAGE_SIZE = 8;

/** Paginated instead of an internally-scrolling table, so the page itself doesn't need scrolling to see every category. */
export function CategoriesTable({ categories }: { categories: CategoryRowData[] }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(categories.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const start = clampedPage * PAGE_SIZE;
  const visible = categories.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {visible.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {clampedPage + 1} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              isIconOnly
              className="rounded-full"
              aria-label="Previous page"
              onPress={() => setPage((p) => Math.max(0, p - 1))}
              isDisabled={clampedPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              isIconOnly
              className="rounded-full"
              aria-label="Next page"
              onPress={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              isDisabled={clampedPage === pageCount - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
