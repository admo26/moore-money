import { and, asc, desc, eq, gte, ilike, isNull, lte, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts, categories, transactions, type Account, type Category } from "@/lib/db/schema";
import { TransactionsFilters } from "@/components/transactions-filters";
import { TransactionsTable, type TransactionRow } from "@/components/transactions-table";
import { SyncButton } from "@/components/sync-button";

interface SearchParams {
  q?: string;
  accountId?: string;
  categoryId?: string;
  from?: string;
  to?: string;
  minAmount?: string;
  maxAmount?: string;
}

const PAGE_SIZE = 200;

async function loadData(params: SearchParams) {
  const [allAccounts, allCategories] = await Promise.all([
    db.select().from(accounts),
    db.select().from(categories).orderBy(asc(categories.name)),
  ]);

  const conditions = [];
  if (params.accountId) conditions.push(eq(transactions.accountId, params.accountId));
  if (params.categoryId === "uncategorised") {
    conditions.push(isNull(transactions.categoryId));
  } else if (params.categoryId) {
    conditions.push(eq(transactions.categoryId, Number(params.categoryId)));
  }
  if (params.from) conditions.push(gte(transactions.date, new Date(params.from)));
  if (params.to) conditions.push(lte(transactions.date, new Date(params.to)));
  if (params.minAmount) conditions.push(gte(transactions.amount, params.minAmount));
  if (params.maxAmount) conditions.push(lte(transactions.amount, params.maxAmount));
  if (params.q) {
    const pattern = `%${params.q}%`;
    conditions.push(
      or(ilike(transactions.description, pattern), ilike(transactions.merchantName, pattern))
    );
  }

  const rows = await db
    .select({
      id: transactions.id,
      accountId: transactions.accountId,
      date: transactions.date,
      amount: transactions.amount,
      description: transactions.description,
      merchantName: transactions.merchantName,
      type: transactions.type,
      balance: transactions.balance,
      akahuCategory: transactions.akahuCategory,
      categoryId: transactions.categoryId,
      categorySource: transactions.categorySource,
      raw: transactions.raw,
      createdAt: transactions.createdAt,
      updatedAt: transactions.updatedAt,
      accountName: accounts.name,
      connectionName: accounts.connectionName,
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactions.date))
    .limit(PAGE_SIZE);

  return { accounts: allAccounts, categories: allCategories, rows: rows as TransactionRow[] };
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  let accounts_: Account[] = [];
  let categories_: Category[] = [];
  let rows: TransactionRow[] = [];
  let error: string | null = null;

  try {
    const data = await loadData(params);
    accounts_ = data.accounts;
    categories_ = data.categories;
    rows = data.rows;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load transactions.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            All transactions synced from Akahu
            {rows.length === PAGE_SIZE ? ` (showing latest ${PAGE_SIZE})` : ""}.
          </p>
        </div>
        <SyncButton />
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Couldn&apos;t load transactions: {error}
        </div>
      ) : (
        <>
          <TransactionsFilters accounts={accounts_} categories={categories_} defaults={params} />
          <TransactionsTable rows={rows} categories={categories_} />
        </>
      )}
    </div>
  );
}
