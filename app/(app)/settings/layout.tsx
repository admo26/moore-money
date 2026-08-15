/**
 * Marks Settings as HeroUI — `data-ui="heroui"` is the server-rendered
 * marker app/globals.css uses to switch the body-scoped token bridge (see
 * the "Token architecture" comment there). Mirrors app/(app)/dashboard/layout.tsx.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <div data-ui="heroui">{children}</div>;
}
