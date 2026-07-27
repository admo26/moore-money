import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { getAuthorizedUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthorizedUser();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
          <MobileNav />
          <div className="truncate text-sm text-muted-foreground">{user?.email}</div>
        </header>
        <main className="min-w-0 flex-1 bg-background p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
