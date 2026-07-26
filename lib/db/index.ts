import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Lazily created so importing this module (e.g. during Next's build-time
// route analysis) never requires DATABASE_URL to be set — only calling a
// query does.
let _db: PostgresJsDatabase<typeof schema> | undefined;

function getDb() {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. See .env.example.");
  }

  const client = postgres(connectionString, { prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
