import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { customers } from "./customers.schema";

export const reportTypeEnum = pgEnum("report_type", ["monthly", "commercial_adhoc"]);
export const reportStatusEnum = pgEnum("report_status", ["pending", "ready", "partial", "failed"]);

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  reportType: reportTypeEnum("report_type").notNull(),
  status: reportStatusEnum("status").notNull().default("pending"),
  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(),
  timezone: text("timezone").notNull(),
  generatedByEmail: text("generated_by_email").notNull(),
  isAsync: boolean("is_async").notNull().default(false),
  warnings: jsonb("warnings").notNull().default([]),
  metrics: jsonb("metrics").notNull().default({}),
  pdfContent: text("pdf_content").notNull(),
  xlsxContent: text("xlsx_content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertReportSchema = createInsertSchema(reports);
export const selectReportSchema = createSelectSchema(reports);

export type InsertReport = typeof reports.$inferInsert;
export type SelectReport = typeof reports.$inferSelect;
