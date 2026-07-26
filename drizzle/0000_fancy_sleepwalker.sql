CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"connection_name" text NOT NULL,
	"currency" text DEFAULT 'NZD' NOT NULL,
	"current_balance" numeric(14, 2),
	"available_balance" numeric(14, 2),
	"last_refreshed" timestamp with time zone,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"transactions_ingested" integer DEFAULT 0 NOT NULL,
	"error" text,
	"high_water_mark" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"description" text NOT NULL,
	"merchant_name" text,
	"type" text,
	"balance" numeric(14, 2),
	"akahu_category" jsonb,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;