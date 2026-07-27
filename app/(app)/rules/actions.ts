"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rules } from "@/lib/db/schema";
import { getAuthorizedUser } from "@/lib/auth";
import { applyRuleToAllTransactions } from "@/lib/categorization/apply-rule";

async function insertRule(pattern: string, categoryId: number) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  if (!pattern || !categoryId) {
    throw new Error("A pattern and category are required.");
  }

  const [created] = await db.insert(rules).values({ pattern, categoryId }).returning({ id: rules.id });
  revalidatePath("/rules");
  return created.id;
}

export async function createRule(formData: FormData) {
  const pattern = String(formData.get("pattern") ?? "").trim();
  const categoryId = Number(formData.get("categoryId"));
  await insertRule(pattern, categoryId);
}

/** Same as createRule, but callable directly (e.g. from a toast action) instead of via a form. Returns the new rule's id. */
export async function createRuleFromValues(pattern: string, categoryId: number) {
  return insertRule(pattern.trim(), categoryId);
}

export async function updateRule(id: number, pattern: string, categoryId: number) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  const trimmed = pattern.trim();
  if (!trimmed || !categoryId) {
    throw new Error("A pattern and category are required.");
  }

  await db.update(rules).set({ pattern: trimmed, categoryId }).where(eq(rules.id, id));
  revalidatePath("/rules");
}

/** Applies a rule to every existing matching transaction, not just future ones. Returns how many were updated. */
export async function applyRuleRetroactively(ruleId: number) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  const count = await applyRuleToAllTransactions(ruleId);
  revalidatePath("/rules");
  revalidatePath("/transactions");
  return count;
}

export async function deleteRule(formData: FormData) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  const id = Number(formData.get("id"));
  await db.delete(rules).where(eq(rules.id, id));
  revalidatePath("/rules");
}
