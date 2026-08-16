# Moore Money — CLAUDE.md

Personal-finance tracker for the household, syncing ANZ/Amex/Simplicity via Akahu.
Next.js App Router + TypeScript, Drizzle/Postgres (Supabase), deployed on Vercel.

**No tests, no Storybook, no CLAUDE.md-adjacent tooling exists yet.** Don't assume a
test command works — verify behaviour by reading the code and, for anything
UI-visible, clicking through it in a browser preview.

## UI conventions

- **HeroUI only, and always through `components/ui/hero/*`.** Never import
  `@heroui/react/*` directly from app code — go through the matching wrapper in
  `components/ui/hero/` (`card.tsx`, `select.tsx`, `popover.tsx`, `switch.tsx`,
  `toggle-button-group.tsx`, `input.tsx`, `dialog.tsx`, `button.tsx`, `separator.tsx`).
  If a HeroUI primitive doesn't have a wrapper yet, add a thin one (re-export, maybe
  a couple of app-specific helpers) rather than reaching past the boundary. This keeps
  every HeroUI import path in one place — useful for upgrades and for enforcing the
  dot-notation rule below.
- **`components/ui/table.tsx` is the one deliberate exception** — a plain
  `Table`/`TableHeader`/`TableRow`/`TableHead`/`TableBody`/`TableCell` set, not HeroUI's
  own `Table` (which is a heavier ARIA-grid primitive with sort/select semantics no
  current table here needs). Used by `transactions-table.tsx` and `rule-row.tsx` /
  `rules/page.tsx`. `app/(app)/settings/page.tsx`'s two tables and
  `components/categories-table.tsx` still use raw `<table>` markup — they had live
  uncommitted work in another session when this cleanup pass ran and were deliberately
  left untouched. Give them the same `ui/table.tsx` treatment when you're next in there.
- **Dot notation vs flat imports — this matters and is easy to get wrong.** HeroUI
  compound components (`Select.Trigger`, `ListBox.Item`, etc.) work fine via dot
  notation from a `"use client"` file, but **dot-notation property access on a
  compound export throws at runtime ("Element type is invalid") when done from a
  server component.** If a file has no `"use client"` banner, import the flat named
  exports instead (e.g. `SelectTrigger`, `SelectValue`, `ListBoxItem` — see
  `components/ui/hero/select.tsx` for the flat exports already added alongside the
  compound one). **`next build` will not catch this for a dynamic route** — routes
  rendered on-demand (`ƒ` in the build output, e.g. anything reading `searchParams` or
  cookies) aren't actually rendered during build, only their shell is registered. Always
  live-verify a dynamic route in the browser after touching it, not just `npm run build`.
- **Control-height scale: two tiers only.** `h-9` for standalone filter/form controls,
  `h-8` for compact/inline contexts (table-row inline edits, `RangeSelect`-style
  controls sitting inside a card header). Don't introduce a third tier without
  updating this note.

## Token architecture (`app/globals.css`)

Three layers, in order:
1. **`:root`** — untouched HeroUI theme tokens (`@import "@heroui/styles/..."`).
   Don't add app-specific overrides here; this is what makes the live theme selector
   and future HeroUI upgrades work cleanly.
2. **`body[data-ui="heroui"]`** — the app's bridge block. `data-ui="heroui"` is set
   unconditionally on `<body>` in `app/layout.tsx` (every route is on HeroUI now — this
   attribute predates full rollout, from the original Dashboard-only pilot, and is kept
   because portalled overlays (Select popover, Modal, Popover) mount to `document.body`
   and need to be inside the same scope). This block maps names the app needs but
   HeroUI doesn't define, or re-derives app-specific tokens from HeroUI ones via
   `var()` — including the domain tokens `--positive`/`--negative` and the chart tokens
   `--chart-cursor`/`--chart-grid`/`--chart-axis`/`--chart-surface`/`--chart-1..5`.
3. **`html.dark body[data-ui="heroui"]`** — dark-only overrides. Because nearly
   everything in layer 2 is `var()`-derived from a HeroUI name, and HeroUI ships its
   own complete `color-mix()`-based dark theme (see
   `node_modules/@heroui/styles/dist/themes/default/variables.css`), most tokens
   **auto-follow dark mode with zero extra code** once `.dark` is on `<html>`. Only
   `--background` (hardcoded light-canvas `#ffffff`) and the fixed `--chart-1..5` hex
   values (chosen for contrast on a light canvas) need explicit dark values here.

**Rule of thumb: prefer `var(--some-heroui-name)` over a literal color**, even in a
one-off. A hardcoded hex is a token that silently won't respond to dark mode or a
future theme change.

Chart files (`components/charts/*.tsx`) should reference `--chart-cursor` /
`--chart-grid` / `--chart-axis` / `--chart-surface` for tooltip cursors, grid lines,
and axis text — not `--border` / `--muted-foreground` / `--card` directly. That
indirection is what makes charts dark-mode-safe without per-file dark handling.

`tw-animate-css` is a real, load-bearing dependency, not leftover shadcn debt — HeroUI's
own compiled component CSS (popover, tooltip, date-picker, alert-dialog, autocomplete)
uses its `fade-in-0`/`zoom-in-95`/`slide-in-from-*` utilities for enter/exit
transitions. Don't remove it without re-checking those components still animate.

## Dark mode

