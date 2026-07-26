import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts, syncRuns, transactions } from "@/lib/db/schema";
import { categorizeUncategorized } from "@/lib/categorization";
import { getAccounts, getTransactions } from "./client";
import type { AkahuAccount, AkahuTransaction } from "./types";

function toNumericString(n: number | undefined | null): string | null {
  return n === undefined || n === null ? null : n.toString();
}

function accountRow(a: AkahuAccount) {
  return {
    id: a._id,
    name: a.name,
    type: a.type,
    connectionName: a.connection.name,
    currency: a.balance?.currency ?? "NZD",
    currentBalance: toNumericString(a.balance?.current),
    availableBalance: toNumericString(a.balance?.available),
    lastRefreshed: a.refreshed?.balance ? new Date(a.refreshed.balance) : null,
    raw: a,
    updatedAt: new Date(),
  };
}

function transactionRow(t: AkahuTransaction) {
  return {
    id: t._id,
    accountId: t._account,
    date: new Date(t.date),
    amount: t.amount.toString(),
    description: t.description,
    merchantName: t.merchant?.name ?? null,
    type: t.type ?? null,
    balance: toNumericString(t.balance),
    akahuCategory: t.category ?? null,
    raw: t,
    updatedAt: new Date(),
  };
}

/** The last successful sync's high-water mark, if any. */
async function getLastHighWaterMark(): Promise<Date | undefined> {
  const [lastSuccess] = await db
    .select({ highWaterMark: syncRuns.highWaterMark })
    .from(syncRuns)
    .where(eq(syncRuns.status, "success"))
    .orderBy(desc(syncRuns.startedAt))
    .limit(1);

  return lastSuccess?.highWaterMark ?? undefined;
}

export interface SyncResult {
  accountsUpserted: number;
  transactionsUpserted: number;
}

/**
 * Pulls accounts + transactions from Akahu and upserts them. Safe to call
 * repeatedly (accounts/transactions are keyed on Akahu's own `_id`, so
 * re-syncing an overlapping window never duplicates rows).
 */
export async function runSync(): Promise<SyncResult> {
  const startedAt = new Date();
  const [run] = await db
    .insert(syncRuns)
    .values({ startedAt, status: "running" })
    .returning({ id: syncRuns.id });

  try {
    const since = await getLastHighWaterMark();

    const akahuAccounts = await getAccounts();
    if (akahuAccounts.length > 0) {
      await db
        .insert(accounts)
        .values(akahuAccounts.map(accountRow))
        .onConflictDoUpdate({
          target: accounts.id,
          set: {
            name: sql`excluded.name`,
            type: sql`excluded.type`,
            connectionName: sql`excluded.connection_name`,
            currency: sql`excluded.currency`,
            currentBalance: sql`excluded.current_balance`,
            availableBalance: sql`excluded.available_balance`,
            lastRefreshed: sql`excluded.last_refreshed`,
            raw: sql`excluded.raw`,
            updatedAt: sql`excluded.updated_at`,
          },
        });
    }

    const akahuTransactions = await getTransactions({ start: since });
    if (akahuTransactions.length > 0) {
      // Batch to stay well under any single-statement parameter limits.
      const BATCH_SIZE = 500;
      for (let i = 0; i < akahuTransactions.length; i += BATCH_SIZE) {
        const batch = akahuTransactions.slice(i, i + BATCH_SIZE).map(transactionRow);
        await db
          .insert(transactions)
          .values(batch)
          .onConflictDoUpdate({
            target: transactions.id,
            set: {
              accountId: sql`excluded.account_id`,
              date: sql`excluded.date`,
              amount: sql`excluded.amount`,
              description: sql`excluded.description`,
              merchantName: sql`excluded.merchant_name`,
              type: sql`excluded.type`,
              balance: sql`excluded.balance`,
              akahuCategory: sql`excluded.akahu_category`,
              raw: sql`excluded.raw`,
              updatedAt: sql`excluded.updated_at`,
            },
          });
      }
    }

    const newHighWaterMark = akahuTransactions.reduce<Date | undefined>(
      (latest, t) => {
        const d = new Date(t.date);
        return !latest || d > latest ? d : latest;
      },
      since
    );

    await db
      .update(syncRuns)
      .set({
        finishedAt: new Date(),
        status: "success",
        transactionsIngested: akahuTransactions.length,
        highWaterMark: newHighWaterMark,
      })
      .where(eq(syncRuns.id, run.id));

    // Categorisation is a best-effort layer on top of the sync — a failure
    // here (e.g. AI Gateway hiccup) shouldn't mark the sync itself as
    // failed, since the actual data pull already succeeded.
    try {
      await categorizeUncategorized();
    } catch (err) {
      console.error("Categorisation failed", err);
    }

    return {
      accountsUpserted: akahuAccounts.length,
      transactionsUpserted: akahuTransactions.length,
    };
  } catch (err) {
    await db
      .update(syncRuns)
      .set({
        finishedAt: new Date(),
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      })
      .where(eq(syncRuns.id, run.id));
    throw err;
  }
}
