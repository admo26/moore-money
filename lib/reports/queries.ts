import { eq, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, transactions } from "@/lib/db/schema";

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
 * outflow) so a category with both money out and money back in — e.g.
 * Transfers, which nets a credit card payment leaving one account against
 * it landing in another — doesn't inflate to double the real amount.
 * Categories that are net money *in* over the period (Income, or a
 * Transfers bucket that nets to an inflow) are excluded, since this is a
 * spend chart.
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
    .where(gte(transactions.date, since))
    .groupBy(categories.id, categories.name)
    .having(sql`sum(-${transactions.amount}) > 0`)
    .orderBy(sql`sum(-${transactions.amount}) desc`);

  return rows.map((r) => ({
    name: r.categoryName ?? "Uncategorised",
    amount: Number(r.amount),
    categoryFilter: r.categoryId === null ? "uncategorised" : String(r.categoryId),
  }));
}

export interface NetPositionPoint {
  /** "2026-07" */
  month: string;
  /** The date this point's balance is as-of (month-end, or today for the current month). */
  asOf: string;
  netPosition: number;
}

/**
 * Net position (sum of every account's balance) at each of the last
 * `months` month-ends, using each account's most recent transaction
 * balance snapshot on or before that date. The final point uses today
 * rather than the current month's end, since future balances aren't known.
 */
export async function getNetPositionTrend(months = 6): Promise<NetPositionPoint[]> {
  const rows = await db
    .select({
      accountId: transactions.accountId,
      date: transactions.date,
      balance: transactions.balance,
    })
    .from(transactions)
    .where(isNotNull(transactions.balance))
    .orderBy(transactions.accountId, transactions.date);

  const byAccount = new Map<string, { date: Date; balance: number }[]>();
  for (const r of rows) {
    const list = byAccount.get(r.accountId) ?? [];
    list.push({ date: r.date, balance: Number(r.balance) });
    byAccount.set(r.accountId, list);
  }

  const today = new Date();
  const points: NetPositionPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const isCurrentMonth = i === 0;
    const asOf = isCurrentMonth
      ? today
      : new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;

    let netPosition = 0;
    for (const list of byAccount.values()) {
      let latest: number | null = null;
      for (const entry of list) {
        if (entry.date <= asOf) latest = entry.balance;
        else break;
      }
      if (latest !== null) netPosition += latest;
    }

    points.push({ month: monthKey, asOf: asOf.toISOString().slice(0, 10), netPosition });
  }

  return points;
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
