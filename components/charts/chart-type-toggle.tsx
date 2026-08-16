"use client";

import type { Key } from "react-aria-components";
import { ToggleButtonGroup, ToggleButton } from "@/components/ui/hero/toggle-button-group";

export type ChartType = "line" | "bar";

export function ChartTypeToggle({
  value,
  onChange,
}: {
  value: ChartType;
  onChange: (type: ChartType) => void;
}) {
  function handleSelectionChange(keys: Set<Key>) {
    const key = keys.values().next().value;
    if (key) onChange(key as ChartType);
  }

  return (
    <ToggleButtonGroup
      aria-label="Chart type"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[value]}
      onSelectionChange={handleSelectionChange}
      size="sm"
    >
      {(["line", "bar"] as const).map((type) => (
        <ToggleButton key={type} id={type} className="capitalize">
          {type}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
