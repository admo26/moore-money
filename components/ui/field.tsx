import type { ReactNode } from "react";

/**
 * Label + control wrapper — the `flex flex-col gap-1` + small muted label
 * pattern was copy-pasted 10 times across transactions-toolbar.tsx and
 * report-period-picker.tsx. `htmlFor` renders a real `<label>` (form
 * fields with a single input id); omit it for a checklist-style control
 * with no single associated id (renders a `<span>` instead, matching what
 * those call sites already did by hand).
 */
export function Field({
  label,
  htmlFor,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}) {
  const LabelTag = htmlFor ? "label" : "span";
  return (
    <div className="flex flex-col gap-1">
      <LabelTag htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </LabelTag>
      {children}
    </div>
  );
}
