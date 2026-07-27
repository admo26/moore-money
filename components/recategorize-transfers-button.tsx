"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RecategorizeTransfersButton() {
  const [isRunning, setIsRunning] = useState(false);

  async function handleClick() {
    setIsRunning(true);
    try {
      const res = await fetch("/api/recategorize-transfers", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Recategorize failed");
      }
      toast.success(
        data.matched > 0
          ? `Fixed ${data.matched} transaction${data.matched === 1 ? "" : "s"}`
          : "Nothing to fix"
      );
      if (data.matched > 0) window.location.reload();
    } catch (err) {
      toast.error("Couldn't fix categorisation", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={isRunning}>
      <ArrowLeftRight className={isRunning ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
      {isRunning ? "Fixing…" : "Fix categorisation"}
    </Button>
  );
}
