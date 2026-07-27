"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createMcpToken } from "@/app/(app)/settings/actions";

export function McpTokenDialog() {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        const raw = await createMcpToken(label);
        setToken(raw);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate token.");
      }
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setLabel("");
      setToken(null);
      setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm">Generate token</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{token ? "Token generated" : "Generate MCP token"}</DialogTitle>
          <DialogDescription>
            {token
              ? "Copy this token now — you won't be able to see it again."
              : "Paste this into your MCP client's config as a bearer token."}
          </DialogDescription>
        </DialogHeader>

        {token ? (
          <div className="rounded-md border border-border bg-muted p-3">
            <code className="block break-all text-xs">{token}</code>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <label htmlFor="mcp-token-label" className="text-xs font-medium text-muted-foreground">
              Label
            </label>
            <Input
              id="mcp-token-label"
              placeholder="e.g. Claude Desktop"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={isPending}
            />
            {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          {token ? (
            <Button size="sm" onClick={() => navigator.clipboard.writeText(token)}>
              Copy
            </Button>
          ) : (
            <Button size="sm" onClick={handleGenerate} disabled={isPending || !label.trim()}>
              {isPending ? "Generating…" : "Generate"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
