import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/** Emails allowed to sign in, from the comma-separated ALLOWED_EMAILS env var. */
export function getAllowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = getAllowedEmails();
  // If no allowlist is configured, fail closed rather than open.
  return allowed.length > 0 && allowed.includes(email.toLowerCase());
}

/**
 * Resolves the current authenticated + allowlisted user, or null. Use in
 * Server Components / Route Handlers that need to gate on auth (middleware
 * handles the page-level redirect; this is the belt-and-suspenders check
 * for API routes).
 */
export async function getAuthorizedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user || !isEmailAllowed(data.user.email)) {
    return null;
  }

  return data.user;
}

/** First name for greeting, from the Google profile if signed in that way, else the email's local part. */
export function getFirstName(user: Pick<User, "user_metadata" | "email"> | null | undefined): string {
  const fullName = (user?.user_metadata?.full_name ?? user?.user_metadata?.name) as
    | string
    | undefined;
  if (fullName) return fullName.split(" ")[0];

  return user?.email?.split("@")[0] ?? "";
}

/** Full name for the account menu, from the Google profile if signed in that way, else the email's local part. */
export function getFullName(user: Pick<User, "user_metadata" | "email"> | null | undefined): string {
  const fullName = (user?.user_metadata?.full_name ?? user?.user_metadata?.name) as
    | string
    | undefined;
  return fullName ?? user?.email?.split("@")[0] ?? "";
}

/** Google/GitHub profile photo, if the user signed in that way. */
export function getAvatarUrl(
  user: Pick<User, "user_metadata"> | null | undefined
): string | null {
  return (user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null) as
    | string
    | null;
}
