"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/hero/switch";

// Not imported from lib/theme.ts: that module also exports a
// next/headers-using server function, and importing anything from it here
// would pull that into the client bundle (Next.js correctly rejects this
// at build time). Duplicating one string constant is simpler than
// splitting the module just to avoid it — keep this in sync with
// THEME_COOKIE in lib/theme.ts if it ever changes.
const THEME_COOKIE = "theme";

/**
 * Dark mode toggle — mounted in both the sidebar (desktop) and mobile nav
 * footers, next to sign-out. `initialIsDark` comes from the same cookie
 * app/layout.tsx already reads server-side to set <html>'s initial class
 * (threaded down via app/(app)/layout.tsx), so this never needs to read
 * the DOM or localStorage on mount — server and client agree from the
 * first render, no flash, no hydration-mismatch risk.
 */
export function ThemeToggle({
  initialIsDark = false,
  collapsed,
}: {
  initialIsDark?: boolean;
  collapsed?: boolean;
}) {
  const [isDark, setIsDark] = useState(initialIsDark);

  function handleChange(selected: boolean) {
    setIsDark(selected);
    document.documentElement.classList.toggle("dark", selected);
    document.cookie = `${THEME_COOKIE}=${selected ? "dark" : "light"}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <Switch isSelected={isDark} onChange={handleChange} size="sm">
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb>
            <Switch.Icon>{isDark ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}</Switch.Icon>
          </Switch.Thumb>
        </Switch.Control>
        {!collapsed && "Dark mode"}
      </Switch.Content>
    </Switch>
  );
}
