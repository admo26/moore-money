import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, rules } from "@/lib/db/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RuleRow } from "@/components/rule-row";
import { createRule } from "./actions";

async function loadData() {
  const [allCategories, allRules] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.name)),
    db
      .select({
        id: rules.id,
        pattern: rules.pattern,
        priority: rules.priority,
        categoryId: rules.categoryId,
        categoryName: categories.name,
      })
      .from(rules)
      .leftJoin(categories, eq(rules.categoryId, categories.id))
      .orderBy(asc(rules.priority)),
  ]);

  return { categories: allCategories, rules: allRules };
}

export default async function RulesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const editId = edit ? Number(edit) : null;

  let categoriesList: Awaited<ReturnType<typeof loadData>>["categories"] = [];
  let rulesList: Awaited<ReturnType<typeof loadData>>["rules"] = [];
  let error: string | null = null;

  try {
    const data = await loadData();
    categoriesList = data.categories;
    rulesList = data.rules;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load rules.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rules</h1>
        <p className="text-sm text-muted-foreground">
          If a transaction&apos;s description or merchant contains a rule&apos;s pattern,
          it&apos;s assigned that category automatically on the next sync.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Couldn&apos;t load rules: {error}
        </div>
      )}

      {!error && (
        <>
          <form
            action={createRule}
            className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="pattern" className="text-xs font-medium text-muted-foreground">
                Pattern
              </label>
              <Input
                id="pattern"
                name="pattern"
                required
                placeholder="e.g. countdown"
                className="w-56"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="categoryId" className="text-xs font-medium text-muted-foreground">
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                required
                className="h-9 w-56 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {categoriesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" size="sm">
              Add rule
            </Button>
          </form>

          {rulesList.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              No rules yet — add one above.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Pattern</th>
                    <th className="px-4 py-2 font-medium">Category</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rulesList.map((rule) => (
                    <RuleRow
                      key={rule.id}
                      rule={rule}
                      categories={categoriesList}
                      startEditing={rule.id === editId}
                    />
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