- Toggle lives in `components/theme-toggle.tsx`, mounted in the footer of both
  `components/sidebar.tsx` and `components/mobile-nav.tsx` (shared state via the
  `theme` cookie, not component state — both toggles reflect the same value).
- Persistence is a `theme` cookie (`"dark" | "light"`), not `localStorage`. Both
  `app/layout.tsx` (root) and `app/(app)/layout.tsx` (nested) read it server-side via
  `lib/theme.ts`'s `isDarkTheme()` and bake the correct `class`/`initialIsDark` prop
  into the initial server render — this is what gives zero-flash, zero-hydration-
  mismatch dark mode. `lib/theme.ts` imports `next/headers`, so never import it from a
  client component (that will break the build with a client/server boundary error);
  `theme-toggle.tsx` duplicates the `THEME_COOKIE` string constant locally instead of
  sharing the module, deliberately.
- **Do not go back to a client-side inline script** for this. It was tried and
  abandoned: React "fixes up" a JSX-managed attribute like `<html className=...>`
  back to its server-rendered value during hydration, silently discarding any
  out-of-band DOM mutation an inline script made before hydration —
  `suppressHydrationWarning` does not prevent this, it only hides the console warning.
  Cookie-based SSR is the actual fix, not a workaround.

## Shared primitives (`components/ui/*.tsx`)

- **`PageHeader`** — `{ title, description?, action? }`, all `ReactNode`. Standard
  page-top block (`h1` + optional description + optional right-aligned action slot,
  e.g. a button). Used by every page except `settings/page.tsx` (excluded — see above).
- **`EmptyState`** — wraps children in the standard "nothing here" card
  (`rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground`). Used
  wherever a list/table can be legitimately empty (no results, no rules, etc.).
- **`ErrorBanner`** — `{ children, size?: "default" | "sm", className? }`. Default is
  the full-page `p-4` banner; `size="sm"` is a compact `p-2` variant for narrower
  contexts (currently only `login-form.tsx`'s auth-card banners). Margin/spacing stays
  external via `className` — the component itself doesn't assume its placement.
- **`Money`** — `{ value, currency?, showSign?, color?: "both" | "negative" | "none", className? }`.
  Formats via `lib/format.ts`'s `formatMoney` and applies **sign-based** coloring
  (negative → `text-negative`; positive → `text-positive` only when `color="both"`).
  This is deliberately narrow: it captures the sign-based coloring rules that used to be
  three inconsistent copies, but does **not** replace a separate, correct pattern used
  elsewhere — **role-based unconditional coloring**, e.g. "cash out" is always red
  regardless of its numeric sign, because it represents an outflow by definition. Don't
  reach for `Money` to "fix" those; they're not bugs, they're a different rule.
- **`Field`** — `{ label, htmlFor?, children }`. The label+control wrapper
  (`flex flex-col gap-1` + small muted label) used by filter/form controls. Pass
  `htmlFor` when there's a single associated input id (renders a real `<label>`);
  omit it for a checklist-style control with no single id (renders a `<span>`).

`components/dashboard/stat-card.tsx`'s `StatCard` predates this cleanup and is the
natural home for any "big number + small label" block — its `value` prop is
`ReactNode`, so it composes with `Money` (see `dashboard/page.tsx`'s Net card).

## Form patterns

Filter/search forms (`components/transactions-toolbar.tsx`,
`components/reports/report-period-picker.tsx`) use a plain `<form method="GET">` with
`formRef.current?.requestSubmit()` triggered from `onChange`/`onSelectionChange` —
not `router.push`. This works because HeroUI's `Select` renders a real, visually-hidden
native `<select name=...>` in sync with the visible UI (confirmed by reading
`node_modules/react-aria/dist/private/select/HiddenSelect.mjs`), so native GET-form
serialization just works for HeroUI selects the same as for a plain `<select>`.

**Gotcha:** that hidden-select sync happens in a `useEffect`, not synchronously inside
`onSelectionChange`. If you call `requestSubmit()` directly inside
`onSelectionChange`, you'll read the *previous* selection, not the one just picked —
this was a real bug in `report-period-picker.tsx` (picking "Custom range" kept
resubmitting the old preset) until fixed by deferring: `setTimeout(submitNow, 0)`. Any
new `Select` wired to auto-submit needs the same deferred-submit treatment; plain
`<input>`s don't, since their DOM value is already updated by the time a native
`onChange` fires.

Inline editors with no backing `<form>` (e.g. `category-select.tsx`, `rule-row.tsx`'s
category edit) call a server action directly from `onSelectionChange` inside a
`useTransition`, rather than submitting anything.

## Known deliberate exceptions / follow-ups

- `app/(app)/settings/page.tsx` and `components/categories-table.tsx` are still on raw
  `<table>` markup and haven't had the `PageHeader`/`EmptyState`/`ErrorBanner`
  treatment — deliberately skipped in this cleanup pass because another session had
  live uncommitted work there. Apply the same primitives/table consolidation once that
  work lands.
- Reports statement pages (`reports/income-expense`, `reports/cashflow`) render their
  tabular data as flex divs, not semantic `<table>` markup — a separate
  accessibility/semantics question, not addressed here.
- `tailwind-merge` is currently duplicated (root `^3.6.0` vs a HeroUI-nested `3.4.0`
  transitive). Low risk; an `overrides` entry in `package.json` would collapse it if
  it's ever worth doing.
