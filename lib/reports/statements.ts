import { and, eq, gte, isNull, lte, notInArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { accountBalanceSnapshots, accounts, categories, transactions } from "@/lib/db/schema";
import { INVESTMENT_ACCOUNT_TYPES, NON_SPEND_CATEGORY_NAMES } from "./constants";

export interface StatementRow {
  name: string;
  amount: number;
  /** Filter value for the Transactions page's categoryId param. */
  categoryFilter: string;
}

export interface IncomeExpenseReport {
  income: StatementRow[];
  expenses: StatementRow[];
  totalIncome: number;
  totalExpenses: number;
  net: number;
}

/**
 * A personal income & expense statement for [from, to] (inclusive,
 * "YYYY-MM-DD"): every category's net amount, split into income (net
 * credit) and expense (net debit) rows. Transfers/Investments are excluded
 * outright — they're money moving between the household's own accounts,
 * not income or spending.
 */
export async function getIncomeExpenseReport(from: string, to: string): Promise<IncomeExpenseReport> {
  const rows = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      net: sql<string>`sum(${transactions.amount})`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        gte(transactions.date, new Date(from)),
        lte(transactions.date, new Date(to)),
        or(isNull(categories.name), notInArray(categories.name, NON_SPEND_CATEGORY_NAMES))
      )
    )
    .groupBy(categories.id, categories.name);

  const income: StatementRow[] = [];
  const expenses: StatementRow[] = [];

  for (const r of rows) {
    const net = Number(r.net);
    const name = r.categoryName ?? "Uncategorised";
    const categoryFilter = r.categoryId === null ? "uncategorised" : String(r.categoryId);
    if (net > 0) income.push({ name, amount: net, categoryFilter });
    else if (net < 0) expenses.push({ name, amount: -net, categoryFilter });
  }

  income.sort((a, b) => b.amount - a.amount);
  expenses.sort((a, b) => b.amount - a.amount);

  const totalIncome = income.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = expenses.reduce((sum, r) => sum + r.amount, 0);

  return { income, expenses, totalIncome, totalExpenses, net: totalIncome - totalExpenses };
}

/** The day before `dateStr` ("YYYY-MM-DD"), as "YYYY-MM-DD". */
function previousDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Net cash (non-investment accounts) as of `dateStr`, using each account's
 * most recent balance snapshot on or before that date. Returns null if no
 * account has a snapshot that old yet, rather than pretending the balance
 * was zero.
 */
async function netCashAsOf(dateStr: string): Promise<number | null> {
  const investmentTypes = [...INVESTMENT_ACCOUNT_TYPES];

  const rows = (await db.execute(sql`
    select coalesce(sum(latest.balance), 0) as total, count(*) as account_count
    from (
      select distinct on (s.account_id) s.account_id, s.balance
      from ${accountBalanceSnapshots} s
      join ${accounts} a on a.id = s.account_id
      where s.captured_on <= ${dateStr}
        and upper(a.type) not in (${sql.join(
          investmentTypes.map((t) => sql`${t}`),
          sql`, `
        )})
      order by s.account_id, s.captured_on desc
    ) latest
  `)) as unknown as { total: string; account_count: string }[];

  const row = rows[0];
  if (!row || Number(row.account_count) === 0) return null;
  return Number(row.total);
}

export interface CashflowMonth {
  /** "2026-07" */
  month: string;
  cashIn: number;
  cashOut: number;
  net: number;
}

export interface CashflowStatement {
  openingBalance: number | null;
  months: CashflowMonth[];
  totalIn: number;
  totalOut: number;
  totalNet: number;
  closingBalance: number | null;
  /** closing − (opening + Σ net) — interest/fees etc. not captured as transactions. Null if either balance is unknown. */
  otherChanges: number | null;
}

/**
 * A cashflow statement for [from, to] (inclusive, "YYYY-MM-DD"): opening
 * balance, one row per calendar month with cash in/out/net, and a closing
 * balance — over non-investment accounts only (bank, loan, credit card).
 * KiwiSaver/managed-fund accounts are excluded since they don't move via
 * day-to-day transactions the way cash does.
 */
export async function getCashflowStatement(from: string, to: string): Promise<CashflowStatement> {
  const investmentTypes = [...INVESTMENT_ACCOUNT_TYPES];

  const [monthRows, openingBalance, closingBalance] = await Promise.all([
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${transactions.date}), 'YYYY-MM')`,
        cashIn: sql<string>`coalesce(sum(case when ${transactions.amount} > 0 then ${transactions.amount} else 0 end), 0)`,
        cashOut: sql<string>`coalesce(sum(case when ${transactions.amount} < 0 then -${transactions.amount} else 0 end), 0)`,
      })
      .from(transactions)
      .innerJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          gte(transactions.date, new Date(from)),
          lte(transactions.date, new Date(to)),
          sql`upper(${accounts.type}) not in (${sql.join(
            investmentTypes.map((t) => sql`${t}`),
            sql`, `
          )})`
        )
      )
      .groupBy(sql`date_trunc('month', ${transactions.date})`)
      .orderBy(sql`date_trunc('month', ${transactions.date})`),
    netCashAsOf(previousDay(from)),
    netCashAsOf(to),
  ]);

  const months: CashflowMonth[] = monthRows.map((r) => ({
    month: r.month,
    cashIn: Number(r.cashIn),
    cashOut: Number(r.cashOut),
    net: Number(r.cashIn) - Number(r.cashOut),
  }));

  const totalIn = months.reduce((sum, m) => sum + m.cashIn, 0);
  const totalOut = months.reduce((sum, m) => sum + m.cashOut, 0);
  const totalNet = totalIn - totalOut;

  const otherChanges =
    openingBalance !== null && closingBalance !== null
      ? closingBalance - (openingBalance + totalNet)
      : null;

  return { openingBalance, months, totalIn, totalOut, totalNet, closingBalance, otherChanges };
}
