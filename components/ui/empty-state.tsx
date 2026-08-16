import type { ReactNode } from "react";

/** Standard "nothing here yet" placeholder — was copy-pasted verbatim across 5 pages before this. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
