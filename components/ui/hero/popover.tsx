"use client";

/**
 * HeroUI v3 popover, re-exported under the app's own import path — same
 * rationale as ./card.tsx.
 *
 * Gotcha for call sites: `.popover__trigger`'s base CSS sets
 * `display: inline-block` as plain (unlayered) CSS, which beats a
 * same-specificity Tailwind utility class (utilities live in @layer in
 * v4) — same class of bug as CardHeaderRow's flex-row fix in ./card.tsx.
 * If a PopoverTrigger renders an icon + text and they stack vertically
 * instead of sitting inline, force it with `inline-flex!`, not `inline-flex`.
 */
import {
  PopoverRoot as Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverDialog,
  PopoverArrow,
  PopoverHeading,
} from "@heroui/react/popover";

export { Popover, PopoverTrigger, PopoverContent, PopoverDialog, PopoverArrow, PopoverHeading };
export type { PopoverProps } from "@heroui/react/popover";
