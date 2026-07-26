import type { Config } from "drizzle-kit";

// Migrations run against the direct (non-pooled) connection; the app itself
// uses the pooled DATABASE_URL at runtime (see lib/db/index.ts).
export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
} satisfies Config;
