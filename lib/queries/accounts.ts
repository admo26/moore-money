import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";

export async function listAccounts() {
  return db.select().from(accounts);
}
