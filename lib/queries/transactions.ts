import { and, desc, eq, gte, ilike, isNull, lte, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts, transactions } from "@/lib/db/schema";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export interface ListTransactionsArgs {
  accountId?: string;
  categoryId?: number | "uncategorised";
  dateFrom?: string;
  dateTo?: string;
  minAmount?: string;
  maxAmount?: string;
  search?: string;
  limit?: number;
}

export async function listTransactions(args: ListTransactionsArgs) {
  const conditions = [];
  if (args.accountId) conditions.push(eq(transactions.accountId, args.accountId));
  if (args.categoryId === "uncategorised") {
    conditions.push(isNull(transactions.categoryId));
  } else if (typeof args.categoryId === "number") {
    conditions.push(eq(transactions.categoryId, args.categoryId));
  }
  if (args.dateFrom) conditions.push(gte(transactions.date, new Date(args.dateFrom)));
  if (args.dateTo) conditions.push(lte(transactions.date, new Date(args.dateTo)));
  if (args.minAmount) conditions.push(gte(transactions.amount, args.minAmount));
  if (args.maxAmount) conditions.push(lte(transactions.amount, args.maxAmount));
  if (args.search) {
    const pattern = `%${args.search}%`;
    conditions.push(
      or(ilike(transactions.description, pattern), ilike(transactions.merchantName, pattern))
    );
  }

  const limit = Math.min(args.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

  return db
    .select({
      id: transactions.id,
      accountId: transactions.accountId,
      accountName: accounts.name,
      date: transactions.date,
      amount: transactions.amount,
      description: transactions.description,
      merchantName: transactions.merchantName,
      type: transactions.type,
      balance: transactions.balance,
      categoryId: transactions.categoryId,
      categorySource: transactions.categorySource,
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactions.date))
    .limit(limit);
}
