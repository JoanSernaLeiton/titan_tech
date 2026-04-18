CREATE TYPE "public"."alert_status" AS ENUM('pending', 'under_review', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('threshold_breach', 'agreement_breach');--> statement-breakpoint
CREATE TYPE "public"."agreement_variable" AS ENUM('energia_ahorrada', 'dinero_ahorrado', 'disponibilidad_sistema', 'performance_ratio', 'mitigacion_co2');--> statement-breakpoint
CREATE TYPE "public"."unit_type" AS ENUM('kWh', 'MWh', 'GWh', 'kW', 'MW', '%', 'kg', 'ton', 'COP', 'USD', 'EUR', 'MXN');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('inverter', 'micro_inverter');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"device_id" uuid,
	"metric" text NOT NULL,
	"triggered_value" numeric NOT NULL,
	"threshold_value" numeric NOT NULL,
	"alert_type" "alert_type" NOT NULL,
	"triggered_at" timestamp DEFAULT now() NOT NULL,
	"status" "alert_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_agreement_variables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"variable" "agreement_variable" NOT NULL,
	"monthly_target" numeric NOT NULL,
	"unit" "unit_type" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"provider_id" uuid NOT NULL,
	"device_type" "device_type" NOT NULL,
	"external_id" text NOT NULL,
	"device_name" text NOT NULL,
	"api_params" jsonb,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_thresholds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"metric" text NOT NULL,
	"min_value" numeric NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"polling_interval_minutes" integer DEFAULT 3 NOT NULL,
	"metric_mappings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "providers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_device_id_customer_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."customer_devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_agreement_variables" ADD CONSTRAINT "customer_agreement_variables_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_devices" ADD CONSTRAINT "customer_devices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_thresholds" ADD CONSTRAINT "customer_thresholds_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;