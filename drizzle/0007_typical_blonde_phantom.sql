CREATE TABLE "account_balance_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"captured_on" date NOT NULL,
	"balance" numeric(14, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_balance_snapshots_account_id_captured_on_unique" UNIQUE("account_id","captured_on")
);
--> statement-breakpoint
ALTER TABLE "account_balance_snapshots" ADD CONSTRAINT "account_balance_snapshots_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;