import { and, eq, gte, isNull, notInArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { accountBalanceSnapshots, accounts, categories, transactions } from "@/lib/db/schema";

/** Category names excluded from the spend chart — money moving, not being spent. */
const NON_SPEND_CATEGORY_NAMES = ["Transfers", "Investments"];

/** Akahu account types treated as investments — excluded from "net cash". */
const INVESTMENT_ACCOUNT_TYPES = new Set(["KIWISAVER", "INVESTMENT"]);

export interface MonthlyCashflow {
  /** "2026-07" */
  month: string;
  income: number;
  expense: number;
}

/** Money in vs money out per calendar month, for the last `months` months (oldest first). Missing months are filled with zeros. */
export async function getMonthlyCashflow(months = 6): Promise<MonthlyCashflow[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${transactions.date}), 'YYYY-MM')`,
      income: sql<string>`coalesce(sum(case when ${transactions.amount} > 0 then ${transactions.amount} else 0 end), 0)`,
      expense: sql<string>`coalesce(sum(case when ${transactions.amount} < 0 then -${transactions.amount} else 0 end), 0)`,
    })
    .from(transactions)
    .where(gte(transactions.date, since))
    .groupBy(sql`date_trunc('month', ${transactions.date})`)
    .orderBy(sql`date_trunc('month', ${transactions.date})`);

  const byMonth = new Map(rows.map((r) => [r.month, r]));

  const result: MonthlyCashflow[] = [];
  const cursor = new Date(since);
  for (let i = 0; i < months; i++) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    const row = byMonth.get(key);
    result.push({
      month: key,
      income: row ? Number(row.income) : 0,
      expense: row ? Number(row.expense) : 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return result;
}

export interface CategorySpend {
  name: string;
  amount: number;
  /** Filter value for the Transactions page's categoryId param. */
  categoryFilter: string;
}

/**
 * Net spend by category over the last `days` days, every category with net
 * outflow (no top-N folding — the UI scrolls instead). Net (not gross
 * outflow) so a category with both money out and money back in doesn't
 * inflate to double the real amount. Transfers and Investments are excluded
 * outright (not just netted) — they're money moving, not being spent, and a
 * timing mismatch between two legs of a transfer could otherwise show a
 * net outflow for a period that isn't real spending.
 */
export async function getCategorySpend(days = 30): Promise<CategorySpend[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      amount: sql<string>`sum(-${transactions.amount})`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        gte(transactions.date, since),
        or(isNull(categories.name), notInArray(categories.name, NON_SPEND_CATEGORY_NAMES))
      )
    )
    .groupBy(categories.id, categories.name)
    .having(sql`sum(-${transactions.amount}) > 0`)
    .orderBy(sql`sum(-${transactions.amount}) desc`);

  return rows.map((r) => ({
    name: r.categoryName ?? "Uncategorised",
    amount: Number(r.amount),
    categoryFilter: r.categoryId === null ? "uncategorised" : String(r.categoryId),
  }));
}

export interface CategoryTrendSeries {
  /** Filter value for the Transactions page's categoryId param. */
  categoryFilter: string;
  name: string;
  /** Oldest first, zero-filled for months with no activity. */
  points: { month: string; amount: number }[];
}

/**
 * Net amount per category per month, for the last `months` months —
 * one zero-filled series per category that had any activity in the
 * window. "Net" (not gross outflow) so money moving back into a category
 * doesn't inflate the trend; a positive value means net money out.
 */
export async function getCategoryTrends(months = 6): Promise<CategoryTrendSeries[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      month: sql<string>`to_char(date_trunc('month', ${transactions.date}), 'YYYY-MM')`,
      amount: sql<string>`sum(-${transactions.amount})`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(gte(transactions.date, since))
    .groupBy(categories.id, categories.name, sql`date_trunc('month', ${transactions.date})`);

  const monthKeys: string[] = [];
  const cursor = new Date(since);
  for (let i = 0; i < months; i++) {
    monthKeys.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const byCategory = new Map<string, { name: string; amounts: Map<string, number> }>();
  for (const r of rows) {
    const key = r.categoryId === null ? "uncategorised" : String(r.categoryId);
    const name = r.categoryName ?? "Uncategorised";
    if (!byCategory.has(key)) byCategory.set(key, { name, amounts: new Map() });
    byCategory.get(key)!.amounts.set(r.month, Number(r.amount));
  }

  return [...byCategory.entries()]
    .map(([categoryFilter, { name, amounts }]) => ({
      categoryFilter,
      name,
      points: monthKeys.map((month) => ({ month, amount: amounts.get(month) ?? 0 })),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface NetPositionPoint {
  /** "2026-07-24" */
  date: string;
  netPosition: number;
}

/**
 * Sums balance snapshots into a daily trend, for whichever accounts pass
 * `includeAccount`. Sourced from `account_balance_snapshots` rather than
 * transaction balances, so it covers every account type — including
 * investment/KiwiSaver accounts with no transactions at all, and
 * connections (e.g. Amex) whose transactions don't carry a running balance.
 */
async function computeBalanceTrend(
  days: number,
  includeAccount: (type: string) => boolean
): Promise<NetPositionPoint[]> {
  const rows = await db
    .select({
      accountId: accountBalanceSnapshots.accountId,
      capturedOn: accountBalanceSnapshots.capturedOn,
      balance: accountBalanceSnapshots.balance,
      type: accounts.type,
    })
    .from(accountBalanceSnapshots)
    .innerJoin(accounts, eq(accountBalanceSnapshots.accountId, accounts.id))
    .orderBy(accountBalanceSnapshots.accountId, accountBalanceSnapshots.capturedOn);

  const byAccount = new Map<string, { date: string; balance: number }[]>();
  for (const r of rows) {
    if (!includeAccount(r.type)) continue;
    const list = byAccount.get(r.accountId) ?? [];
    list.push({ date: r.capturedOn, balance: Number(r.balance) });
    byAccount.set(r.accountId, list);
  }

  const accountIds = [...byAccount.keys()];
  const pointer = new Map(accountIds.map((id) => [id, 0]));
  const latestBalance = new Map<string, number | null>(accountIds.map((id) => [id, null]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(today);
  cursor.setDate(cursor.getDate() - (days - 1));

  const points: NetPositionPoint[] = [];

  for (let i = 0; i < days; i++) {
    const cursorKey = cursor.toISOString().slice(0, 10);

    for (const id of accountIds) {
      const list = byAccount.get(id)!;
      let idx = pointer.get(id)!;
      while (idx < list.length && list[idx].date <= cursorKey) {
        latestBalance.set(id, list[idx].balance);
        idx++;
      }
      pointer.set(id, idx);
    }

    let netPosition = 0;
    for (const id of accountIds) {
      const bal = latestBalance.get(id);
      if (bal !== null && bal !== undefined) netPosition += bal;
    }

    points.push({ date: cursorKey, netPosition });
    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
}

/**
 * Net cash (sum of every non-investment account's balance) for each of the
 * last `days` calendar days — bank accounts, loans, and credit cards, but
 * not KiwiSaver/managed-fund accounts. Those move very differently (no
 * day-to-day transactions, valued by unit price rather than cash in/out)
 * and would otherwise dominate a chart meant to track everyday cash
 * position.
 */
export async function getNetCashTrend(days = 180): Promise<NetPositionPoint[]> {
  return computeBalanceTrend(
    days,
    (type) => !INVESTMENT_ACCOUNT_TYPES.has(type.toUpperCase())
  );
}

export interface PeriodSummary {
  income: number;
  expense: number;
}

/** Total money in/out over the last `days` days. */
export async function getPeriodSummary(days = 30): Promise<PeriodSummary> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [row] = await db
    .select({
      income: sql<string>`coalesce(sum(case when ${transactions.amount} > 0 then ${transactions.amount} else 0 end), 0)`,
      expense: sql<string>`coalesce(sum(case when ${transactions.amount} < 0 then -${transactions.amount} else 0 end), 0)`,
    })
    .from(transactions)
    .where(gte(transactions.date, since));

  return { income: Number(row.income), expense: Number(row.expense) };
}
