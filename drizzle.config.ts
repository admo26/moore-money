import { config } from "dotenv";
import type { Config } from "drizzle-kit";

// The drizzle-kit CLI doesn't read .env.local the way Next.js does, so load
// it explicitly.
config({ path: ".env.local" });

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
