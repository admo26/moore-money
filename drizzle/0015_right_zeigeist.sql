ALTER TABLE "holdings" ALTER COLUMN "symbol" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "holdings" ALTER COLUMN "quantity" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "holdings" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "holdings" ADD COLUMN "manual_value" numeric(14, 2);