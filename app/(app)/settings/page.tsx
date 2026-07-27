import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { mcpTokens } from "@/lib/db/schema";
import { McpTokenDialog } from "@/components/mcp-token-dialog";
import { McpTokenRow } from "@/components/mcp-token-row";

async function loadTokens() {
  return db
    .select({
      id: mcpTokens.id,
      email: mcpTokens.email,
      label: mcpTokens.label,
      createdAt: mcpTokens.createdAt,
      lastUsedAt: mcpTokens.lastUsedAt,
      revokedAt: mcpTokens.revokedAt,
    })
    .from(mcpTokens)
    .orderBy(desc(mcpTokens.createdAt));
}

export default async function SettingsPage() {
  let tokens: Awaited<ReturnType<typeof loadTokens>> = [];
  let error: string | null = null;

  try {
    tokens = await loadTokens();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load tokens.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage MCP personal access tokens for connecting AI clients (e.g. Claude
          Desktop) to this household&apos;s data.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Couldn&apos;t load tokens: {error}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <p className="text-sm font-medium">MCP tokens</p>
              <p className="text-xs text-muted-foreground">
                Paste a generated token into your MCP client as a bearer token.
              </p>
            </div>
            <McpTokenDialog />
          </div>

          {tokens.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              No tokens yet — generate one above.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Label</th>
                    <th className="px-4 py-2 font-medium">Email</th>
                    <th className="px-4 py-2 font-medium">Created</th>
                    <th className="px-4 py-2 font-medium">Last used</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => (
                    <McpTokenRow key={token.id} token={token} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
