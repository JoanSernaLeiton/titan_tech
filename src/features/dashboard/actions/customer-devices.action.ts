"use server";

import { eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { customerDevices } from "@/shared/db/customer-devices.schema";
import {
  insertCustomerDeviceSchema,
  type InsertCustomerDevice,
  type SelectCustomerDevice,
} from "@/shared/db/customer-devices.schema";
import type { ActionResult } from "@/shared/lib/action-result";
import { getUser } from "@/shared/lib/supabase/get-user";

export async function listDevicesByCustomerAction(customerId: string): Promise<SelectCustomerDevice[]> {
  const user = await getUser();
  if (user == null) throw new Error("No autorizado");
  return db.select().from(customerDevices).where(eq(customerDevices.customerId, customerId));
}

export async function createCustomerDevice(data: InsertCustomerDevice): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (user == null) {
      return { status: "error", message: "No autorizado" };
    }
    const validated = insertCustomerDeviceSchema.parse(data);
    const [created] = await db.insert(customerDevices).values(validated).returning();
    return { status: "success", message: `Dispositivo ${created?.deviceName ?? ""} creado` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "No se pudo crear el dispositivo" };
  }
}

export async function updateCustomerDevice(id: string, data: Partial<InsertCustomerDevice>): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (user == null) {
      return { status: "error", message: "No autorizado" };
    }
    const validated = insertCustomerDeviceSchema.partial().parse(data);
    const [updated] = await db
      .update(customerDevices)
      .set(validated)
      .where(eq(customerDevices.id, id))
      .returning();
    if (updated == null) {
      return { status: "error", message: "Dispositivo no encontrado" };
    }
    return { status: "success", message: `Dispositivo ${updated.deviceName} actualizado` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "No se pudo actualizar el dispositivo" };
  }
}

export async function deleteCustomerDevice(id: string): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (user == null) {
      return { status: "error", message: "No autorizado" };
    }
    const [deleted] = await db.delete(customerDevices).where(eq(customerDevices.id, id)).returning();
    if (deleted == null) {
      return { status: "error", message: "Dispositivo no encontrado" };
    }
    return { status: "success", message: `Dispositivo ${deleted.deviceName} eliminado` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "No se pudo eliminar el dispositivo" };
  }
}
