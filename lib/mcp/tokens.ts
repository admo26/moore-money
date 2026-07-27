import { randomBytes, createHash } from "node:crypto";

const TOKEN_PREFIX = "mm_";

/** Generates a new personal access token. Never persist the raw value. */
export function generateToken(): string {
  return TOKEN_PREFIX + randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
