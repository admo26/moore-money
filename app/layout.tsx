import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { isDarkTheme } from "@/lib/theme";
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
  // Cookie rather than localStorage specifically so this can be read here,
  // server-side, and baked into the initial HTML's class — no flash, no
  // inline <script>, no hydration-mismatch risk. (An inline script mutating
  // <html> before hydration was tried first: React "fixes up" the
  // className attribute back to its server-rendered value during
  // hydration regardless, silently discarding the mutation — confirmed by
  // watching it happen. A cookie sidesteps that entirely: server and
  // client render the *same* class from the start.) Defaults to light on
  // a first-ever visit (no cookie yet) rather than reading
  // prefers-color-scheme — that would need the same client-side
  // correction this is specifically avoiding. components/theme-toggle.tsx
  // writes this cookie when the user actually toggles.
  const isDark = await isDarkTheme();

  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased${isDark ? " dark" : ""}`}
    >
      <body data-ui="heroui" className="min-h-full flex flex-col">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
