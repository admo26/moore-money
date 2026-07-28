import { createHash } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { mcpOauthClients, mcpOauthCodes, mcpOauthTokens } from "@/lib/db/schema";
import { isEmailAllowed } from "@/lib/auth";
import { generateOpaqueToken, hashToken } from "./tokens";

const CLIENT_ID_PREFIX = "mcpc_";
const AUTH_CODE_PREFIX = "mcpac_";
const ACCESS_TOKEN_PREFIX = "mcpat_";
const REFRESH_TOKEN_PREFIX = "mcprt_";

export const AUTH_CODE_TTL_SECONDS = 5 * 60;
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;

export async function registerClient(input: { clientName?: string; redirectUris: string[] }) {
  if (input.redirectUris.length === 0) {
    throw new Error("At least one redirect_uris entry is required.");
  }

  const [client] = await db
    .insert(mcpOauthClients)
    .values({
      id: generateOpaqueToken(CLIENT_ID_PREFIX),
      clientName: input.clientName ?? null,
      redirectUris: input.redirectUris,
    })
    .returning();

  return client;
}

export async function getClient(clientId: string) {
  const [client] = await db
    .select()
    .from(mcpOauthClients)
    .where(eq(mcpOauthClients.id, clientId));
  return client ?? null;
}

/** Issues a single-use authorization code after the user approves the consent screen. */
export async function createAuthorizationCode(input: {
  clientId: string;
  email: string;
  redirectUri: string;
  codeChallenge: string;
}) {
  const code = generateOpaqueToken(AUTH_CODE_PREFIX);

  await db.insert(mcpOauthCodes).values({
    codeHash: hashToken(code),
    clientId: input.clientId,
    email: input.email,
    redirectUri: input.redirectUri,
    codeChallenge: input.codeChallenge,
    expiresAt: new Date(Date.now() + AUTH_CODE_TTL_SECONDS * 1000),
  });

  return code;
}

function verifyPkce(codeVerifier: string, codeChallenge: string): boolean {
  const computed = createHash("sha256").update(codeVerifier).digest("base64url");
  return computed === codeChallenge;
}

/** Exchanges an authorization code for its owning email, consuming it. Throws on any invalid/expired/reused/mismatched input. */
export async function consumeAuthorizationCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<{ email: string }> {
  const [row] = await db
    .select()
    .from(mcpOauthCodes)
    .where(eq(mcpOauthCodes.codeHash, hashToken(input.code)));

  if (
    !row ||
    row.consumedAt ||
    row.clientId !== input.clientId ||
    row.redirectUri !== input.redirectUri ||
    row.expiresAt < new Date()
  ) {
    throw new Error("Invalid or expired authorization code.");
  }

  if (!verifyPkce(input.codeVerifier, row.codeChallenge)) {
    throw new Error("PKCE verification failed.");
  }

  await db.update(mcpOauthCodes).set({ consumedAt: new Date() }).where(eq(mcpOauthCodes.id, row.id));

  if (!isEmailAllowed(row.email)) {
    throw new Error("Email is no longer allowlisted.");
  }

  return { email: row.email };
}

async function mintTokenPair(clientId: string, email: string) {
  const accessToken = generateOpaqueToken(ACCESS_TOKEN_PREFIX);
  const refreshToken = generateOpaqueToken(REFRESH_TOKEN_PREFIX);

  await db.insert(mcpOauthTokens).values({
    accessTokenHash: hashToken(accessToken),
    refreshTokenHash: hashToken(refreshToken),
    clientId,
    email,
    expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000),
  });

  return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
}

export async function issueTokens(input: { clientId: string; email: string }) {
  return mintTokenPair(input.clientId, input.email);
}

/** Verifies + rotates a refresh token, revoking the old row and minting a fresh pair. */
export async function rotateRefreshToken(input: { clientId: string; refreshToken: string }) {
  const [row] = await db
    .select()
    .from(mcpOauthTokens)
    .where(
      and(eq(mcpOauthTokens.refreshTokenHash, hashToken(input.refreshToken)), isNull(mcpOauthTokens.revokedAt))
    );

  if (!row || row.clientId !== input.clientId) {
    throw new Error("Invalid refresh token.");
  }

  if (!isEmailAllowed(row.email)) {
    throw new Error("Email is no longer allowlisted.");
  }

  await db.update(mcpOauthTokens).set({ revokedAt: new Date() }).where(eq(mcpOauthTokens.id, row.id));

  return mintTokenPair(row.clientId, row.email);
}

/** Resolves an OAuth bearer token to its owning email, or null. Used alongside PAT lookup in getMcpUser. */
export async function verifyOauthAccessToken(accessToken: string): Promise<{ email: string } | null> {
  const [row] = await db
    .select()
    .from(mcpOauthTokens)
    .where(and(eq(mcpOauthTokens.accessTokenHash, hashToken(accessToken)), isNull(mcpOauthTokens.revokedAt)));

  if (!row || row.expiresAt < new Date() || !isEmailAllowed(row.email)) return null;

  return { email: row.email };
}
