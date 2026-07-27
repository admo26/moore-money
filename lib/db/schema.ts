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
 * A user-defined spending/income category (Groceries, Dining, Income, ...).
 * Seeded with a starter set; editable via the Rules page.
 */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * A user-editable categorisation rule: if `pattern` appears (case-
 * insensitively) in a transaction's description or merchant name, assign
 * `categoryId`. Rules are tried in `priority` order (lower first); the
 * first match wins.
 */
export const rules = pgTable("rules", {
  id: serial("id").primaryKey(),
  pattern: text("pattern").notNull(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  priority: integer("priority").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
  // Akahu's own ("Genie") merchant/category enrichment, kept as-is — a
  // signal the categorisation engine could use later, but not applied yet.
  akahuCategory: jsonb("akahu_category"),
  categoryId: integer("category_id").references(() => categories.id),
  // rule | ai | manual | null (uncategorised). A manual source is never
  // overwritten by a later rule/AI categorisation pass.
  categorySource: text("category_source"),
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

/**
 * A personal access token for the MCP server. Issued from the Settings page
 * by an allowlisted user; only the SHA-256 hash is stored, never the raw
 * token. `email` is rechecked against ALLOWED_EMAILS on every use, so
 * removing someone from the allowlist revokes their tokens too.
 */
export const mcpTokens = pgTable("mcp_tokens", {
  id: serial("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  email: text("email").notNull(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type SyncRun = typeof syncRuns.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Rule = typeof rules.$inferSelect;
export type McpToken = typeof mcpTokens.$inferSelect;
