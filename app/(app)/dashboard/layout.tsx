import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemePanel } from "@/components/theme/theme-panel";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";

/**
 * Marks the Dashboard route as the HeroUI pilot — `data-ui="heroui"` is the
 * server-rendered marker app/globals.css uses to switch the body-scoped
 * token bridge (see the "Token architecture" comment there). Also mounts
 * the live theme selector: ThemeProvider owns the client-side ThemeState
 * (initialised from the same cookie app/layout.tsx reads to set <html>'s
 * initial attributes, so first render matches — no flash), and ThemePanel
 * is the floating trigger + popover UI for changing it.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <ThemeProvider initialTheme={theme}>
      <div data-ui="heroui">{children}</div>
      <ThemePanel />
    </ThemeProvider>
  );
}
