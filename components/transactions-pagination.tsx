import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Server-rendered — rebuilds hrefs from the current search params so filters/sort/search survive a page change. */
export function TransactionsPagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefForPage(p: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") query.set(key, value);
    }
    if (p > 1) query.set("page", String(p));
    const qs = query.toString();
    return `/transactions${qs ? `?${qs}` : ""}`;
  }

  const linkClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-accent hover:text-accent-foreground";

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Link
          href={hrefForPage(page - 1)}
          aria-disabled={page <= 1}
          aria-label="Previous page"
          className={cn(linkClass, page <= 1 && "pointer-events-none opacity-50")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <Link
          href={hrefForPage(page + 1)}
          aria-disabled={page >= totalPages}
          aria-label="Next page"
          className={cn(linkClass, page >= totalPages && "pointer-events-none opacity-50")}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
