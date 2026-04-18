import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/shared/db";
import { providers } from "@/shared/db/providers.schema";
import type { SelectProvider } from "@/shared/db/providers.schema";

export async function getAllProviders(): Promise<SelectProvider[]> {
  return db.select().from(providers);
}

export async function getEnabledProviders(): Promise<SelectProvider[]> {
  return db.select().from(providers).where(eq(providers.isEnabled, true));
}

export async function getProviderById(id: string): Promise<SelectProvider | undefined> {
  const result = await db.select().from(providers).where(eq(providers.id, id)).limit(1);
  return result[0];
}
