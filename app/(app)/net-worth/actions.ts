"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { holdings } from "@/lib/db/schema";
import { getAuthorizedUser } from "@/lib/auth";

export async function createHolding(symbol: string, type: string, quantity: string) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  const trimmedSymbol = symbol.trim().toUpperCase();
  const trimmedQuantity = quantity.trim();

  if (
    !trimmedSymbol ||
    !["stock", "crypto"].includes(type) ||
    !trimmedQuantity ||
    Number(trimmedQuantity) <= 0
  ) {
    throw new Error("A symbol, type, and positive quantity are required.");
  }

  await db.insert(holdings).values({ symbol: trimmedSymbol, type, quantity: trimmedQuantity });
  revalidatePath("/net-worth");
}

export async function deleteHolding(formData: FormData) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  const id = Number(formData.get("id"));
  await db.delete(holdings).where(eq(holdings.id, id));
  revalidatePath("/net-worth");
}
