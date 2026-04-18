import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { customerAgreementVariables } from "@/shared/db/customer-agreement-variables.schema";
import type { SelectCustomerAgreementVariable } from "@/shared/db/customer-agreement-variables.schema";

export async function getAgreementVariablesByCustomerId(
  customerId: string
): Promise<SelectCustomerAgreementVariable[]> {
  return db
    .select()
    .from(customerAgreementVariables)
    .where(eq(customerAgreementVariables.customerId, customerId));
}
