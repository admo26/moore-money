import type { ReactNode } from "react";

/**
 * Page-level heading — title + optional description, with an optional
 * right-aligned action slot (a button, usually). Was copy-pasted with
 * small variations across 7 pages before this; `action` being undefined
 * degrades cleanly to the plain title+description shape those pages used
 * (the flex wrapper has nothing to justify against with one child).
 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
