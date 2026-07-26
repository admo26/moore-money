/** Shared money/date formatting so every screen renders numbers consistently. */

export function formatMoney(value: string | number | null | undefined, currency = "NZD") {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-NZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}
