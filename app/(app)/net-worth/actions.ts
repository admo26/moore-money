"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { holdings } from "@/lib/db/schema";
import { getAuthorizedUser } from "@/lib/auth";

export async function createHolding(input: {
  type: string;
  symbol?: string;
  quantity?: string;
  address?: string;
  manualValue?: string;
}) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  if (input.type === "property") {
    const address = (input.address ?? "").trim();
    const manualValue = (input.manualValue ?? "").trim();

    if (!address || !manualValue || Number(manualValue) <= 0) {
      throw new Error("An address and a positive value are required.");
    }

    await db.insert(holdings).values({ type: "property", address, manualValue });
  } else {
    const symbol = (input.symbol ?? "").trim().toUpperCase();
    const quantity = (input.quantity ?? "").trim();

    if (!symbol || !["stock", "crypto"].includes(input.type) || !quantity || Number(quantity) <= 0) {
      throw new Error("A symbol, type, and positive quantity are required.");
    }

    await db.insert(holdings).values({ type: input.type, symbol, quantity });
  }

  revalidatePath("/net-worth");
}

export async function deleteHolding(formData: FormData) {
  const user = await getAuthorizedUser();
  if (!user) throw new Error("Unauthorized");

  const id = Number(formData.get("id"));
  await db.delete(holdings).where(eq(holdings.id, id));
  revalidatePath("/net-worth");
}
