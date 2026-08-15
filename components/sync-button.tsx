"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/hero/button";

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  async function handleSync() {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      if (!res.ok) {
        console.error("Sync failed", await res.text());
      }
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      setIsSyncing(false);
      // Refresh server-rendered data on the current route.
      window.location.reload();
    }
  }

  return (
    <Button size="sm" variant="outline" onPress={handleSync} isDisabled={isSyncing}>
      <RefreshCw className={isSyncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
      {isSyncing ? "Syncing…" : "Sync now"}
    </Button>
  );
}
