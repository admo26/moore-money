import { cookies } from "next/headers";

export const THEME_COOKIE = "theme";

/** Read once per server component that needs it — app/layout.tsx (for <html>'s
 *  initial class) and app/(app)/layout.tsx (to pass down as a prop to
 *  ThemeToggle, so it never has to read the DOM client-side at all). */
export async function isDarkTheme() {
  const cookieStore = await cookies();
  return cookieStore.get(THEME_COOKIE)?.value === "dark";
}
