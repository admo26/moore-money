"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/hero/button";

/**
 * Re-applies every rule and re-scans for internal transfers across all
 * synced transactions, not just new ones — the same logic that already
 * runs automatically after every sync. Useful right after editing several
 * rules, or to fix a backlog of historical transactions.
 */
export function RerunRulesButton() {
  const [isRunning, setIsRunning] = useState(false);

  async function handleClick() {
    setIsRunning(true);
    try {
      const res = await fetch("/api/recategorize-transfers", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Re-run failed");
      }
      toast.success(
        data.matched > 0
          ? `Updated ${data.matched} transaction${data.matched === 1 ? "" : "s"}`
          : "Nothing to update"
      );
      if (data.matched > 0) window.location.reload();
    } catch (err) {
      toast.error("Couldn't re-run rules", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onPress={handleClick} isDisabled={isRunning}>
      <RefreshCw className={isRunning ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
      {isRunning ? "Running…" : "Re-run all rules"}
    </Button>
  );
}
