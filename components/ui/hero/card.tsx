"use client";

/**
 * HeroUI v3 card, re-exported under the app's existing shadcn-flat names so
 * dashboard files can import from here without touching components/ui/card.tsx
 * (which has 7 importers on 5 not-yet-migrated routes).
 *
 * This file is deliberately "use client": HeroUI ships every component with
 * its own "use client" banner, but the *root barrel* (@heroui/react) only
 * exports the compound object (Card.Header, Card.Title, ...) — dot notation
 * from a server file risks React's client-reference proxy throwing. Importing
 * the flat names from the subpath (@heroui/react/card) and re-exporting them
 * from this client file sidesteps that: server files import flat names from
 * here, this file is free to use dot notation internally if it ever wants to.
 *
 * Card, CardHeader, CardTitle, CardContent, CardFooter are HeroUI's own,
 * unmodified. CardDescription is renamed at the call site to avoid confusion
 * with the raw HeroUI export (identical, just re-exported for a consistent
 * import surface). CardAction has no HeroUI equivalent (its .card__header is
 * a plain flex-col with no action-slot concept) — replaced below with three
 * explicit layout helpers instead of trying to recreate the old
 * has-data-[slot=card-action]:grid-cols-[1fr_auto] trick.
 */
import {
  CardRoot as Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@heroui/react/card";
import { cn } from "@/lib/utils";

/**
 * Drop-in for CardHeader when a card also needs a right-aligned action
 * (range picker, toggle, etc.) — HeroUI's own CardHeader is flex-col with no
 * action slot, so this is CardHeader forced into one row instead.
 */
function CardHeaderRow({ className, ...props }: React.ComponentProps<typeof CardHeader>) {
  return (
    <CardHeader
      className={cn("flex-row items-start justify-between gap-3", className)}
      {...props}
    />
  );
}

/** Text column for use inside CardHeaderRow — min-w-0 lets long descriptions wrap instead of pushing the action off the card. */
function CardTitleBlock({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex min-w-0 flex-col gap-1", className)} {...props} />;
}

/** Right-aligned action slot for use inside CardHeaderRow — replaces the old CardAction. */
function CardActions({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex shrink-0 items-center gap-2", className)} {...props} />;
}

export { Card, CardHeader, CardHeaderRow, CardTitle, CardTitleBlock, CardDescription, CardActions, CardContent, CardFooter };
