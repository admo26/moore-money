/** Preset options for the dashboard's per-chart range pickers. Client-safe (no DB import). */

export interface RangeOption {
  value: number;
  label: string;
}

export const NET_CASH_RANGE_OPTIONS: RangeOption[] = [
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
  { value: 182, label: "Last 6 months" },
  { value: 365, label: "Last 12 months" },
];

export const CASHFLOW_RANGE_OPTIONS: RangeOption[] = [
  { value: 3, label: "Last 3 months" },
  { value: 6, label: "Last 6 months" },
  { value: 12, label: "Last 12 months" },
];

export const SPEND_RANGE_OPTIONS: RangeOption[] = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

export const TREND_RANGE_OPTIONS: RangeOption[] = CASHFLOW_RANGE_OPTIONS;

/** Parses a search-param range value, falling back to `fallback` when missing/invalid/not an allowed option. */
export function parseRangeParam(raw: string | undefined, options: RangeOption[], fallback: number): number {
  const n = Number(raw);
  return options.some((o) => o.value === n) ? n : fallback;
}

export function rangeLabel(value: number, options: RangeOption[]): string {
  return options.find((o) => o.value === value)?.label ?? "";
}
