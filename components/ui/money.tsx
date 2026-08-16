import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

/**
 * A money amount, formatted + optionally sign-colored + optionally
 * sign-prefixed. Was hand-rolled with 3 different, inconsistent rules for
 * whether/how positive amounts got colored across ~10 call sites before
 * this — `color` makes the choice explicit per call site instead:
 * - "both" (default): color positive text-positive, negative text-negative
 *   — the common case (transactions, statement totals, net figures).
 * - "negative": only color when negative, leave positive at the default
 *   text color — matches account-card.tsx's balance display.
 * - "none": no color at all — for a plain figure where a *different*,
 *   role-based color is applied by the caller (e.g. cashflow's cashIn/
 *   cashOut, which are always green/red by what they represent, not by
 *   their sign) or where no color was ever applied (dashboard's Net stat).
 */
export function Money({
  value,
  currency,
  showSign = false,
  color = "both",
  className,
}: {
  value: string | number | null | undefined;
  currency?: string;
  showSign?: boolean;
  color?: "both" | "negative" | "none";
  className?: string;
}) {
  const numeric = typeof value === "string" ? Number(value) : value ?? 0;
  const colorClass =
    color === "none" ? undefined : numeric < 0 ? "text-negative" : color === "both" ? "text-positive" : undefined;

  return (
    <span className={cn(colorClass, className)}>
      {showSign && numeric > 0 ? "+" : ""}
      {formatMoney(value, currency)}
    </span>
  );
}
