/**
 * Marks the Dashboard route as the HeroUI pilot — `data-ui="heroui"` is the
 * server-rendered marker app/globals.css uses to switch the body-scoped
 * token bridge (see the "Token architecture" comment there). The theme
 * selector panel mounts here too (added in a later step).
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div data-ui="heroui">{children}</div>;
}
