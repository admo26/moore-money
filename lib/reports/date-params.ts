/** "YYYY-MM-DD", for building Transactions page filter links. Client-safe (no DB import). */
export function toDateParam(d: Date) {
  return d.toISOString().slice(0, 10);
}
