"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, mcpTokens, rules, transactions } from "@/lib/db/schema";
import { getAuthorizedUser } from "@/lib/auth";
import { generateToken, hashToken } from "@/lib/mcp/tokens";

/** Creates a new MCP personal access token. Returns the raw token — shown once, never stored. */
export async function createMcpToken(label: string) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  const trimmed = label.trim();
  if (!trimmed) throw new Error("A label is required.");

  const token = generateToken();
  await db.insert(mcpTokens).values({
    tokenHash: hashToken(token),
    email: user.email!,
    label: trimmed,
  });

  revalidatePath("/settings");
  return token;
}

export async function revokeMcpToken(id: number) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  await db.update(mcpTokens).set({ revokedAt: new Date() }).where(eq(mcpTokens.id, id));
  revalidatePath("/settings");
}

export async function createCategory(name: string) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  const trimmed = name.trim();
  if (!trimmed) throw new Error("A name is required.");

  await db.insert(categories).values({ name: trimmed });
  revalidatePath("/settings");
}

export async function updateCategory(id: number, name: string) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  const trimmed = name.trim();
  if (!trimmed) throw new Error("A name is required.");

  await db.update(categories).set({ name: trimmed }).where(eq(categories.id, id));
  revalidatePath("/settings");
  revalidatePath("/rules");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function setCategoryFavourite(id: number, isFavourite: boolean) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  await db.update(categories).set({ isFavourite }).where(eq(categories.id, id));
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

/**
 * Deletes a category. Rules pointing at it are deleted too (a rule without
 * a category doesn't mean anything), and transactions using it are reset to
 * uncategorised rather than left dangling or blocked by the FK constraint.
 */
export async function deleteCategory(id: number) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  await db.transaction(async (tx) => {
    await tx.delete(rules).where(eq(rules.categoryId, id));
    await tx
      .update(transactions)
      .set({ categoryId: null, categorySource: null })
      .where(eq(transactions.categoryId, id));
    await tx.delete(categories).where(eq(categories.id, id));
  });

  revalidatePath("/settings");
  revalidatePath("/rules");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}
