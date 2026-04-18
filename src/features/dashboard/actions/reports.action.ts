"use server";

import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { buildReportArtifacts } from "@/features/dashboard/lib/report-builder";
import { getAgreementVariablesByCustomerId } from "@/features/dashboard/queries/customer-agreement-variables.queries";
import { getDevicesByCustomerId } from "@/features/dashboard/queries/customer-devices.queries";
import { listReportsForUser } from "@/features/dashboard/queries/reports.queries";
import { db } from "@/shared/db";
import { customerDevices } from "@/shared/db/customer-devices.schema";
import { customers } from "@/shared/db/customers.schema";
import { reports } from "@/shared/db/reports.schema";
import type { ActionResult } from "@/shared/lib/action-result";
import { getUser } from "@/shared/lib/supabase/get-user";

const reportFiltersSchema = z.object({
  customerId: z.string().uuid().optional(),
  reportType: z.enum(["monthly", "commercial_adhoc"]).optional(),
  searchTerm: z.string().trim().max(80).optional(),
});

const monthlyPayloadSchema = z.object({
  customerId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

const adhocPayloadSchema = z.object({
  customerId: z.string().uuid(),
  projectIds: z.array(z.string().uuid()).min(2).max(20),
});

const downloadPayloadSchema = z.object({
  format: z.enum(["pdf", "xlsx"]),
  reportId: z.string().uuid(),
});

async function canAccessCustomer(customerId: string, userEmail: string): Promise<boolean> {
  const ownedRows = await db.select({ id: customers.id }).from(customers).where(eq(customers.email, userEmail));
  if (ownedRows.length === 0) {
    return true;
  }
  return ownedRows.some((row) => row.id === customerId);
}

async function ensureCustomerExists(customerId: string): Promise<boolean> {
  const rows = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, customerId)).limit(1);
  return rows.length > 0;
}

export async function listReportsAction(input: unknown) {
  try {
    const user = await getUser();
    if (user?.email === undefined || user.email === "") {
      throw new Error("No autorizado");
    }
    const filters = reportFiltersSchema.parse(input);
    return await listReportsForUser(user.email, filters);
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "reports" does not exist')) {
      return [];
    }
    throw error;
  }
}

export async function generateMonthlyReportAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (user?.email === undefined || user.email === "") {
      return { status: "error", message: "No autorizado" };
    }
    const payload = monthlyPayloadSchema.parse(input);
    const now = new Date();
    const isFuturePeriod = payload.year > now.getFullYear() ||
      (payload.year === now.getFullYear() && payload.month > now.getMonth() + 1);
    if (isFuturePeriod) {
      return { status: "error", message: "No puedes generar reportes para periodos futuros." };
    }
    const exists = await ensureCustomerExists(payload.customerId);
    if (!exists) {
      return { status: "error", message: "Cliente no encontrado" };
    }
    const hasAccess = await canAccessCustomer(payload.customerId, user.email);
    if (!hasAccess) {
      return { status: "error", message: "No tienes acceso a este cliente" };
    }
    const devices = await getDevicesByCustomerId(payload.customerId);
    const agreementVariables = await getAgreementVariablesByCustomerId(payload.customerId);
    const enabledVariables = agreementVariables.filter((item) => item.enabled);
    if (enabledVariables.length === 0) {
      return { status: "error", message: "No hay informacion contractual para generar el reporte." };
    }
    if (devices.length === 0) {
      return { status: "error", message: "No hay dispositivos con informacion para generar el reporte." };
    }
    const reportData = buildReportArtifacts(devices, agreementVariables);
    await db.insert(reports).values({
      customerId: payload.customerId,
      generatedByEmail: user.email,
      isAsync: devices.length > 15,
      metrics: reportData.metrics,
      pdfContent: reportData.pdfContent,
      periodMonth: payload.month,
      periodYear: payload.year,
      reportType: "monthly",
      status: reportData.status,
      timezone: "America/Bogota",
      warnings: reportData.warnings,
      xlsxContent: reportData.xlsxContent,
    });
    return { status: "success", message: "Reporte mensual generado correctamente" };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "No se pudo generar el reporte mensual" };
  }
}

export async function generateCommercialReportAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await getUser();
    if (user?.email === undefined || user.email === "") {
      return { status: "error", message: "No autorizado" };
    }
    const payload = adhocPayloadSchema.parse(input);
    const uniqueProjectIds = [...new Set(payload.projectIds)];
    if (uniqueProjectIds.length !== payload.projectIds.length) {
      return { status: "error", message: "No repitas proyectos en la comparacion." };
    }
    const hasAccess = await canAccessCustomer(payload.customerId, user.email);
    if (!hasAccess) {
      return { status: "error", message: "No tienes acceso a este cliente" };
    }
    const devices = await db
      .select()
      .from(customerDevices)
      .where(and(eq(customerDevices.customerId, payload.customerId), inArray(customerDevices.id, uniqueProjectIds)));
    if (devices.length === 0) {
      return { status: "error", message: "No hay informacion de proyectos para generar el reporte comercial." };
    }
    if (devices.length < 2) {
      return { status: "error", message: "Debes seleccionar al menos dos proyectos validos del mismo cliente." };
    }
    const warnings = devices.length < uniqueProjectIds.length ? ["Algunos proyectos no tienen datos disponibles."] : [];
    const lines = devices.map((device) => `${device.deviceName},${device.deviceType},${device.externalId}`);
    const body = ["Proyecto,Tipo,Referencia", ...lines].join("\n");
    await db.insert(reports).values({
      customerId: payload.customerId,
      generatedByEmail: user.email,
      isAsync: devices.length > 5,
      metrics: { comparados: devices.length },
      pdfContent: `REPORTE AD-HOC\n${body}`,
      periodMonth: new Date().getMonth() + 1,
      periodYear: new Date().getFullYear(),
      reportType: "commercial_adhoc",
      status: warnings.length > 0 ? "partial" : "ready",
      timezone: "America/Bogota",
      warnings,
      xlsxContent: body,
    });
    return { status: "success", message: "Reporte comercial generado correctamente" };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "No se pudo generar el reporte comercial" };
  }
}

export async function downloadReportAction(reportId: string, format: "pdf" | "xlsx") {
  const parsedDownload = downloadPayloadSchema.safeParse({ format, reportId });
  if (!parsedDownload.success) {
    throw new Error("Solicitud de descarga invalida");
  }
  const user = await getUser();
  if (user?.email === undefined || user.email === "") {
    throw new Error("No autorizado");
  }
  const report = await db
    .select({
      customerId: reports.customerId,
      pdfContent: reports.pdfContent,
      xlsxContent: reports.xlsxContent,
    })
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1)
    .then((rows) => rows[0]);
  if (report === undefined) {
    throw new Error("Reporte no encontrado");
  }
  const hasAccess = await canAccessCustomer(report.customerId, user.email);
  if (!hasAccess) {
    throw new Error("No autorizado");
  }
  const content = format === "pdf" ? report.pdfContent : report.xlsxContent;
  if (content.trim() === "") {
    throw new Error("El reporte no tiene contenido para descargar");
  }
  return content;
}
