"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { holdings } from "@/lib/db/schema";
import { getAuthorizedUser } from "@/lib/auth";

export async function createHolding(formData: FormData) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  const symbol = String(formData.get("symbol") ?? "").trim().toUpperCase();
  const type = String(formData.get("type") ?? "");
  const quantity = String(formData.get("quantity") ?? "").trim();

  if (!symbol || !["stock", "crypto"].includes(type) || !quantity || Number(quantity) <= 0) {
    throw new Error("A symbol, type, and positive quantity are required.");
  }

  await db.insert(holdings).values({ symbol, type, quantity });
  revalidatePath("/net-worth");
}

export async function deleteHolding(formData: FormData) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  const id = Number(formData.get("id"));
  await db.delete(holdings).where(eq(holdings.id, id));
  revalidatePath("/net-worth");
}
