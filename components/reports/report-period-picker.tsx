"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/hero/input";
import { Select, ListBox } from "@/components/ui/hero/select";
import { PERIOD_PRESETS, PERIOD_PRESET_LABELS, type PeriodPreset } from "@/lib/reports/period";

export function ReportPeriodPicker({
  defaults,
}: {
  defaults: { preset: PeriodPreset; from?: string; to?: string };
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function submitNow() {
    formRef.current?.requestSubmit();
  }

  return (
    <form
      ref={formRef}
      method="GET"
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="preset" className="text-xs font-medium text-muted-foreground">
          Period
        </label>
        <Select name="preset" defaultSelectedKey={defaults.preset} onSelectionChange={() => submitNow()}>
          <Select.Trigger id="preset" className="h-9 w-56">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {PERIOD_PRESETS.map((preset) => (
                <ListBox.Item key={preset} id={preset}>
                  {PERIOD_PRESET_LABELS[preset]}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {defaults.preset === "custom" && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="from" className="text-xs font-medium text-muted-foreground">
              From
            </label>
            <Input
              id="from"
              type="date"
              name="from"
              defaultValue={defaults.from ?? ""}
              onChange={submitNow}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="to" className="text-xs font-medium text-muted-foreground">
              To
            </label>
            <Input
              id="to"
              type="date"
              name="to"
              defaultValue={defaults.to ?? ""}
              onChange={submitNow}
              className="w-40"
            />
          </div>
        </>
      )}
    </form>
  );
}
