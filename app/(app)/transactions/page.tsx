import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, lte, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  accounts,
  categories,
  syncRuns,
  transactions,
  type Account,
  type Category,
} from "@/lib/db/schema";
import { TransactionsToolbar } from "@/components/transactions-toolbar";
import { TransactionsTable, type TransactionRow } from "@/components/transactions-table";
import { TransactionsPagination } from "@/components/transactions-pagination";
import { SyncButton } from "@/components/sync-button";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorBanner } from "@/components/ui/error-banner";
import { formatRelativeTime } from "@/lib/format";

interface SearchParams {
  [key: string]: string | undefined;
  q?: string;
  accountIds?: string;
  categoryIds?: string;
  from?: string;
  to?: string;
  minAmount?: string;
  maxAmount?: string;
  sortBy?: string;
  sortDir?: string;
  page?: string;
}

const PAGE_SIZE = 50;

function parseSort(params: SearchParams) {
  const sortBy = params.sortBy === "amount" ? "amount" : "date";
  const sortDir = params.sortDir === "asc" ? "asc" : "desc";
  return { sortBy, sortDir };
}

function parsePage(params: SearchParams) {
  const page = Number(params.page);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

async function loadData(params: SearchParams) {
  const [allAccounts, allCategories, [lastSyncRow]] = await Promise.all([
    db.select().from(accounts),
    db.select().from(categories).orderBy(asc(categories.name)),
    db
      .select({ finishedAt: syncRuns.finishedAt })
      .from(syncRuns)
      .where(eq(syncRuns.status, "success"))
      .orderBy(desc(syncRuns.finishedAt))
      .limit(1),
  ]);

  const conditions = [];

  const accountIds = params.accountIds ? params.accountIds.split(",").filter(Boolean) : [];
  if (accountIds.length > 0) conditions.push(inArray(transactions.accountId, accountIds));

  const categoryIds = params.categoryIds ? params.categoryIds.split(",").filter(Boolean) : [];
  if (categoryIds.length > 0) {
    const includeUncategorised = categoryIds.includes("uncategorised");
    const numericIds = categoryIds.filter((id) => id !== "uncategorised").map(Number);

    if (includeUncategorised && numericIds.length > 0) {
      conditions.push(
        or(isNull(transactions.categoryId), inArray(transactions.categoryId, numericIds))
      );
    } else if (includeUncategorised) {
      conditions.push(isNull(transactions.categoryId));
    } else {
      conditions.push(inArray(transactions.categoryId, numericIds));
    }
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

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const { sortBy, sortDir } = parseSort(params);
  const sortColumn = sortBy === "amount" ? transactions.amount : transactions.date;
  const orderFn = sortDir === "asc" ? asc : desc;
  const page = parsePage(params);

  const [rows, [{ total }]] = await Promise.all([
    db
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
      .where(where)
      .orderBy(orderFn(sortColumn))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(transactions).where(where),
  ]);

  return {
    accounts: allAccounts,
    categories: allCategories,
    rows: rows as TransactionRow[],
    total,
    lastSyncedAt: lastSyncRow?.finishedAt ?? null,
  };
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
  let total = 0;
  let lastSyncedAt: Date | null = null;
  let error: string | null = null;

  try {
    const data = await loadData(params);
    accounts_ = data.accounts;
    categories_ = data.categories;
    rows = data.rows;
    total = data.total;
    lastSyncedAt = data.lastSyncedAt;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load transactions.";
  }

  const { sortBy, sortDir } = parseSort(params);
  const page = parsePage(params);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const lastSyncedText = lastSyncedAt
    ? `Last synced ${formatRelativeTime(lastSyncedAt)}.`
    : "Never synced.";
  const countText = total === 0 ? "All transactions." : `Showing ${rangeStart}–${rangeEnd} of ${total} transactions.`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Transactions
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-secondary px-1.5 text-sm font-medium text-secondary-foreground">
              {total}
            </span>
          </span>
        }
        description={`${countText} ${lastSyncedText}`}
        action={<SyncButton />}
      />

      {error ? (
        <ErrorBanner>Couldn&apos;t load transactions: {error}</ErrorBanner>
      ) : (
        <>
          <TransactionsToolbar
            accounts={accounts_}
            categories={categories_}
            defaults={{ ...params, sortBy, sortDir }}
          />
          <TransactionsTable rows={rows} categories={categories_} />
          <TransactionsPagination page={page} totalPages={totalPages} searchParams={params} />
        </>
      )}
    </div>
  );
}
