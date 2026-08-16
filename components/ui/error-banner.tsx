import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Standard error banner — was copy-pasted verbatim across 8 pages before
 * this (plus 2 near-copies in login-form.tsx using a smaller `size="sm"`
 * variant, since that one sits inside a narrow auth card rather than a
 * full page).
 */
export function ErrorBanner({
  children,
  size = "default",
  className,
}: {
  children: ReactNode;
  size?: "default" | "sm";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-destructive/30 bg-destructive/5 text-sm text-destructive",
        size === "sm" ? "rounded-md p-2" : "rounded-lg p-4",
        className
      )}
    >
      {children}
    </div>
  );
}
