"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { RangeOption } from "@/lib/reports/dashboard-ranges";

/** A small per-chart range picker — updates its own URL search param, leaving the others untouched. */
export function RangeSelect({
  paramKey,
  value,
  options,
}: {
  paramKey: string;
  value: number;
  options: RangeOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramKey, e.target.value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      aria-label="Date range"
      className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
