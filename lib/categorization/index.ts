import { eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, rules, transactions } from "@/lib/db/schema";
import { matchRule } from "./rules";
import { categorizeWithAI } from "./ai";

export interface CategorizationResult {
  totalUncategorized: number;
  ruleMatched: number;
  aiMatched: number;
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

  const stillUncategorized = [];
  let ruleMatched = 0;

  for (const tx of uncategorized) {
    const rule = matchRule(tx, allRules);
    if (rule) {
      await db
        .update(transactions)
        .set({ categoryId: rule.categoryId, categorySource: "rule", updatedAt: new Date() })
        .where(eq(transactions.id, tx.id));
      ruleMatched++;
    } else {
      stillUncategorized.push(tx);
    }
  }

  let aiMatched = 0;
  if (stillUncategorized.length > 0 && process.env.AI_GATEWAY_API_KEY) {
    const categoryIdByName = new Map(
      allCategories.map((c) => [c.name.toLowerCase(), c.id])
    );
    const assignments = await categorizeWithAI(stillUncategorized, allCategories);

    for (const [transactionId, categoryName] of assignments) {
      const categoryId = categoryIdByName.get(categoryName.toLowerCase());
      if (!categoryId) continue;
      await db
        .update(transactions)
        .set({ categoryId, categorySource: "ai", updatedAt: new Date() })
        .where(eq(transactions.id, transactionId));
      aiMatched++;
    }
  }

  return { totalUncategorized, ruleMatched, aiMatched };
}
