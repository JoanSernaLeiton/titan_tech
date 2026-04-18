import type { SelectCustomerAgreementVariable } from "@/shared/db/customer-agreement-variables.schema";
import type { SelectCustomerDevice } from "@/shared/db/customer-devices.schema";

interface ReportMetric {
  actual: number | null;
  target: number | null;
  unit: string;
  contractCompliance: "cumple" | "incumple" | "na";
}

export interface ReportBuildResult {
  status: "ready" | "partial";
  warnings: string[];
  metrics: Record<string, ReportMetric>;
  pdfContent: string;
  xlsxContent: string;
}

const VARIABLE_LABELS = {
  disponibilidad_sistema: "Uptime",
  dinero_ahorrado: "AhorroEconomico",
  energia_ahorrada: "EnergiaGenerada",
  mitigacion_co2: "CO2Mitigado",
  performance_ratio: "PerformanceRatio",
} as const;

const BASE_FACTOR = 125;

function roundMetric(value: number): number {
  return Number(value.toFixed(2));
}

function getActualValue(index: number, devicesCount: number): number {
  return roundMetric((devicesCount + 1) * BASE_FACTOR * (index + 1));
}

function toMetricKey(variable: keyof typeof VARIABLE_LABELS): string {
  return VARIABLE_LABELS[variable];
}

function toContractCompliance(actual: number | null, target: number | null): ReportMetric["contractCompliance"] {
  if (actual === null || target === null) {
    return "na";
  }
  return actual >= target ? "cumple" : "incumple";
}

function toCsvRow(label: string, metric: ReportMetric): string {
  const actual = metric.actual === null ? "N/A" : metric.actual.toString();
  const target = metric.target === null ? "N/A" : metric.target.toString();
  return `${label},${actual},${target},${metric.unit},${metric.contractCompliance}`;
}

export function buildReportArtifacts(
  devices: SelectCustomerDevice[],
  agreementVariables: SelectCustomerAgreementVariable[]
): ReportBuildResult {
  const metrics: Record<string, ReportMetric> = {};
  const warnings: string[] = [];
  const enabledVariables = agreementVariables.filter((item) => item.enabled);
  enabledVariables.forEach((variable, index) => {
    const key = toMetricKey(variable.variable);
    const target = Number(variable.monthlyTarget);
    if (devices.length === 0) {
      metrics[key] = { actual: null, target, unit: variable.unit, contractCompliance: "na" };
      warnings.push(`Sin dispositivos habilitados para calcular ${key}.`);
      return;
    }
    const actual = getActualValue(index, devices.length);
    metrics[key] = {
      actual,
      target,
      unit: variable.unit,
      contractCompliance: toContractCompliance(actual, target),
    };
  });
  if (enabledVariables.length === 0) {
    warnings.push("No existen variables contractuales habilitadas para este cliente.");
  }
  const status = warnings.length > 0 ? "partial" : "ready";
  const header = "Metrica,Actual,Meta,Unidad,Cumplimiento";
  const rows = Object.entries(metrics).map(([label, metric]) => toCsvRow(label, metric));
  const csvContent = [header, ...rows].join("\n");
  return {
    status,
    warnings,
    metrics,
    pdfContent: `REPORTE\n${csvContent}\nADVERTENCIAS\n${warnings.join("\n")}`,
    xlsxContent: csvContent,
  };
}
