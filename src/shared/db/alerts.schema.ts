import { numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { customerDevices } from "./customer-devices.schema";
import { customers } from "./customers.schema";

export const alertTypeEnum = pgEnum("alert_type", ["threshold_breach", "agreement_breach"]);
export const alertStatusEnum = pgEnum("alert_status", ["pending", "under_review", "resolved"]);

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  deviceId: uuid("device_id").references(() => customerDevices.id),
  metric: text("metric").notNull(),
  triggeredValue: numeric("triggered_value").notNull(),
  thresholdValue: numeric("threshold_value").notNull(),
  alertType: alertTypeEnum("alert_type").notNull(),
  triggeredAt: timestamp("triggered_at").notNull().defaultNow(),
  status: alertStatusEnum("status").notNull().default("pending"),
});

export const insertAlertSchema = createInsertSchema(alerts);
export const selectAlertSchema = createSelectSchema(alerts);

export type InsertAlert = typeof alerts.$inferInsert;
export type SelectAlert = typeof alerts.$inferSelect;
