import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowed } from "@/lib/auth";

/**
 * Only ever follow a same-app relative path, never an absolute/external URL.
 * Resolves `next` against the app's own origin via the WHATWG URL parser and
 * checks the *result's* origin, rather than pattern-matching the raw string —
 * a string check like `!next.startsWith("//")` misses inputs like `/\evil.com`,
 * which browsers treat as protocol-relative (backslash coerced to slash) and
 * would otherwise redirect off-site.
 */
function safeNextPath(next: string | null, origin: string): string | null {
  if (!next || !next.startsWith("/")) return null;
  const resolved = new URL(next, origin);
  if (resolved.origin !== origin) return null;
  return `${resolved.pathname}${resolved.search}`;
}

/** Exchanges the magic-link/OAuth code for a session, then enforces the email allowlist. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const upstreamError = request.nextUrl.searchParams.get("error_description");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"), request.nextUrl.origin);
  const supabase = await createClient();

  const loginUrl = (params: Record<string, string>) => {
    const url = new URL("/login", request.url);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    if (next) url.searchParams.set("next", next);
    return url;
  };

  // Google/Supabase can redirect here with an error instead of a code (e.g.
  // OAuth misconfiguration) — surface that distinctly from "not allowlisted".
  if (upstreamError) {
    return NextResponse.redirect(loginUrl({ error: "auth_failed", error_description: upstreamError }));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(loginUrl({ error: "auth_failed", error_description: error.message }));
    }
  }

  const { data } = await supabase.auth.getUser();

  if (!isEmailAllowed(data.user?.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(loginUrl({ error: "not_allowed" }));
  }

  return NextResponse.redirect(new URL(next ?? "/dashboard", request.url));
}
