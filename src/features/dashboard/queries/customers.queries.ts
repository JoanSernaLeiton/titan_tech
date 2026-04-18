import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { customers } from "@/shared/db/customers.schema";
import type { SelectCustomer } from "@/shared/db/customers.schema";

export async function getAllCustomers(): Promise<SelectCustomer[]> {
  return db.select().from(customers);
}

export async function getCustomerById(id: string): Promise<SelectCustomer | undefined> {
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result[0];
}
