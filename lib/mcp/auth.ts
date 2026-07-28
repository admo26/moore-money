import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { mcpTokens } from "@/lib/db/schema";
import { isEmailAllowed } from "@/lib/auth";
import { hashToken } from "./tokens";
import { verifyOauthAccessToken } from "./oauth";

/**
 * Resolves an MCP bearer token to its owning email, or null if the token is
 * missing, unknown, revoked/expired, or belongs to an email no longer on the
 * ALLOWED_EMAILS allowlist (so removing someone's access doesn't require
 * separately remembering to revoke their token). Accepts either a
 * user-generated personal access token or an OAuth access token minted via
 * the `/api/oauth` authorization-code flow.
 */
export async function getMcpUser(
  bearerToken: string | undefined
): Promise<{ email: string } | null> {
  if (!bearerToken) return null;

  const [row] = await db
    .select({ id: mcpTokens.id, email: mcpTokens.email })
    .from(mcpTokens)
    .where(and(eq(mcpTokens.tokenHash, hashToken(bearerToken)), isNull(mcpTokens.revokedAt)));

  if (row) {
    if (!isEmailAllowed(row.email)) return null;

    db.update(mcpTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(mcpTokens.id, row.id))
      .catch((err) => console.error("Failed to update mcpTokens.lastUsedAt", err));

    return { email: row.email };
  }

  return verifyOauthAccessToken(bearerToken);
}
