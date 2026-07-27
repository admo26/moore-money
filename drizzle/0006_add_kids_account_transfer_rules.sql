-- Incoming transfers from the kids' savings accounts (interest, refunds,
-- etc. credited back to the main account) are still pocket-money activity.
INSERT INTO "rules" ("pattern", "category_id") VALUES
  ('from: 06-0574-0933459', (SELECT id FROM "categories" WHERE "name" = 'Pocket Money')),
  ('from: 06-0574-0933475', (SELECT id FROM "categories" WHERE "name" = 'Pocket Money')),
  ('from: 06-0574-0933440', (SELECT id FROM "categories" WHERE "name" = 'Pocket Money'));
