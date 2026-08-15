/**
 * Marks the Dashboard route as the HeroUI pilot — `data-ui="heroui"` is the
 * server-rendered marker app/globals.css uses to switch the body-scoped
 * token bridge (see the "Token architecture" comment there).
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div data-ui="heroui">{children}</div>;
}
