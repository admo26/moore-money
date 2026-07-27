import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowed } from "@/lib/auth";

/** Exchanges the magic-link/OAuth code for a session, then enforces the email allowlist. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const upstreamError = request.nextUrl.searchParams.get("error_description");
  const supabase = await createClient();

  // Google/Supabase can redirect here with an error instead of a code (e.g.
  // OAuth misconfiguration) — surface that distinctly from "not allowlisted".
  if (upstreamError) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "auth_failed");
    url.searchParams.set("error_description", upstreamError);
    return NextResponse.redirect(url);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "auth_failed");
      url.searchParams.set("error_description", error.message);
      return NextResponse.redirect(url);
    }
  }

  const { data } = await supabase.auth.getUser();

  if (!isEmailAllowed(data.user?.email)) {
    await supabase.auth.signOut();
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "not_allowed");
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
