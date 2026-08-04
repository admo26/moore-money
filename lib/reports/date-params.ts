/**
 * "YYYY-MM-DD", for building Transactions page filter links. Client-safe
 * (no DB import). Reads local date components rather than going through
 * `toISOString` (which converts to UTC first) — callers build `d` from
 * local `new Date(year, month, day)` components, so a UTC round-trip would
 * shift the date by a day whenever the server's TZ isn't UTC.
 */
export function toDateParam(d: Date) {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/** [first day of month, last day of month] as "YYYY-MM-DD" params, from a "YYYY-MM" key. */
export function monthRange(month: string) {
  const [year, m] = month.split("-").map(Number);
  return {
    from: toDateParam(new Date(year, m - 1, 1)),
    to: toDateParam(new Date(year, m, 0)),
  };
}
