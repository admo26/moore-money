import { isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, rules, transactions } from "@/lib/db/schema";
import { matchRule } from "./rules";
import { categorizeWithAI } from "./ai";
import { findTransferTransactionIds } from "./transfers";

export interface CategorizationResult {
  totalUncategorized: number;
  ruleMatched: number;
  transferMatched: number;
  aiMatched: number;
}

interface Assignment {
  id: string;
  categoryId: number;
}

const UPDATE_BATCH_SIZE = 500;

type CategorySource = "rule" | "ai" | "transfer-match";

/** Bulk-assigns categories in chunks of one multi-row UPDATE each, instead of one round-trip per row. */
async function bulkAssignCategories(assignments: Assignment[], source: CategorySource) {
  for (let i = 0; i < assignments.length; i += UPDATE_BATCH_SIZE) {
    const batch = assignments.slice(i, i + UPDATE_BATCH_SIZE);
    const values = sql.join(
      batch.map((a) => sql`(${a.id}::text, ${a.categoryId}::integer)`),
      sql`, `
    );

    await db.execute(sql`
      UPDATE ${transactions} AS t
      SET category_id = v.category_id, category_source = ${source}, updated_at = now()
      FROM (VALUES ${values}) AS v(id, category_id)
      WHERE t.id = v.id
    `);
  }
}

/**
 * Re-runs keyword rules against every non-manually-categorised transaction,
 * not just uncategorised ones. A newly-added rule (or an edited pattern)
 * should immediately correct any transaction it now matches, even if a
 * previous rule/AI/transfer-match pass already guessed something else for
 * it — rules are the most specific, deliberately-authored signal we have,
 * so they take priority over those other passes.
 */
export async function reapplyRules(): Promise<number> {
  const [allRules, candidates] = await Promise.all([
    db.select().from(rules),
    db
      .select({
        id: transactions.id,
        description: transactions.description,
        merchantName: transactions.merchantName,
        categoryId: transactions.categoryId,
        categorySource: transactions.categorySource,
      })
      .from(transactions)
      .where(or(isNull(transactions.categorySource), ne(transactions.categorySource, "manual"))),
  ]);

  if (allRules.length === 0) return 0;

  const assignments: Assignment[] = [];
  for (const tx of candidates) {
    const rule = matchRule(tx, allRules);
    if (rule && (rule.categoryId !== tx.categoryId || tx.categorySource !== "rule")) {
      assignments.push({ id: tx.id, categoryId: rule.categoryId });
    }
  }

  if (assignments.length > 0) {
    await bulkAssignCategories(assignments, "rule");
  }

  return assignments.length;
}

/**
 * Finds pairs of transactions that are really just the household moving
 * money between its own accounts (e.g. paying off a credit card from the
 * linked account) and assigns them to the "Transfers" category. Unlike
 * rules/AI, this looks at every non-manually-categorised, non-rule-matched
 * transaction, not just uncategorised ones — a transfer leg can otherwise
 * get mis-guessed as Income or Shopping by the per-transaction rule/AI
 * passes, since neither has visibility into the matching leg on the other
 * account. Rule matches (e.g. a specific "pocket money" pattern) win over
 * this generic transfer detection — run `reapplyRules` first.
 */
export async function recategorizeTransfers(): Promise<number> {
  const [allCategories, allTransactions] = await Promise.all([
    db.select().from(categories),
    db
      .select({
        id: transactions.id,
        accountId: transactions.accountId,
        amount: transactions.amount,
        date: transactions.date,
        categorySource: transactions.categorySource,
      })
      .from(transactions),
  ]);

  const transfersCategory = allCategories.find(
    (c) => c.name.toLowerCase() === "transfers"
  );
  if (!transfersCategory) return 0;

  const matchedIds = findTransferTransactionIds(allTransactions);
  const assignments: Assignment[] = allTransactions
    .filter(
      (t) =>
        matchedIds.has(t.id) &&
        t.categorySource !== "manual" &&
        t.categorySource !== "rule"
    )
    .map((t) => ({ id: t.id, categoryId: transfersCategory.id }));

  if (assignments.length > 0) {
    await bulkAssignCategories(assignments, "transfer-match");
  }

  return assignments.length;
}

/**
 * Categorises every transaction without a category yet: rules first (most
 * specific), then transfer-matching (deterministic, cross-account), then
 * the AI Gateway for whatever's left. Manually categorised transactions
 * (category_source = "manual") are never touched.
 */
export async function categorizeUncategorized(): Promise<CategorizationResult> {
  const ruleMatched = await reapplyRules();
  const transferMatched = await recategorizeTransfers();

  const [allCategories, stillUncategorized] = await Promise.all([
    db.select().from(categories),
    db.select().from(transactions).where(isNull(transactions.categoryId)),
  ]);

  const totalUncategorized = stillUncategorized.length;

  let aiMatched = 0;
  if (stillUncategorized.length > 0 && process.env.AI_GATEWAY_API_KEY) {
    const categoryIdByName = new Map(
      allCategories.map((c) => [c.name.toLowerCase(), c.id])
    );
    const nameAssignments = await categorizeWithAI(stillUncategorized, allCategories);

    const aiAssignments: Assignment[] = [];
    for (const [transactionId, categoryName] of nameAssignments) {
      const categoryId = categoryIdByName.get(categoryName.toLowerCase());
      if (categoryId) aiAssignments.push({ id: transactionId, categoryId });
    }

    if (aiAssignments.length > 0) {
      await bulkAssignCategories(aiAssignments, "ai");
    }
    aiMatched = aiAssignments.length;
  }

  return {
    totalUncategorized,
    ruleMatched,
    transferMatched,
    aiMatched,
  };
}
