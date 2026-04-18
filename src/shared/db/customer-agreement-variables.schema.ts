import { numeric, pgEnum, pgTable, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { customers } from "./customers.schema";

export const agreementVariableEnum = pgEnum("agreement_variable", [
  "energia_ahorrada",
  "dinero_ahorrado",
  "disponibilidad_sistema",
  "performance_ratio",
  "mitigacion_co2",
]);

export const unitTypeEnum = pgEnum("unit_type", [
  "kWh",
  "MWh",
  "GWh",
  "kW",
  "MW",
  "%",
  "kg",
  "ton",
  "COP",
  "USD",
  "EUR",
  "MXN",
]);

export const customerAgreementVariables = pgTable("customer_agreement_variables", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  variable: agreementVariableEnum("variable").notNull(),
  monthlyTarget: numeric("monthly_target").notNull(),
  unit: unitTypeEnum("unit").notNull(),
  enabled: boolean("enabled").notNull().default(true),
});

export const insertCustomerAgreementVariableSchema = createInsertSchema(customerAgreementVariables);
export const selectCustomerAgreementVariableSchema = createSelectSchema(customerAgreementVariables);

export type InsertCustomerAgreementVariable = typeof customerAgreementVariables.$inferInsert;
export type SelectCustomerAgreementVariable = typeof customerAgreementVariables.$inferSelect;
