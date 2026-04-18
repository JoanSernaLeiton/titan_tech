"use server";

import { eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { customerThresholds } from "@/shared/db/customer-thresholds.schema";
import {
  insertCustomerThresholdSchema,
  type InsertCustomerThreshold,
  type SelectCustomerThreshold,
} from "@/shared/db/customer-thresholds.schema";
import type { ActionResult } from "@/shared/lib/action-result";
import { getUser } from "@/shared/lib/supabase/get-user";

export async function listThresholdsByCustomerAction(
  customerId: string
): Promise<SelectCustomerThreshold[]> {
  const user = await getUser();
  if (user == null) throw new Error("No autorizado");
  return db.select().from(customerThresholds).where(eq(customerThresholds.customerId, customerId));
}

export async function upsertThreshold(data: InsertCustomerThreshold): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (user == null) {
      return { status: "error", message: "No autorizado" };
    }
    const validated = insertCustomerThresholdSchema.parse(data);
    const [upserted] = await db
      .insert(customerThresholds)
      .values(validated)
      .onConflictDoUpdate({
        target: [customerThresholds.customerId, customerThresholds.metric],
        set: validated,
      })
      .returning();
    return { status: "success", message: `Umbral para ${upserted?.metric ?? ""} guardado` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "No se pudo guardar el umbral" };
  }
}

export async function deleteThreshold(id: string): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (user == null) {
      return { status: "error", message: "No autorizado" };
    }
    const [deleted] = await db.delete(customerThresholds).where(eq(customerThresholds.id, id)).returning();
    if (deleted == null) {
      return { status: "error", message: "Umbral no encontrado" };
    }
    return { status: "success", message: `Umbral para ${deleted.metric} eliminado` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "No se pudo eliminar el umbral" };
  }
}
