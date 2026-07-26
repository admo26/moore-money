import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowed } from "@/lib/auth";

/** Exchanges the magic-link code for a session, then enforces the email allowlist. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const supabase = await createClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const { data } = await supabase.auth.getUser();

  if (!isEmailAllowed(data.user?.email)) {
    await supabase.auth.signOut();
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "not_allowed");
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL("/accounts", request.url));
}
