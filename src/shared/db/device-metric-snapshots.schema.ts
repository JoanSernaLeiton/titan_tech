import { boolean, numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";

import { customerDevices } from "./customer-devices.schema";
import { customers } from "./customers.schema";

export const deviceMetricSnapshots = pgTable("device_metric_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  deviceId: uuid("device_id")
    .notNull()
    .references(() => customerDevices.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  energyTodayKwh: numeric("energy_today_kwh"),
  energyMonthKwh: numeric("energy_month_kwh"),
  activePowerKw: numeric("active_power_kw"),
  isOnline: boolean("is_online").notNull().default(false),
  snapshotAt: timestamp("snapshot_at").notNull().defaultNow(),
});

export const selectDeviceMetricSnapshotSchema = createSelectSchema(deviceMetricSnapshots);

export type SelectDeviceMetricSnapshot = typeof deviceMetricSnapshots.$inferSelect;
export type InsertDeviceMetricSnapshot = typeof deviceMetricSnapshots.$inferInsert;
