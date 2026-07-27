import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, rules } from "@/lib/db/schema";

export async function listRules() {
  return db
    .select({
      id: rules.id,
      pattern: rules.pattern,
      priority: rules.priority,
      categoryId: rules.categoryId,
      categoryName: categories.name,
    })
    .from(rules)
    .leftJoin(categories, eq(rules.categoryId, categories.id))
    .orderBy(asc(rules.priority));
}
