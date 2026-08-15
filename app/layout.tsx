import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";
import { Toaster } from "sonner";
import { DEFAULT_THEME, parseTheme, THEME_COOKIE } from "@/lib/theme";
import "./globals.css";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Moore Money",
  description: "Household personal finance tracker",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The theme cookie only matters on the HeroUI Dashboard pilot, but it's
  // read here (root layout) rather than in dashboard/layout.tsx because only
  // the root layout renders <html> — reading it here and setting the
  // class/data-accent/--radius on the initial HTML is what avoids a flash on
  // first load.
  //
  // Gated on the pathname (forwarded by proxy.ts as `x-pathname`, since the
  // root layout otherwise has no way to know the current route) rather than
  // applied unconditionally: <html class="dark"> would otherwise leak onto
  // every route on a fresh load, and legacy routes' ADS palette is only
  // reasserted at the *body* level, not <html> — so a bare `.dark` there
  // would genuinely flip legacy pages dark too (confirmed while building
  // this: it did). Falls back to DEFAULT_THEME off the pilot so a stale
  // cookie can't do the same on a hard reload of another route.
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const pathname = headerList.get("x-pathname") ?? "";
  const isThemedRoute = pathname.startsWith("/dashboard");
  const theme = isThemedRoute ? parseTheme(cookieStore.get(THEME_COOKIE)?.value) : DEFAULT_THEME;

  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased${theme.scheme === "dark" ? " dark" : ""}`}
      data-accent={isThemedRoute ? theme.accent : undefined}
      style={isThemedRoute ? ({ "--radius": `${theme.radius}rem` } as React.CSSProperties) : undefined}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
