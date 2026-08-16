"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/hero/input";
import { Select, ListBox } from "@/components/ui/hero/select";
import { Field } from "@/components/ui/field";
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

  // HeroUI's Select mirrors its selection onto a hidden native <select>
  // for form serialization, but that sync happens in an effect, not
  // synchronously inside onSelectionChange — calling requestSubmit()
  // directly there reads the *previous* value (confirmed: picking "Custom
  // range" kept submitting the old preset). Deferring past the current
  // task lets the sync effect flush first. Plain <input>s (the From/To
  // date fields below) don't need this — their value is already in the
  // DOM by the time a native onChange fires.
  function submitAfterSync() {
    setTimeout(submitNow, 0);
  }

  return (
    <form
      ref={formRef}
      method="GET"
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"
    >
      <Field label="Period" htmlFor="preset">
        <Select name="preset" defaultSelectedKey={defaults.preset} onSelectionChange={submitAfterSync}>
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
      </Field>

      {defaults.preset === "custom" && (
        <>
          <Field label="From" htmlFor="from">
            <Input
              id="from"
              type="date"
              name="from"
              defaultValue={defaults.from ?? ""}
              onChange={submitNow}
              className="w-40"
            />
          </Field>
          <Field label="To" htmlFor="to">
            <Input
              id="to"
              type="date"
              name="to"
              defaultValue={defaults.to ?? ""}
              onChange={submitNow}
              className="w-40"
            />
          </Field>
        </>
      )}
    </form>
  );
}
