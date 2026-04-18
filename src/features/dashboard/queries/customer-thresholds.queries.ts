import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { customerThresholds } from "@/shared/db/customer-thresholds.schema";
import type { SelectCustomerThreshold } from "@/shared/db/customer-thresholds.schema";

export async function getThresholdsByCustomerId(customerId: string): Promise<SelectCustomerThreshold[]> {
  return db.select().from(customerThresholds).where(eq(customerThresholds.customerId, customerId));
}

export async function getEnabledThresholdsByCustomerId(customerId: string): Promise<SelectCustomerThreshold[]> {
  return db
    .select()
    .from(customerThresholds)
    .where(and(eq(customerThresholds.customerId, customerId), eq(customerThresholds.isEnabled, true)));
}
