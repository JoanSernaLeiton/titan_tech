"use server";

import { eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { customerAgreementVariables } from "@/shared/db/customer-agreement-variables.schema";
import {
  insertCustomerAgreementVariableSchema,
  type InsertCustomerAgreementVariable,
  type SelectCustomerAgreementVariable,
} from "@/shared/db/customer-agreement-variables.schema";
import type { ActionResult } from "@/shared/lib/action-result";
import { getUser } from "@/shared/lib/supabase/get-user";

export async function listVariablesByCustomerAction(
  customerId: string
): Promise<SelectCustomerAgreementVariable[]> {
  const user = await getUser();
  if (user == null) throw new Error("No autorizado");
  return db
    .select()
    .from(customerAgreementVariables)
    .where(eq(customerAgreementVariables.customerId, customerId));
}

export async function upsertAgreementVariable(data: InsertCustomerAgreementVariable): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (user == null) {
      return { status: "error", message: "No autorizado" };
    }
    const validated = insertCustomerAgreementVariableSchema.parse(data);
    const [upserted] = await db
      .insert(customerAgreementVariables)
      .values(validated)
      .onConflictDoUpdate({
        target: [customerAgreementVariables.customerId, customerAgreementVariables.variable],
        set: validated,
      })
      .returning();
    return { status: "success", message: `Variable ${upserted?.variable ?? ""} guardada` };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo guardar la variable",
    };
  }
}

export async function deleteAgreementVariable(id: string): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (user == null) {
      return { status: "error", message: "No autorizado" };
    }
    const [deleted] = await db
      .delete(customerAgreementVariables)
      .where(eq(customerAgreementVariables.id, id))
      .returning();
    if (deleted == null) {
      return { status: "error", message: "Variable no encontrada" };
    }
    return { status: "success", message: `Variable ${deleted.variable} eliminada` };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No se pudo eliminar la variable",
    };
  }
}
