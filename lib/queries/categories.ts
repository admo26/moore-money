import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";

export async function listCategories() {
  return db.select().from(categories).orderBy(asc(categories.name));
}
