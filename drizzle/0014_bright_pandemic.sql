CREATE TABLE "holding_price_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"price" numeric(20, 8) NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "holding_price_snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "holdings" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"type" text NOT NULL,
	"quantity" numeric(20, 8) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "holdings" ENABLE ROW LEVEL SECURITY;