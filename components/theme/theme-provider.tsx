"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { serializeTheme, THEME_COOKIE, type ThemeState } from "@/lib/theme";

const ThemeContext = createContext<{
  theme: ThemeState;
  setTheme: (theme: ThemeState) => void;
} | null>(null);

/** Applies the theme to <html> imperatively — the same three knobs app/layout.tsx
 *  sets server-side from the cookie, kept in sync here for live preview. */
function applyTheme(theme: ThemeState) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme.scheme === "dark");
  root.dataset.accent = theme.accent;
  root.style.setProperty("--radius", `${theme.radius}rem`);
}

/** Reverts <html> to the untouched default — app/layout.tsx never sets
 *  these on a non-pilot route in the first place, but a client-side
 *  navigation away from /dashboard doesn't re-render the root layout, so
 *  without this the previous theme would otherwise stick on <html> (and,
 *  via the `.dark` class specifically, leak into legacy routes' minor
 *  dark: button/input styles — see the plan doc's Risks section). */
function resetTheme() {
  const root = document.documentElement;
  root.classList.remove("dark");
  delete root.dataset.accent;
  root.style.removeProperty("--radius");
}

/**
 * Owns the live ThemeState for the HeroUI pilot's theme selector. Mounted
 * once in app/(app)/dashboard/layout.tsx, wrapping both the page content and
 * ThemePanel. `initialTheme` comes from the same cookie app/layout.tsx
 * already read server-side to set <html>'s initial attributes — so the
 * first client render matches what was server-rendered, no flash.
 */
export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: ThemeState;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState(initialTheme);

  function setTheme(next: ThemeState) {
    setThemeState(next);
    applyTheme(next);
    document.cookie = `${THEME_COOKIE}=${serializeTheme(next)}; path=/; max-age=31536000; samesite=lax`;
  }

  // Re-apply on mount too — covers back/forward navigation where this
  // component remounts with React state already matching the DOM, but
  // belt-and-suspenders against any intervening navigation to a legacy
  // route (which never touches these attributes) and back. The cleanup is
  // load-bearing, not belt-and-suspenders: a client-side navigation away
  // from /dashboard unmounts this provider without the root layout
  // re-rendering, so without it <html> would keep whatever the pilot last
  // set indefinitely.
  useEffect(() => {
    applyTheme(theme);
    return resetTheme;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
