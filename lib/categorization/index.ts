import { isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, rules, transactions } from "@/lib/db/schema";
import { matchRule } from "./rules";
import { categorizeWithAI } from "./ai";

export interface CategorizationResult {
  totalUncategorized: number;
  ruleMatched: number;
  aiMatched: number;
}

interface Assignment {
  id: string;
  categoryId: number;
}

const UPDATE_BATCH_SIZE = 500;

/** Bulk-assigns categories in chunks of one multi-row UPDATE each, instead of one round-trip per row. */
async function bulkAssignCategories(assignments: Assignment[], source: "rule" | "ai") {
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
 * Categorises every transaction without a category yet: rules first (fast,
 * free, deterministic), then the AI Gateway for whatever's left. Manually
 * categorised transactions (category_id already set) are never touched.
 */
export async function categorizeUncategorized(): Promise<CategorizationResult> {
  const [allCategories, allRules, uncategorized] = await Promise.all([
    db.select().from(categories),
    db.select().from(rules),
    db.select().from(transactions).where(isNull(transactions.categoryId)),
  ]);

  const totalUncategorized = uncategorized.length;
  if (totalUncategorized === 0) {
    return { totalUncategorized: 0, ruleMatched: 0, aiMatched: 0 };
  }

  const ruleAssignments: Assignment[] = [];
  const stillUncategorized = [];

  for (const tx of uncategorized) {
    const rule = matchRule(tx, allRules);
    if (rule) {
      ruleAssignments.push({ id: tx.id, categoryId: rule.categoryId });
    } else {
      stillUncategorized.push(tx);
    }
  }

  if (ruleAssignments.length > 0) {
    await bulkAssignCategories(ruleAssignments, "rule");
  }

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

  return { totalUncategorized, ruleMatched: ruleAssignments.length, aiMatched };
}
