import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isEmailAllowed } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/auth/callback"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

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
          response = NextResponse.next({ request });
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
    return NextResponse.redirect(new URL("/accounts", request.url));
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
