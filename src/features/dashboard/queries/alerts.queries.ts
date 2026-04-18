import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/shared/db";
import { alerts } from "@/shared/db/alerts.schema";
import type { SelectAlert } from "@/shared/db/alerts.schema";
import { customerDevices } from "@/shared/db/customer-devices.schema";
import type { SelectCustomerDevice } from "@/shared/db/customer-devices.schema";
import { customers } from "@/shared/db/customers.schema";
import type { SelectCustomer } from "@/shared/db/customers.schema";

export async function getAllAlerts(): Promise<
  (SelectAlert & { customer: SelectCustomer; device: SelectCustomerDevice | null })[]
> {
  return db
    .select()
    .from(alerts)
    .innerJoin(customers, eq(alerts.customerId, customers.id))
    .leftJoin(customerDevices, eq(alerts.deviceId, customerDevices.id))
    .then((rows) =>
      rows.map((row) => ({
        ...row.alerts,
        customer: row.customers,
        device: row.customer_devices,
      }))
    );
}

export async function getAlertsByCustomerId(customerId: string): Promise<SelectAlert[]> {
  return db.select().from(alerts).where(eq(alerts.customerId, customerId));
}

export async function getActiveAlertByDeviceAndMetric(
  deviceId: string,
  metric: string
): Promise<SelectAlert | undefined> {
  const result = await db
    .select()
    .from(alerts)
    .where(
      and(
        eq(alerts.deviceId, deviceId),
        eq(alerts.metric, metric),
        inArray(alerts.status, ["pending", "under_review"])
      )
    )
    .limit(1);
  return result[0];
}
