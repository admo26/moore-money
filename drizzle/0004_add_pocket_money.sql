INSERT INTO "categories" ("name") VALUES
  ('Pocket Money')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint

-- Kids' automatic pocket-money/savings transfers (e.g. "Sammy Pocket Money",
-- "Holly Savings Holly Saving S") — these are transfers between our own
-- accounts, but specific enough to warrant their own category rather than
-- the generic "Transfers" bucket.
INSERT INTO "rules" ("pattern", "category_id") VALUES
  ('pocket money', (SELECT id FROM "categories" WHERE "name" = 'Pocket Money')),
  ('saving s', (SELECT id FROM "categories" WHERE "name" = 'Pocket Money'));
