import { randomBytes, createHash } from "node:crypto";

const TOKEN_PREFIX = "mm_";

/** Generates a new personal access token. Never persist the raw value. */
export function generateToken(): string {
  return generateOpaqueToken(TOKEN_PREFIX);
}

/** Generates a random opaque token/id with the given prefix (e.g. for OAuth codes/tokens/client ids). */
export function generateOpaqueToken(prefix: string): string {
  return prefix + randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
