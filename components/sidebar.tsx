"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "sidebar-collapsed";

export function Sidebar({ initialIsDark }: { initialIsDark?: boolean }) {
  // Was a lazy initializer reading localStorage directly — looks SSR-safe
  // (the typeof window guard), but a `true` stored value still produces a
  // genuine hydration mismatch, because it changes which *elements* render
  // (the Link/footer text below are conditionally omitted entirely, not
  // just re-styled), which `suppressHydrationWarning` on <aside> doesn't
  // cover (that only silences attribute/text mismatches on the element
  // it's placed on). Confirmed while adding the theme toggle below: with a
  // stored `true`, this threw a real hydration-mismatch error and forced
  // React to discard and client-re-render the tree, visibly hanging the
  // page. Fixed the same way as the toggle's own dark-mode read: start
  // false (matches the server), correct after mount.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <aside
      suppressHydrationWarning
      className={cn(
        "hidden flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-150 md:flex",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          M
        </div>
        {!collapsed && (
          <Link href="/dashboard" className="text-base font-semibold tracking-tight">
            Moore Money
          </Link>
        )}
      </div>
      <div className={cn("flex px-3", collapsed ? "justify-center" : "justify-end")}>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
      <div className="mt-2 flex-1">
        <SidebarNav collapsed={collapsed} />
      </div>
      <div className="space-y-1 px-3 py-2">
        <ThemeToggle initialIsDark={initialIsDark} collapsed={collapsed} />
        <SignOutButton collapsed={collapsed} />
      </div>
      {!collapsed && (
        <div className="px-5 py-4 text-xs text-sidebar-foreground/40">Household finance</div>
      )}
    </aside>
  );
}
