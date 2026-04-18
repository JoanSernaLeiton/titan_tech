import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { customerDevices } from "@/shared/db/customer-devices.schema";
import type { SelectCustomerDevice } from "@/shared/db/customer-devices.schema";
import { providers } from "@/shared/db/providers.schema";
import type { SelectProvider } from "@/shared/db/providers.schema";

export async function getDevicesByCustomerId(customerId: string): Promise<SelectCustomerDevice[]> {
  return db.select().from(customerDevices).where(eq(customerDevices.customerId, customerId));
}

export async function getAllEnabledDevicesWithProvider(): Promise<
  (SelectCustomerDevice & { provider: SelectProvider })[]
> {
  return db
    .select()
    .from(customerDevices)
    .innerJoin(providers, eq(customerDevices.providerId, providers.id))
    .where(eq(customerDevices.isEnabled, true))
    .then((rows) =>
      rows.map((row) => ({
        ...row.customer_devices,
        provider: row.providers,
      }))
    );
}
