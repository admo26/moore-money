-- Seeds account_balance_snapshots from existing transaction balance history,
-- so transactional accounts (loans, credit cards) keep their real daily
-- history immediately instead of only starting from today. One row per
-- account per calendar day, using that day's last (closing) balance.
-- Investment/KiwiSaver accounts have no transactions, so they aren't
-- touched here — their first snapshot comes from the next sync.
INSERT INTO "account_balance_snapshots" ("account_id", "captured_on", "balance")
SELECT DISTINCT ON ("account_id", "date"::date)
  "account_id",
  "date"::date AS "captured_on",
  "balance"
FROM "transactions"
WHERE "balance" IS NOT NULL
ORDER BY "account_id", "date"::date, "date" DESC
ON CONFLICT ("account_id", "captured_on") DO NOTHING;
