"use client";

import type { Key } from "react-aria-components";
import { ChartLine, ChartColumn } from "lucide-react";
import { ToggleButtonGroup, ToggleButton } from "@/components/ui/hero/toggle-button-group";

export type ChartType = "line" | "bar";

const ICONS = { line: ChartLine, bar: ChartColumn } as const;

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
      {(["line", "bar"] as const).map((type) => {
        const Icon = ICONS[type];
        return (
          <ToggleButton key={type} id={type} aria-label={`${type} chart`}>
            <Icon className="h-4 w-4" />
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );
}
