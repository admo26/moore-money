/**
 * Asset vs liability, derived from Akahu's account `type` — no manual
 * tagging needed. Liabilities are the two types that owe money; every other
 * Akahu account type (KIWISAVER, INVESTMENT, SAVINGS, CHECKING, TERMDEPOSIT,
 * WALLET, FOREIGN, TAX, REWARDS, and anything not yet enumerated) is treated
 * as an asset by default.
 */
const LIABILITY_TYPES = new Set(["LOAN", "CREDITCARD"]);

export type AccountClass = "asset" | "liability";

export function accountClass(type: string): AccountClass {
  return LIABILITY_TYPES.has(type.toUpperCase()) ? "liability" : "asset";
}

/** KiwiSaver is an asset, but shown in its own "Retirement" section and excluded from the headline net-worth figure — it's locked away until retirement, not spendable net worth. */
export function isRetirementAccount(type: string): boolean {
  return type.toUpperCase() === "KIWISAVER";
}
