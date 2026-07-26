import type { Rule, Transaction } from "@/lib/db/schema";

/**
 * First rule (in priority order, lower first) whose pattern appears
 * case-insensitively in the transaction's merchant name or description.
 */
export function matchRule(
  transaction: Pick<Transaction, "description" | "merchantName">,
  rules: Rule[]
): Rule | null {
  const haystacks = [transaction.description, transaction.merchantName]
    .filter((s): s is string => Boolean(s))
    .map((s) => s.toLowerCase());

  const sorted = [...rules].sort((a, b) => a.priority - b.priority);

  for (const rule of sorted) {
    const pattern = rule.pattern.toLowerCase();
    if (haystacks.some((h) => h.includes(pattern))) {
      return rule;
    }
  }

  return null;
}
