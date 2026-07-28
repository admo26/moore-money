import { toDateParam } from "./date-params";

export const PERIOD_PRESETS = [
  "this-month",
  "last-month",
  "last-3-months",
  "last-6-months",
  "last-12-months",
  "this-tax-year",
  "custom",
] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

export const PERIOD_PRESET_LABELS: Record<PeriodPreset, string> = {
  "this-month": "This month",
  "last-month": "Last month",
  "last-3-months": "Last 3 months",
  "last-6-months": "Last 6 months",
  "last-12-months": "Last 12 months",
  "this-tax-year": "This tax year (Apr–Mar)",
  custom: "Custom range",
};

export interface Period {
  from: string;
  to: string;
}

/** First day of the NZ tax year (1 Apr) that `today` falls within — Jan–Mar belongs to the previous calendar year's April. */
function taxYearStart(today: Date): Date {
  const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return new Date(year, 3, 1);
}

/**
 * Resolves a preset (everything except "custom", which has no fixed range —
 * callers should read from/to directly) into a `{ from, to }` date range.
 */
export function resolvePeriod(preset: Exclude<PeriodPreset, "custom">, today = new Date()): Period {
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  switch (preset) {
    case "this-month": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toDateParam(from), to: toDateParam(endOfToday) };
    }
    case "last-month": {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: toDateParam(from), to: toDateParam(to) };
    }
    case "last-3-months": {
      const from = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      return { from: toDateParam(from), to: toDateParam(endOfToday) };
    }
    case "last-6-months": {
      const from = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      return { from: toDateParam(from), to: toDateParam(endOfToday) };
    }
    case "last-12-months": {
      const from = new Date(today.getFullYear(), today.getMonth() - 11, 1);
      return { from: toDateParam(from), to: toDateParam(endOfToday) };
    }
    case "this-tax-year": {
      const from = taxYearStart(today);
      return { from: toDateParam(from), to: toDateParam(endOfToday) };
    }
  }
}

/**
 * Resolves a report page's searchParams into an effective preset + range.
 * Falls back to "this-month" for a missing/invalid preset, and for
 * "custom" with no from/to yet (e.g. just switched to custom in the
 * picker, before dates are chosen).
 */
export function periodFromSearchParams(params: {
  preset?: string;
  from?: string;
  to?: string;
}): { preset: PeriodPreset; from: string; to: string } {
  const preset: PeriodPreset = (PERIOD_PRESETS as readonly string[]).includes(params.preset ?? "")
    ? (params.preset as PeriodPreset)
    : "this-month";

  if (preset === "custom") {
    if (params.from && params.to) {
      return { preset, from: params.from, to: params.to };
    }
    return { preset, ...resolvePeriod("this-month") };
  }

  return { preset, ...resolvePeriod(preset) };
}
