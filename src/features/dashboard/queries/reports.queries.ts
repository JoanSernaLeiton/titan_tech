import "server-only";

import { and, desc, eq, ilike, inArray } from "drizzle-orm";

import { db } from "@/shared/db";
import { customers } from "@/shared/db/customers.schema";
import { reports } from "@/shared/db/reports.schema";

interface ReportFilters {
  customerId?: string | undefined;
  reportType?: "monthly" | "commercial_adhoc" | undefined;
  searchTerm?: string | undefined;
}

export interface ReportListItem {
  id: string;
  customerId: string;
  customerName: string;
  reportType: "monthly" | "commercial_adhoc";
  status: "pending" | "ready" | "partial" | "failed";
  periodYear: number;
  periodMonth: number;
  createdAt: Date;
  warningsCount: number;
}

async function getScopedCustomerIds(userEmail: string): Promise<string[] | null> {
  const ownedCustomers = await db.select({ id: customers.id }).from(customers).where(eq(customers.email, userEmail));
  if (ownedCustomers.length === 0) {
    return null;
  }
  return ownedCustomers.map((row) => row.id);
}

function buildConditions(filters: ReportFilters, scopedCustomerIds: string[] | null) {
  const conditions = [];
  if (filters.customerId !== undefined && filters.customerId !== "") {
    conditions.push(eq(reports.customerId, filters.customerId));
  }
  if (filters.reportType !== undefined) {
    conditions.push(eq(reports.reportType, filters.reportType));
  }
  if (filters.searchTerm !== undefined && filters.searchTerm !== "") {
    conditions.push(ilike(customers.name, `%${filters.searchTerm}%`));
  }
  if (scopedCustomerIds !== null) {
    conditions.push(inArray(reports.customerId, scopedCustomerIds));
  }
  return conditions;
}

export async function listReportsForUser(userEmail: string, filters: ReportFilters): Promise<ReportListItem[]> {
  const scopedCustomerIds = await getScopedCustomerIds(userEmail);
  const conditions = buildConditions(filters, scopedCustomerIds);
  const whereClause = conditions.length === 0 ? undefined : and(...conditions);
  const rows = await db
    .select({
      createdAt: reports.createdAt,
      customerId: customers.id,
      customerName: customers.name,
      id: reports.id,
      periodMonth: reports.periodMonth,
      periodYear: reports.periodYear,
      reportType: reports.reportType,
      status: reports.status,
      warnings: reports.warnings,
    })
    .from(reports)
    .innerJoin(customers, eq(reports.customerId, customers.id))
    .where(whereClause)
    .orderBy(desc(reports.createdAt));
  return rows.map((row) => ({
    id: row.id,
    customerId: row.customerId,
    customerName: row.customerName,
    reportType: row.reportType,
    status: row.status,
    periodYear: row.periodYear,
    periodMonth: row.periodMonth,
    createdAt: row.createdAt,
    warningsCount: Array.isArray(row.warnings) ? row.warnings.length : 0,
  }));
}

export async function getReportContentById(reportId: string, userEmail: string) {
  const scopedCustomerIds = await getScopedCustomerIds(userEmail);
  const rows = await db
    .select({
      customerId: reports.customerId,
      id: reports.id,
      pdfContent: reports.pdfContent,
      xlsxContent: reports.xlsxContent,
    })
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);
  const report = rows[0];
  if (report === undefined) {
    return null;
  }
  if (scopedCustomerIds !== null && !scopedCustomerIds.includes(report.customerId)) {
    return null;
  }
  return report;
}
