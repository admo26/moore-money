import { eq, inArray, ne, or, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { rules, transactions } from "@/lib/db/schema";
import { matchRule } from "./rules";

const UPDATE_BATCH_SIZE = 500;

/**
 * Applies a single rule to every existing transaction that matches its
 * pattern, not just future ones. Manually-categorised transactions are left
 * alone; anything else (uncategorised, rule-matched, AI-matched,
 * transfer-matched) can be overwritten by this rule if it matches.
 */
export async function applyRuleToAllTransactions(ruleId: number): Promise<number> {
  const [rule] = await db.select().from(rules).where(eq(rules.id, ruleId));
  if (!rule) throw new Error("Rule not found");

  const candidates = await db
    .select({
      id: transactions.id,
      description: transactions.description,
      merchantName: transactions.merchantName,
    })
    .from(transactions)
    .where(or(isNull(transactions.categorySource), ne(transactions.categorySource, "manual")));

  const matchingIds = candidates
    .filter((tx) => matchRule(tx, [rule]))
    .map((tx) => tx.id);

  for (let i = 0; i < matchingIds.length; i += UPDATE_BATCH_SIZE) {
    const batch = matchingIds.slice(i, i + UPDATE_BATCH_SIZE);
    await db
      .update(transactions)
      .set({ categoryId: rule.categoryId, categorySource: "rule", updatedAt: new Date() })
      .where(inArray(transactions.id, batch));
  }

  return matchingIds.length;
}
