"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion/react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

/**
 * Animates from 0 to `value` on mount — used for the net-worth headline
 * figure only, not the shared Money component, since counting up every
 * money value on every page (account balances, transaction rows, ...)
 * would be more distracting than fun.
 */
export function CountUpMoney({
  value,
  currency,
  className,
}: {
  value: number;
  currency?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const controls = animate(0, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate(current) {
        node.textContent = formatMoney(current, currency);
      },
    });

    return () => controls.stop();
  }, [value, currency]);

  const colorClass = value < 0 ? "text-negative" : "text-positive";

  return (
    <span ref={ref} className={cn(colorClass, className)}>
      {formatMoney(0, currency)}
    </span>
  );
}
