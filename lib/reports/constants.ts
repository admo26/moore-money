/** Category names excluded from spend/income-expense views — money moving, not being earned or spent. */
export const NON_SPEND_CATEGORY_NAMES = ["Transfers", "Investments"];

/** Akahu account types treated as investments — excluded from "net cash" and cashflow views. */
export const INVESTMENT_ACCOUNT_TYPES = new Set(["KIWISAVER", "INVESTMENT"]);
