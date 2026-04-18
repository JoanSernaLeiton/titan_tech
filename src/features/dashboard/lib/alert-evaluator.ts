import type { SelectCustomerAgreementVariable } from "@/shared/db/customer-agreement-variables.schema";
import type { SelectCustomerThreshold } from "@/shared/db/customer-thresholds.schema";

export type MetricValues = Record<string, number | boolean | null>;

export interface AlertBreach {
  metric: string;
  triggeredValue: number;
  thresholdValue: number;
  alertType: "threshold_breach" | "agreement_breach";
}

export function evaluateThresholds(
  metricValues: MetricValues,
  thresholds: SelectCustomerThreshold[]
): AlertBreach[] {
  const breaches: AlertBreach[] = [];

  for (const threshold of thresholds) {
    if (!threshold.isEnabled) {
      continue;
    }

    const value = metricValues[threshold.metric];
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value !== "number") {
      continue;
    }

    const minThreshold = parseFloat(threshold.minValue);
    if (isNaN(minThreshold)) {
      continue;
    }

    if (value < minThreshold) {
      breaches.push({
        metric: threshold.metric,
        triggeredValue: value,
        thresholdValue: minThreshold,
        alertType: "threshold_breach",
      });
    }
  }

  return breaches;
}

export function evaluateAgreementVariables(
  metricValues: MetricValues,
  agreementVariables: SelectCustomerAgreementVariable[]
): AlertBreach[] {
  const breaches: AlertBreach[] = [];

  for (const variable of agreementVariables) {
    if (!variable.enabled) {
      continue;
    }

    if (variable.variable !== "energia_ahorrada") {
      continue;
    }

    const value = metricValues.energy_today_kwh;
    if (value === null || value === undefined || typeof value !== "number") {
      continue;
    }

    const monthlyTarget = parseFloat(variable.monthlyTarget);
    if (isNaN(monthlyTarget)) {
      continue;
    }

    const dailyTarget = monthlyTarget / 30;
    if (value < dailyTarget) {
      breaches.push({
        metric: "energy_today_kwh",
        triggeredValue: value,
        thresholdValue: dailyTarget,
        alertType: "agreement_breach",
      });
    }
  }

  return breaches;
}

export function evaluateAlerts(
  metricValues: MetricValues,
  thresholds: SelectCustomerThreshold[],
  agreementVariables: SelectCustomerAgreementVariable[]
): AlertBreach[] {
  const thresholdBreaches = evaluateThresholds(metricValues, thresholds);
  const agreementBreaches = evaluateAgreementVariables(metricValues, agreementVariables);
  return [...thresholdBreaches, ...agreementBreaches];
}
