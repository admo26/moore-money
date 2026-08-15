/**
 * State for the HeroUI pilot's live theme selector (Dashboard only — see
 * app/(app)/dashboard/layout.tsx and components/theme/theme-panel.tsx).
 *
 * Persisted in a cookie rather than localStorage specifically so
 * app/layout.tsx can read it server-side (`await cookies()`) and emit the
 * right `class`/`data-accent`/`--radius` on <html> in the initial HTML —
 * no flash, no hydration mismatch, no blocking inline script. The root
 * layout is already dynamic (the proxy hits Supabase on every request), so
 * this costs nothing extra.
 */

export type ThemeScheme = "light" | "dark";

export interface ThemeState {
  scheme: ThemeScheme;
  /** Key into ACCENT_PRESETS below. */
  accent: string;
  /** rem value written straight to --radius. */
  radius: number;
}

export const THEME_COOKIE = "mm-heroui-theme";

/**
 * Accent presets for the pilot, in the spirit of heroui.com's own theme
 * builder. Each preset only needs to override --accent/--accent-foreground —
 * every derived token (--accent-hover, --accent-soft, --field-focus, ...)
 * is computed from those via color-mix() in HeroUI's own CSS, so the rest
 * of the pilot re-themes automatically. "blue" matches HeroUI's own default
 * --accent, kept here so the picker has an explicit "reset to default" swatch.
 */
export const ACCENT_PRESETS = [
  { key: "blue", label: "Blue", swatch: "oklch(0.6204 0.195 253.83)" },
  { key: "violet", label: "Violet", swatch: "oklch(0.5904 0.2 293)" },
  { key: "green", label: "Green", swatch: "oklch(0.6 0.17 150)" },
  { key: "rose", label: "Rose", swatch: "oklch(0.62 0.22 350)" },
  { key: "orange", label: "Orange", swatch: "oklch(0.7 0.19 50)" },
  { key: "red", label: "Red", swatch: "oklch(0.63 0.24 20)" },
] as const;

export type AccentKey = (typeof ACCENT_PRESETS)[number]["key"];

export const MIN_RADIUS = 0;
export const MAX_RADIUS = 1;
export const RADIUS_STEP = 0.125;

export const DEFAULT_THEME: ThemeState = {
  scheme: "light",
  accent: "blue",
  radius: 0.5,
};

function isAccentKey(value: string): value is AccentKey {
  return ACCENT_PRESETS.some((p) => p.key === value);
}

/** Total — always returns a valid ThemeState, falling back to defaults for anything malformed. */
export function parseTheme(raw: string | undefined | null): ThemeState {
  if (!raw) return DEFAULT_THEME;
  const [scheme, accent, radiusRaw] = raw.split("|");
  const radius = Number(radiusRaw);
  return {
    scheme: scheme === "dark" ? "dark" : "light",
    accent: accent && isAccentKey(accent) ? accent : DEFAULT_THEME.accent,
    radius: Number.isFinite(radius) && radius >= MIN_RADIUS && radius <= MAX_RADIUS ? radius : DEFAULT_THEME.radius,
  };
}

export function serializeTheme(theme: ThemeState): string {
  return `${theme.scheme}|${theme.accent}|${theme.radius}`;
}
