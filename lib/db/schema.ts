import {
  pgTable,
  text,
  numeric,
  timestamp,
  jsonb,
  integer,
  serial,
} from "drizzle-orm/pg-core";

/**
 * A bank/card account as reported by Akahu (e.g. an ANZ transaction account,
 * or an American Express credit card). `id` is Akahu's own account `_id`, so
 * upserts on sync are naturally idempotent.
 */
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  connectionName: text("connection_name").notNull(),
  currency: text("currency").notNull().default("NZD"),
  currentBalance: numeric("current_balance", { precision: 14, scale: 2 }),
  availableBalance: numeric("available_balance", { precision: 14, scale: 2 }),
  lastRefreshed: timestamp("last_refreshed", { withTimezone: true }),
  raw: jsonb("raw"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * A single bank transaction as reported by Akahu. `id` is Akahu's own
 * transaction `_id`; syncs upsert on this key so re-pulling a date range
 * never duplicates rows.
 */
export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  date: timestamp("date", { withTimezone: true }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  description: text("description").notNull(),
  merchantName: text("merchant_name"),
  type: text("type"),
  balance: numeric("balance", { precision: 14, scale: 2 }),
  // Akahu's own ("Genie") merchant/category enrichment, kept as-is for later
  // use by the rules + AI categorisation phase.
  akahuCategory: jsonb("akahu_category"),
  raw: jsonb("raw"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One row per Akahu sync (cron or manual). Tracks how far the sync got so
 * the next run can resume from `highWaterMark` instead of re-pulling
 * everything.
 */
export const syncRuns = pgTable("sync_runs", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  status: text("status").notNull().default("running"), // running | success | error
  transactionsIngested: integer("transactions_ingested").notNull().default(0),
  error: text("error"),
  highWaterMark: timestamp("high_water_mark", { withTimezone: true }),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type SyncRun = typeof syncRuns.$inferSelect;
