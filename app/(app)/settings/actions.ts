"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mcpTokens } from "@/lib/db/schema";
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
