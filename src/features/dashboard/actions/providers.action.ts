"use server";

import { eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { providers } from "@/shared/db/providers.schema";
import {
  insertProviderSchema,
  type InsertProvider,
  type SelectProvider,
} from "@/shared/db/providers.schema";
import type { ActionResult } from "@/shared/lib/action-result";
import { getUser } from "@/shared/lib/supabase/get-user";

export async function listProvidersAction(): Promise<SelectProvider[]> {
  const user = await getUser();
  if (user == null) throw new Error("No autorizado");
  return db.select().from(providers);
}

export async function createProvider(data: InsertProvider): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (user == null) {
      return { status: "error", message: "No autorizado" };
    }
    const validated = insertProviderSchema.parse(data);
    const [created] = await db.insert(providers).values(validated).returning();
    return { status: "success", message: `Proveedor ${created?.displayName ?? ""} creado` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "No se pudo crear el proveedor" };
  }
}

export async function updateProvider(id: string, data: Partial<InsertProvider>): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (user == null) {
      return { status: "error", message: "No autorizado" };
    }
    const validated = insertProviderSchema.partial().parse(data);
    const [updated] = await db.update(providers).set(validated).where(eq(providers.id, id)).returning();
    if (updated == null) {
      return { status: "error", message: "Proveedor no encontrado" };
    }
    return { status: "success", message: `Proveedor ${updated.displayName} actualizado` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "No se pudo actualizar el proveedor" };
  }
}

export async function deleteProvider(id: string): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (user == null) {
      return { status: "error", message: "No autorizado" };
    }
    const [deleted] = await db.delete(providers).where(eq(providers.id, id)).returning();
    if (deleted == null) {
      return { status: "error", message: "Proveedor no encontrado" };
    }
    return { status: "success", message: `Proveedor ${deleted.displayName} eliminado` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "No se pudo eliminar el proveedor" };
  }
}
