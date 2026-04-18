import { boolean, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { customers } from "./customers.schema";

export const customerThresholds = pgTable("customer_thresholds", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  metric: text("metric").notNull(),
  minValue: numeric("min_value").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
});

export const insertCustomerThresholdSchema = createInsertSchema(customerThresholds);
export const selectCustomerThresholdSchema = createSelectSchema(customerThresholds);

export type InsertCustomerThreshold = typeof customerThresholds.$inferInsert;
export type SelectCustomerThreshold = typeof customerThresholds.$inferSelect;
