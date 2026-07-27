-- A dedicated category for money moving into investment/KiwiSaver accounts
-- (e.g. a contribution to Simplicity), so it's visible as "investing" rather
-- than lumped in with either spending or generic Transfers.
INSERT INTO "categories" ("name") VALUES ('Investments')
ON CONFLICT ("name") DO NOTHING;
