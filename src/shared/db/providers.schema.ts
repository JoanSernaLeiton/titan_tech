import { boolean, jsonb, pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const providers = pgTable("providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  pollingIntervalMinutes: integer("polling_interval_minutes").notNull().default(3),
  metricMappings: jsonb("metric_mappings").notNull().default({}),
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProviderSchema = createInsertSchema(providers);
export const selectProviderSchema = createSelectSchema(providers);

export type InsertProvider = typeof providers.$inferInsert;
export type SelectProvider = typeof providers.$inferSelect;
