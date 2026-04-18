"use server";

import { eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { alerts } from "@/shared/db/alerts.schema";
import { insertAlertSchema, type InsertAlert, type SelectAlert } from "@/shared/db/alerts.schema";
import { customerDevices } from "@/shared/db/customer-devices.schema";
import type { SelectCustomerDevice } from "@/shared/db/customer-devices.schema";
import { customers } from "@/shared/db/customers.schema";
import type { SelectCustomer } from "@/shared/db/customers.schema";
import { providers } from "@/shared/db/providers.schema";
import type { SelectProvider } from "@/shared/db/providers.schema";
import type { ActionResult } from "@/shared/lib/action-result";
import { getUser } from "@/shared/lib/supabase/get-user";

export async function listAlertsAction(): Promise<
  (SelectAlert & { customer: SelectCustomer; device: SelectCustomerDevice | null; provider: SelectProvider | null })[]
> {
  const user = await getUser();
  if (user == null) throw new Error("No autorizado");
  const rows = await db
    .select()
    .from(alerts)
    .innerJoin(customers, eq(alerts.customerId, customers.id))
    .leftJoin(customerDevices, eq(alerts.deviceId, customerDevices.id))
    .leftJoin(providers, eq(customerDevices.providerId, providers.id));
  return rows.map((row) => ({
    ...row.alerts,
    customer: row.customers,
    device: row.customer_devices,
    provider: row.providers,
  }));
}

export async function updateAlertStatus(
  id: string,
  status: "pending" | "under_review" | "resolved"
): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (user == null) {
      return { status: "error", message: "No autorizado" };
    }
    const [updated] = await db.update(alerts).set({ status }).where(eq(alerts.id, id)).returning();
    if (updated == null) {
      return { status: "error", message: "Alerta no encontrada" };
    }
    return { status: "success", message: `Estado de alerta actualizado a ${status}` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "No se pudo actualizar el estado de la alerta" };
  }
}

export async function createAlert(data: InsertAlert): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (user == null) {
      return { status: "error", message: "No autorizado" };
    }
    const validated = insertAlertSchema.parse(data);
    const [created] = await db.insert(alerts).values(validated).returning();
    return {
      status: "success",
      message: `Alerta creada para ${created?.metric ?? ""} (${created?.alertType ?? ""})`,
    };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "No se pudo crear la alerta" };
  }
}
