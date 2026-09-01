"use client";

import { Settings } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/hero/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/hero/popover";
import { Separator } from "@/components/ui/hero/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

/**
 * Sidebar/mobile-nav footer: avatar + name, with a settings-cog trigger for
 * a popover holding dark mode + sign out — replaces the old always-visible
 * theme-toggle/sign-out stack so the footer reads as "your account" instead
 * of a loose settings list. Collapsed (icon-rail) mode drops the name and
 * cog, and the avatar itself becomes the popover trigger since there's no
 * room for both.
 */
export function UserMenu({
  name,
  avatarUrl,
  initialIsDark,
  collapsed = false,
  onNavigate,
}: {
  name: string;
  avatarUrl: string | null;
  initialIsDark?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const avatar = (
    <Avatar className="h-8 w-8 shrink-0">
      {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  );

  const menu = (
    <PopoverContent placement={collapsed ? "right" : "top"}>
      <div className="flex w-56 flex-col gap-1 p-2">
        <div className="flex items-center justify-between gap-3 rounded-md px-1 py-1">
          <span className="text-sm font-medium">Dark mode</span>
          <ThemeToggle initialIsDark={initialIsDark} collapsed />
        </div>
        <Separator className="my-1" />
        <SignOutButton onNavigate={onNavigate} />
      </div>
    </PopoverContent>
  );

  if (collapsed) {
    return (
      <Popover>
        <PopoverTrigger className="inline-flex! w-full cursor-pointer items-center justify-center rounded-md py-1">
          {avatar}
        </PopoverTrigger>
        {menu}
      </Popover>
    );
  }

  return (
    <Popover>
      <div className="flex items-center gap-2 rounded-md px-1 py-1">
        {avatar}
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
        <PopoverTrigger
          className="inline-flex! h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label="Account settings"
        >
          <Settings className="h-4 w-4" />
        </PopoverTrigger>
      </div>
      {menu}
    </Popover>
  );
}
