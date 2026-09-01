"use client";

/**
 * HeroUI v3 doesn't ship a Menu-specific popover (unlike Select, which has
 * its own SelectPopover) — `@heroui/react/menu` only provides the list/item
 * styling (the `.menu` flex-col class), not the floating surface. This
 * wraps react-aria-components' own MenuTrigger/Popover directly and styles
 * the popover with `popoverVariants().base()` from @heroui/styles — the
 * same slot Popover's own PopoverContent uses — so it gets identical
 * chrome (border, shadow, enter/exit animation) without reimplementing it.
 */
import type { ComponentProps } from "react";
import { MenuTrigger, Popover as PopoverPrimitive } from "react-aria-components";
import { popoverVariants } from "@heroui/styles";
import { MenuRoot as Menu } from "@heroui/react/menu";
import { MenuItemRoot as MenuItem } from "@heroui/react/menu-item";
import { cn } from "@/lib/utils";

const popoverSlots = popoverVariants();

function MenuPopover({
  className,
  placement = "bottom end",
  ...props
}: ComponentProps<typeof PopoverPrimitive>) {
  return (
    <PopoverPrimitive
      {...props}
      placement={placement}
      className={cn(popoverSlots.base(), "w-48", className)}
    />
  );
}

export { MenuTrigger, MenuPopover, Menu, MenuItem };
