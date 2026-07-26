-- Starter category set. Edit/add/remove via the Rules page — this is just
-- a reasonable default, not a fixed taxonomy.
INSERT INTO "categories" ("name") VALUES
  ('Groceries'),
  ('Dining & Takeaway'),
  ('Transport & Fuel'),
  ('Utilities'),
  ('Rent & Mortgage'),
  ('Insurance'),
  ('Health & Medical'),
  ('Entertainment'),
  ('Subscriptions'),
  ('Shopping'),
  ('Personal Care'),
  ('Education'),
  ('Travel'),
  ('Gifts & Donations'),
  ('Fees & Charges'),
  ('Income'),
  ('Transfers')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint

-- A handful of illustrative starter rules. NZ merchant name formats vary,
-- so expect to refine these once real transaction data shows what Akahu
-- actually reports for merchant_name/description.
INSERT INTO "rules" ("pattern", "category_id") VALUES
  ('countdown', (SELECT id FROM "categories" WHERE "name" = 'Groceries')),
  ('woolworths', (SELECT id FROM "categories" WHERE "name" = 'Groceries')),
  ('new world', (SELECT id FROM "categories" WHERE "name" = 'Groceries')),
  ('pak''nsave', (SELECT id FROM "categories" WHERE "name" = 'Groceries')),
  ('uber eats', (SELECT id FROM "categories" WHERE "name" = 'Dining & Takeaway')),
  ('mcdonald', (SELECT id FROM "categories" WHERE "name" = 'Dining & Takeaway')),
  ('spotify', (SELECT id FROM "categories" WHERE "name" = 'Subscriptions')),
  ('netflix', (SELECT id FROM "categories" WHERE "name" = 'Subscriptions'));
