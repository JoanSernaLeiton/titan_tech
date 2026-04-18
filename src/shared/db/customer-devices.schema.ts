import { boolean, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { customers } from "./customers.schema";

export const deviceTypeEnum = pgEnum("device_type", ["inverter", "micro_inverter"]);

export const customerDevices = pgTable("customer_devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  providerId: uuid("provider_id").notNull(),
  deviceType: deviceTypeEnum("device_type").notNull(),
  externalId: text("external_id").notNull(),
  deviceName: text("device_name").notNull(),
  apiParams: jsonb("api_params"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomerDeviceSchema = createInsertSchema(customerDevices);
export const selectCustomerDeviceSchema = createSelectSchema(customerDevices);

export type InsertCustomerDevice = typeof customerDevices.$inferInsert;
export type SelectCustomerDevice = typeof customerDevices.$inferSelect;
