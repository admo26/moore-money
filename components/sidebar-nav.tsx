"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, ArrowLeftRight, PieChart, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, disabled: true },
  { href: "/accounts", label: "Accounts", icon: Wallet, disabled: false },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight, disabled: false },
  { href: "/rules", label: "Rules", icon: Tag, disabled: false },
  { href: "/reports", label: "Reports", icon: PieChart, disabled: true },
] as const;

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname?.startsWith(item.href);
        const Icon = item.icon;

        if (item.disabled) {
          return (
            <span
              key={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/40"
              title="Coming soon"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
