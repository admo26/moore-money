"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Key } from "react-aria-components";
import { Select, ListBox } from "@/components/ui/hero/select";
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

  function handleChange(key: Key | null) {
    if (key == null) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramKey, String(key));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <Select
      aria-label="Date range"
      selectedKey={value}
      onSelectionChange={handleChange}
    >
      <Select.Trigger className="h-8 min-h-8 text-xs">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option.value} id={option.value}>
              {option.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
