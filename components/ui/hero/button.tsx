"use client";

/**
 * HeroUI v3 button, re-exported under the app's own import path so call
 * sites don't reach into @heroui/react directly — same rationale as
 * ./card.tsx. HeroUI's own variant/size names (primary/secondary/tertiary/
 * outline/ghost/danger/danger-soft, sm/md/lg) replace the old Base UI
 * button's (default/outline/secondary/ghost/destructive/link) at every
 * migrated call site — this is a straight pass-through, not a shim.
 */
import { Button as ButtonRoot, buttonVariants } from "@heroui/react/button";

export { ButtonRoot as Button, buttonVariants };
export type { ButtonProps } from "@heroui/react/button";
