"use client";

/**
 * HeroUI v3 select + list-box, re-exported under the app's own import path
 * — formalizes the inline pattern components/dashboard/range-select.tsx
 * already used (Select.Trigger/Value/Indicator/Popover + a ListBox inside),
 * so every select in the app shares one entry point instead of each call
 * site importing straight from @heroui/react.
 *
 * Also re-exports the flat names (SelectTrigger, SelectValue, ...,
 * ListBoxItem) for the same reason components/ui/hero/card.tsx does: dot
 * notation on a compound export (Select.Trigger) throws when used directly
 * in a *server* file's JSX (confirmed at runtime — app/(app)/rules/page.tsx
 * crashed with "Element type is invalid" until switched to these). Client
 * files (this app's other Select call sites) can keep using dot notation
 * freely; only a server component needs the flat names.
 */
import {
  Select as SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIndicator,
  SelectPopover,
} from "@heroui/react/select";
import { ListBox } from "@heroui/react/list-box";
import { ListBoxItem } from "@heroui/react/list-box-item";

export { SelectRoot as Select, SelectTrigger, SelectValue, SelectIndicator, SelectPopover, ListBox, ListBoxItem };
export type { SelectProps } from "@heroui/react/select";
