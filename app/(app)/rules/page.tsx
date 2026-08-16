import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, rules } from "@/lib/db/schema";
import { Input } from "@/components/ui/hero/input";
import { Button } from "@/components/ui/hero/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectIndicator,
  SelectPopover,
  ListBox,
  ListBoxItem,
} from "@/components/ui/hero/select";
import { Table, TableHeader, TableRow, TableHead, TableBody } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RuleRow } from "@/components/rule-row";
import { RerunRulesButton } from "@/components/rerun-rules-button";
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
      <PageHeader
        title="Rules"
        description="If a transaction's description or merchant contains a rule's pattern, it's assigned that category automatically on the next sync."
        action={<RerunRulesButton />}
      />

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
              <Select
                aria-label="Category"
                name="categoryId"
                defaultSelectedKey={categoriesList[0]?.id}
                isRequired
                validationBehavior="native"
              >
                <SelectTrigger id="categoryId" className="h-9 w-56">
                  <SelectValue />
                  <SelectIndicator />
                </SelectTrigger>
                <SelectPopover>
                  <ListBox>
                    {categoriesList.map((c) => (
                      <ListBoxItem key={c.id} id={c.id}>
                        {c.name}
                      </ListBoxItem>
                    ))}
                  </ListBox>
                </SelectPopover>
              </Select>
            </div>

            <Button type="submit" size="sm">
              Add rule
            </Button>
          </form>

          {rulesList.length === 0 ? (
            <EmptyState>No rules yet — add one above.</EmptyState>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Pattern</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rulesList.map((rule) => (
                    <RuleRow
                      key={rule.id}
                      rule={rule}
                      categories={categoriesList}
                      startEditing={rule.id === editId}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
