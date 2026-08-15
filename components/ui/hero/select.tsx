"use client";

/**
 * HeroUI v3 select + list-box, re-exported under the app's own import path
 * — formalizes the inline pattern components/dashboard/range-select.tsx
 * already used (Select.Trigger/Value/Indicator/Popover + a ListBox inside),
 * so every select in the app shares one entry point instead of each call
 * site importing straight from @heroui/react.
 */
import { Select as SelectRoot } from "@heroui/react/select";
import { ListBox } from "@heroui/react/list-box";

export { SelectRoot as Select, ListBox };
export type { SelectProps } from "@heroui/react/select";
