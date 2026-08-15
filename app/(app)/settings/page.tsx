import { asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, mcpOauthClients, mcpOauthTokens, mcpTokens } from "@/lib/db/schema";
import {
  Card,
  CardHeader,
  CardHeaderRow,
  CardTitle,
  CardTitleBlock,
  CardDescription,
  CardActions,
  CardContent,
} from "@/components/ui/hero/card";
import { McpTokenDialog } from "@/components/mcp-token-dialog";
import { McpTokenRow } from "@/components/mcp-token-row";
import { McpOauthGrantRow } from "@/components/mcp-oauth-grant-row";
import { AddCategoryForm } from "@/components/add-category-form";
import { CategoryRow } from "@/components/category-row";
import { RecategorizeTransfersButton } from "@/components/recategorize-transfers-button";

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

async function loadOauthGrants() {
  return db
    .select({
      id: mcpOauthTokens.id,
      email: mcpOauthTokens.email,
      clientName: mcpOauthClients.clientName,
      createdAt: mcpOauthTokens.createdAt,
      expiresAt: mcpOauthTokens.expiresAt,
    })
    .from(mcpOauthTokens)
    .innerJoin(mcpOauthClients, eq(mcpOauthTokens.clientId, mcpOauthClients.id))
    .where(isNull(mcpOauthTokens.revokedAt))
    .orderBy(desc(mcpOauthTokens.createdAt));
}

async function loadCategories() {
  return db.select().from(categories).orderBy(asc(categories.name));
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </h2>
  );
}

export default async function SettingsPage() {
  let tokens: Awaited<ReturnType<typeof loadTokens>> = [];
  let oauthGrants: Awaited<ReturnType<typeof loadOauthGrants>> = [];
  let categoriesList: Awaited<ReturnType<typeof loadCategories>> = [];
  let error: string | null = null;
  let oauthError: string | null = null;
  let categoriesError: string | null = null;

  try {
    tokens = await loadTokens();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load tokens.";
  }

  try {
    oauthGrants = await loadOauthGrants();
  } catch (err) {
    oauthError = err instanceof Error ? err.message : "Failed to load connected apps.";
  }

  try {
    categoriesList = await loadCategories();
  } catch (err) {
    categoriesError = err instanceof Error ? err.message : "Failed to load categories.";
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      <div className="space-y-4">
        <SectionLabel>Data &amp; categorisation</SectionLabel>

        <Card>
          <CardHeaderRow>
            <CardTitleBlock>
              <CardTitle className="text-base">Categories</CardTitle>
              <CardDescription>
                Add, rename, or delete the categories used for transaction categorisation.
                Deleting a category also deletes rules that use it, and uncategorises any
                transactions assigned to it.
              </CardDescription>
            </CardTitleBlock>
            <CardActions>
              <AddCategoryForm />
            </CardActions>
          </CardHeaderRow>
          <CardContent>
            {categoriesError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                Couldn&apos;t load categories: {categoriesError}
              </div>
            ) : categoriesList.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
                No categories yet — add one above.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-4 py-2 font-medium">Name</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {categoriesList.map((category) => (
                      <CategoryRow key={category.id} category={category} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maintenance</CardTitle>
            <CardDescription>
              Re-applies your current rules and re-scans for internal transfers (e.g. paying
              off a credit card from a linked account) across every synced transaction, not
              just new ones. This already runs automatically after every sync — use this if
              you&apos;ve just edited several rules and want them reflected immediately, or
              you&apos;re fixing a backlog of historical transactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                Doesn&apos;t contact Akahu or use AI — just re-runs the rules/transfer logic
                locally.
              </p>
              <RecategorizeTransfersButton />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <SectionLabel>Integrations &amp; access</SectionLabel>

        <Card>
          <CardHeaderRow>
            <CardTitleBlock>
              <CardTitle className="text-base">MCP tokens</CardTitle>
              <CardDescription>
                Manage personal access tokens for connecting AI clients (e.g. Claude Desktop)
                to this household&apos;s data.
              </CardDescription>
            </CardTitleBlock>
            <CardActions>
              <McpTokenDialog />
            </CardActions>
          </CardHeaderRow>
          <CardContent>
            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                Couldn&apos;t load tokens: {error}
              </div>
            ) : tokens.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
                No tokens yet — generate one above.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connected apps</CardTitle>
            <CardDescription>
              Apps you&apos;ve authorised via OAuth (e.g. adding this as a Claude.ai custom
              connector) — no manual token needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Add one from your MCP client using{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">/api/mcp</code> as the
              server URL.
            </p>
            {oauthError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                Couldn&apos;t load connected apps: {oauthError}
              </div>
            ) : oauthGrants.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
                No connected apps yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-4 py-2 font-medium">App</th>
                      <th className="px-4 py-2 font-medium">Email</th>
                      <th className="px-4 py-2 font-medium">Connected</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {oauthGrants.map((grant) => (
                      <McpOauthGrantRow key={grant.id} grant={grant} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
