import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, rules, transactions } from "@/lib/db/schema";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function categoryExists(categoryId: number) {
  const [row] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId));
  return !!row;
}

export async function categorizeTransaction(
  transactionId: string,
  categoryId: number
): Promise<Result<{ transactionId: string }>> {
  if (!(await categoryExists(categoryId))) {
    return { ok: false, error: `Category ${categoryId} not found.` };
  }

  const result = await db
    .update(transactions)
    .set({ categoryId, categorySource: "manual", updatedAt: new Date() })
    .where(eq(transactions.id, transactionId))
    .returning({ id: transactions.id });

  if (result.length === 0) {
    return { ok: false, error: `Transaction ${transactionId} not found.` };
  }
  return { ok: true, data: { transactionId } };
}

export async function createRule(
  pattern: string,
  categoryId: number,
  priority?: number
): Promise<Result<{ id: number }>> {
  const trimmed = pattern.trim();
  if (!trimmed) return { ok: false, error: "A pattern is required." };
  if (!(await categoryExists(categoryId))) {
    return { ok: false, error: `Category ${categoryId} not found.` };
  }

  const [created] = await db
    .insert(rules)
    .values({ pattern: trimmed, categoryId, priority: priority ?? 0 })
    .returning({ id: rules.id });

  return { ok: true, data: { id: created.id } };
}

export async function updateRule(
  id: number,
  patch: { pattern?: string; categoryId?: number; priority?: number }
): Promise<Result<{ id: number }>> {
  const [existing] = await db.select({ id: rules.id }).from(rules).where(eq(rules.id, id));
  if (!existing) return { ok: false, error: `Rule ${id} not found.` };

  if (patch.categoryId !== undefined && !(await categoryExists(patch.categoryId))) {
    return { ok: false, error: `Category ${patch.categoryId} not found.` };
  }

  const set: { pattern?: string; categoryId?: number; priority?: number } = {};
  if (patch.pattern !== undefined) set.pattern = patch.pattern.trim();
  if (patch.categoryId !== undefined) set.categoryId = patch.categoryId;
  if (patch.priority !== undefined) set.priority = patch.priority;

  if (Object.keys(set).length > 0) {
    await db.update(rules).set(set).where(eq(rules.id, id));
  }
  return { ok: true, data: { id } };
}

export async function deleteRule(id: number): Promise<Result<{ id: number }>> {
  const result = await db.delete(rules).where(eq(rules.id, id)).returning({ id: rules.id });
  if (result.length === 0) return { ok: false, error: `Rule ${id} not found.` };
  return { ok: true, data: { id } };
}
