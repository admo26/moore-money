-- "Holly Holly" is Holly's recurring pocket money, just formatted
-- differently by the bank than the "Pocket Money"/"Saving S" patterns.
INSERT INTO "rules" ("pattern", "category_id") VALUES
  ('holly holly', (SELECT id FROM "categories" WHERE "name" = 'Pocket Money'));
