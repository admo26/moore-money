import Link from "next/link";
import { SidebarNav } from "@/components/sidebar-nav";
import { MobileNav } from "@/components/mobile-nav";
import { SyncButton } from "@/components/sync-button";
import { SignOutButton } from "@/components/sign-out-button";
import { getAuthorizedUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthorizedUser();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-60 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-16 items-center gap-2 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
            M
          </div>
          <Link href="/accounts" className="text-base font-semibold tracking-tight">
            Moore Money
          </Link>
        </div>
        <div className="mt-2 flex-1">
          <SidebarNav />
        </div>
        <div className="px-5 py-4 text-xs text-sidebar-foreground/40">
          Household finance
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <MobileNav />
            <div className="truncate text-sm text-muted-foreground">{user?.email}</div>
          </div>
          <div className="flex items-center gap-2">
            <SyncButton />
            <SignOutButton />
          </div>
        </header>
        <main className="min-w-0 flex-1 bg-background p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
