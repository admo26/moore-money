import { asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, mcpTokens } from "@/lib/db/schema";
import { McpTokenDialog } from "@/components/mcp-token-dialog";
import { McpTokenRow } from "@/components/mcp-token-row";
import { AddCategoryForm } from "@/components/add-category-form";
import { CategoryRow } from "@/components/category-row";

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

async function loadCategories() {
  return db.select().from(categories).orderBy(asc(categories.name));
}

export default async function SettingsPage() {
  let tokens: Awaited<ReturnType<typeof loadTokens>> = [];
  let categoriesList: Awaited<ReturnType<typeof loadCategories>> = [];
  let error: string | null = null;
  let categoriesError: string | null = null;

  try {
    tokens = await loadTokens();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load tokens.";
  }

  try {
    categoriesList = await loadCategories();
  } catch (err) {
    categoriesError = err instanceof Error ? err.message : "Failed to load categories.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      <div className="max-w-md space-y-3">
        <div>
          <h2 className="text-lg font-medium">Categories</h2>
          <p className="text-sm text-muted-foreground">
            Add, rename, or delete the categories used for transaction categorisation.
            Deleting a category also deletes rules that use it, and uncategorises any
            transactions assigned to it.
          </p>
        </div>

        {categoriesError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Couldn&apos;t load categories: {categoriesError}
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border bg-card p-4">
              <AddCategoryForm />
            </div>

            {categoriesList.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
                No categories yet — add one above.
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <table className="w-full text-sm">
                  <thead>
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
          </>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">MCP tokens</h2>
          <p className="text-sm text-muted-foreground">
            Manage personal access tokens for connecting AI clients (e.g. Claude
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
              <p className="text-xs text-muted-foreground">
                Paste a generated token into your MCP client as a bearer token.
              </p>
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
    </div>
  );
}
