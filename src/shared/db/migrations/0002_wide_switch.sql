CREATE TABLE "device_metric_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"energy_today_kwh" numeric,
	"active_power_kw" numeric,
	"is_online" boolean DEFAULT false NOT NULL,
	"snapshot_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_metric_snapshots_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
ALTER TABLE "device_metric_snapshots" ADD CONSTRAINT "device_metric_snapshots_device_id_customer_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."customer_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_metric_snapshots" ADD CONSTRAINT "device_metric_snapshots_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;