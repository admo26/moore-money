"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/hero/button";
import { revokeMcpOauthGrant } from "@/app/(app)/settings/actions";

export interface McpOauthGrantRowData {
  id: number;
  email: string;
  clientName: string | null;
  createdAt: Date;
  expiresAt: Date;
}

export function McpOauthGrantRow({ grant }: { grant: McpOauthGrantRowData }) {
  const [isPending, startTransition] = useTransition();

  function handleRevoke() {
    startTransition(async () => {
      await revokeMcpOauthGrant(grant.id);
    });
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2">{grant.clientName || "Unnamed client"}</td>
      <td className="px-4 py-2 text-muted-foreground">{grant.email}</td>
      <td className="px-4 py-2 text-muted-foreground">{grant.createdAt.toLocaleDateString()}</td>
      <td className="px-4 py-2 text-right">
        <Button size="sm" variant="ghost" onPress={handleRevoke} isDisabled={isPending}>
          Revoke
        </Button>
      </td>
    </tr>
  );
}
