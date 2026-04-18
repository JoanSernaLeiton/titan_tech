CREATE TYPE "public"."report_status" AS ENUM('pending', 'ready', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('monthly', 'commercial_adhoc');--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"report_type" "report_type" NOT NULL,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"period_year" integer NOT NULL,
	"period_month" integer NOT NULL,
	"timezone" text NOT NULL,
	"generated_by_email" text NOT NULL,
	"is_async" boolean DEFAULT false NOT NULL,
	"warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"pdf_content" text NOT NULL,
	"xlsx_content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;