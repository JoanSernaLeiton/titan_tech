"use server";

import { eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { customers } from "@/shared/db/customers.schema";
import {
  insertCustomerSchema,
  type InsertCustomer,
  type SelectCustomer,
} from "@/shared/db/customers.schema";
import type { ActionResult } from "@/shared/lib/action-result";
import { getUser } from "@/shared/lib/supabase/get-user";

export async function listCustomersAction(): Promise<SelectCustomer[]> {
  const user = await getUser();
  if (user == null) throw new Error("No autorizado");
  return db.select().from(customers);
}

export async function getCustomerAction(id: string): Promise<SelectCustomer | null> {
  const user = await getUser();
  if (user == null) throw new Error("No autorizado");
  const [row] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return row ?? null;
}

export async function createCustomer(data: InsertCustomer): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (user == null) {
      return { status: "error", message: "No autorizado" };
    }
    const validated = insertCustomerSchema.parse(data);
    const [created] = await db.insert(customers).values(validated).returning();
    return { status: "success", message: `Cliente ${created?.name ?? ""} creado` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "No se pudo crear el cliente" };
  }
}

export async function updateCustomer(id: string, data: Partial<InsertCustomer>): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (user == null) {
      return { status: "error", message: "No autorizado" };
    }
    const validated = insertCustomerSchema.partial().parse(data);
    const [updated] = await db.update(customers).set(validated).where(eq(customers.id, id)).returning();
    if (updated == null) {
      return { status: "error", message: "Cliente no encontrado" };
    }
    return { status: "success", message: `Cliente ${updated.name} actualizado` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "No se pudo actualizar el cliente" };
  }
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (user == null) {
      return { status: "error", message: "No autorizado" };
    }
    const [deleted] = await db.delete(customers).where(eq(customers.id, id)).returning();
    if (deleted == null) {
      return { status: "error", message: "Cliente no encontrado" };
    }
    return { status: "success", message: `Cliente ${deleted.name} eliminado` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "No se pudo eliminar el cliente" };
  }
}
