import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { getAuthorizedUser, getAvatarUrl, getFirstName, getFullName } from "@/lib/auth";
import { isDarkTheme } from "@/lib/theme";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, isDark] = await Promise.all([getAuthorizedUser(), isDarkTheme()]);
  const name = getFullName(user);
  const avatarUrl = getAvatarUrl(user);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar initialIsDark={isDark} name={name} avatarUrl={avatarUrl} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
          <MobileNav initialIsDark={isDark} name={name} avatarUrl={avatarUrl} />
          <div className="truncate text-sm text-muted-foreground">Hi {getFirstName(user)}</div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto bg-background p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
