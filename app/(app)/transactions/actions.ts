"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { getAuthorizedUser } from "@/lib/auth";

/** Manual category correction. Takes precedence over rule/AI runs going forward. */
export async function setTransactionCategory(transactionId: string, categoryId: number | null) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  await db
    .update(transactions)
    .set({
      categoryId,
      categorySource: categoryId ? "manual" : null,
      updatedAt: new Date(),
    })
    .where(eq(transactions.id, transactionId));

  revalidatePath("/transactions");
}
