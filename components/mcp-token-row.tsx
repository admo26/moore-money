"use client";

import { useTransition } from "react";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/hero/button";
import { revokeMcpToken } from "@/app/(app)/settings/actions";

export interface McpTokenRowData {
  id: number;
  email: string;
  label: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

export function McpTokenRow({ token }: { token: McpTokenRowData }) {
  const [isPending, startTransition] = useTransition();

  function handleRevoke() {
    startTransition(async () => {
      await revokeMcpToken(token.id);
    });
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2">{token.label}</td>
      <td className="px-4 py-2 text-muted-foreground">{token.email}</td>
      <td className="px-4 py-2 text-muted-foreground">{token.createdAt.toLocaleDateString()}</td>
      <td className="px-4 py-2 text-muted-foreground">
        {token.lastUsedAt ? token.lastUsedAt.toLocaleDateString() : "Never"}
      </td>
      <td className="px-4 py-2 text-right">
        {token.revokedAt ? (
          <span className="text-xs text-muted-foreground">Revoked</span>
        ) : (
          <Button
            size="sm"
            variant="danger-soft"
            isIconOnly
            className="rounded-full"
            aria-label="Revoke token"
            onPress={handleRevoke}
            isDisabled={isPending}
          >
            <Ban className="h-4 w-4" />
          </Button>
        )}
      </td>
    </tr>
  );
}
