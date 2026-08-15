"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

/** Deterministic colour per connection name, so the same bank always gets the same fallback colour. */
function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return `hsl(${hash % 360} 55% 45%)`;
}

/** Akahu connection logo, falling back to a coloured initials circle if there's no logo or it fails to load. */
export function AccountLogo({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt=""
        className={cn("h-9 w-9 shrink-0 rounded-full object-cover", className)}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
        className
      )}
      style={{ backgroundColor: colorFor(name) }}
    >
      {initials(name)}
    </div>
  );
}
