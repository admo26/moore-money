"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rules } from "@/lib/db/schema";
import { getAuthorizedUser } from "@/lib/auth";

async function insertRule(pattern: string, categoryId: number) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  if (!pattern || !categoryId) {
    throw new Error("A pattern and category are required.");
  }

  await db.insert(rules).values({ pattern, categoryId });
  revalidatePath("/rules");
}

export async function createRule(formData: FormData) {
  const pattern = String(formData.get("pattern") ?? "").trim();
  const categoryId = Number(formData.get("categoryId"));
  await insertRule(pattern, categoryId);
}

/** Same as createRule, but callable directly (e.g. from a toast action) instead of via a form. */
export async function createRuleFromValues(pattern: string, categoryId: number) {
  await insertRule(pattern.trim(), categoryId);
}

export async function deleteRule(formData: FormData) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  const id = Number(formData.get("id"));
  await db.delete(rules).where(eq(rules.id, id));
  revalidatePath("/rules");
}
