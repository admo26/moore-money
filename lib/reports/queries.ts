import { eq, gte, sql } from "drizzle-orm";
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
  /** Filter value for the Transactions page's categoryId param; null when this
   * slice can't be filtered to a single category (the folded "Other" bucket). */
  categoryFilter: string | null;
}

const MAX_CATEGORY_SLICES = 8;

/**
 * Net spend by category over the last `days` days, top slices + an "Other"
 * bucket. Net (not gross outflow) so a category with both money out and
 * money back in — e.g. Transfers, which nets a credit card payment leaving
 * one account against it landing in another — doesn't inflate to double
 * the real amount. Categories that are net money *in* over the period
 * (Income, or a Transfers bucket that nets to an inflow) are excluded,
 * since this is a spend chart.
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

  const spend: CategorySpend[] = rows.map((r) => ({
    name: r.categoryName ?? "Uncategorised",
    amount: Number(r.amount),
    categoryFilter: r.categoryId === null ? "uncategorised" : String(r.categoryId),
  }));

  if (spend.length <= MAX_CATEGORY_SLICES) return spend;

  const top = spend.slice(0, MAX_CATEGORY_SLICES);
  const rest = spend.slice(MAX_CATEGORY_SLICES);
  const otherTotal = rest.reduce((sum, r) => sum + r.amount, 0);
  top.push({ name: "Other", amount: otherTotal, categoryFilter: null });
  return top;
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
