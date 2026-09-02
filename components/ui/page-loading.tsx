import { Loader2 } from "lucide-react";

/** Shared fallback for each route's loading.tsx — Next shows this immediately on navigation, while the page's data fetch is still in flight. */
export function PageLoading() {
  return (
    <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}
