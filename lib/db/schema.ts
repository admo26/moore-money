import {
  pgTable,
  text,
  numeric,
  timestamp,
  date,
  jsonb,
  integer,
  serial,
  unique,
  boolean,
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
  logo: text("logo"),
  currency: text("currency").notNull().default("NZD"),
  currentBalance: numeric("current_balance", { precision: 14, scale: 2 }),
  availableBalance: numeric("available_balance", { precision: 14, scale: 2 }),
  lastRefreshed: timestamp("last_refreshed", { withTimezone: true }),
  raw: jsonb("raw"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/**
 * A snapshot of one account's balance on one calendar day. Written on every
 * sync for every account (not just ones with transactions), which is what
 * lets the net-worth trend include investment/KiwiSaver accounts — Akahu
 * reports a balance for those but usually no transaction history at all.
 */
export const accountBalanceSnapshots = pgTable(
  "account_balance_snapshots",
  {
    id: serial("id").primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id),
    capturedOn: date("captured_on").notNull(),
    balance: numeric("balance", { precision: 14, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.accountId, table.capturedOn)]
).enableRLS();

/**
 * A user-defined spending/income category (Groceries, Dining, Income, ...).
 * Seeded with a starter set; editable via the Rules page.
 */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  // Starred in Settings — used to default which categories the dashboard's
  // category trend chart shows, without the user re-picking every time.
  isFavourite: boolean("is_favourite").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

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
}).enableRLS();

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
}).enableRLS();

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
}).enableRLS();

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
}).enableRLS();

/**
 * An OAuth 2.0 client dynamically registered against the MCP authorization
 * server (e.g. Claude.ai adding this as a custom connector). Public clients
 * only — auth is PKCE-based, so no client secret is stored.
 */
export const mcpOauthClients = pgTable("mcp_oauth_clients", {
  id: text("id").primaryKey(),
  clientName: text("client_name"),
  redirectUris: jsonb("redirect_uris").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/**
 * A short-lived, single-use authorization code issued after a user approves
 * an OAuth client at the consent screen. Exchanged for tokens at the token
 * endpoint; `codeChallenge` binds the exchange to the PKCE verifier the
 * client generated at the start of the flow.
 */
export const mcpOauthCodes = pgTable("mcp_oauth_codes", {
  id: serial("id").primaryKey(),
  codeHash: text("code_hash").notNull().unique(),
  clientId: text("client_id")
    .notNull()
    .references(() => mcpOauthClients.id),
  email: text("email").notNull(),
  redirectUri: text("redirect_uri").notNull(),
  codeChallenge: text("code_challenge").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/**
 * An access/refresh token pair issued to an OAuth client. Mirrors
 * `mcpTokens`' revocation/allowlist semantics but supports expiry and
 * refresh-token rotation, since these are minted automatically rather than
 * user-managed.
 */
export const mcpOauthTokens = pgTable("mcp_oauth_tokens", {
  id: serial("id").primaryKey(),
  accessTokenHash: text("access_token_hash").notNull().unique(),
  refreshTokenHash: text("refresh_token_hash").unique(),
  clientId: text("client_id")
    .notNull()
    .references(() => mcpOauthClients.id),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/**
 * A manually-entered asset — unlike `accounts`, there's no Akahu-synced
 * source for these. For `stock`/`crypto`, the user enters symbol/quantity
 * and a price is fetched from a market-data API (see lib/holdings/prices.ts);
 * for `property`, there's no market API, so address/value are both entered
 * and kept up to date by hand — symbol/quantity are null for those rows, and
 * address/manualValue are null for the priced types.
 */
export const holdings = pgTable("holdings", {
  id: serial("id").primaryKey(),
  symbol: text("symbol"),
  type: text("type").notNull(), // stock | crypto | property
  quantity: numeric("quantity", { precision: 20, scale: 8 }),
  address: text("address"),
  manualValue: numeric("manual_value", { precision: 14, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/**
 * Latest fetched price per symbol, doubling as both history and a TTL cache
 * — a fetch is skipped if the newest row for a symbol is recent enough (see
 * lib/holdings/prices.ts), the same role accountBalanceSnapshots plays for
 * Akahu accounts.
 */
export const holdingPriceSnapshots = pgTable("holding_price_snapshots", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  price: numeric("price", { precision: 20, scale: 8 }).notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type SyncRun = typeof syncRuns.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Rule = typeof rules.$inferSelect;
export type McpToken = typeof mcpTokens.$inferSelect;
export type AccountBalanceSnapshot = typeof accountBalanceSnapshots.$inferSelect;
export type Holding = typeof holdings.$inferSelect;
export type NewHolding = typeof holdings.$inferInsert;
export type HoldingPriceSnapshot = typeof holdingPriceSnapshots.$inferSelect;
export type McpOauthClient = typeof mcpOauthClients.$inferSelect;
export type McpOauthCode = typeof mcpOauthCodes.$inferSelect;
export type McpOauthToken = typeof mcpOauthTokens.$inferSelect;
