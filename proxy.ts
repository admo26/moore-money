import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isEmailAllowed } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  // OAuth discovery must be reachable unauthenticated (clients fetch it
  // before any user is signed in); /oauth/authorize handles its own auth
  // check and redirects to /login?next=... itself, so it can return here
  // after sign-in instead of landing on a bare /login.
  "/.well-known",
  "/oauth",
];

export async function proxy(request: NextRequest) {
  // Forwarded as a request header so app/layout.tsx (the only place that
  // renders <html>) can tell whether it's rendering the HeroUI Dashboard
  // pilot without needing route params it doesn't otherwise receive — that's
  // what lets the live theme selector's cookie only affect <html> on the
  // pilot route, never on a fresh load of any other page. See the "Theme
  // selector" comment in app/layout.tsx.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getUser();
  const isPublicPath = PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));
  const isAuthorized = isEmailAllowed(data.user?.email);

  if (!isPublicPath && !isAuthorized) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicPath && isAuthorized && request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  // Route handlers under /api do their own auth (CRON_SECRET or
  // getAuthorizedUser) — a page-redirecting middleware isn't the right
  // response for a JSON API call, so they're excluded here.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
