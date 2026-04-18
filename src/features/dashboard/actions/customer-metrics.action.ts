"use server";

import { getAgreementVariablesByCustomerId } from "@/features/dashboard/queries/customer-agreement-variables.queries";
import { getCustomerMetricsRaw } from "@/features/dashboard/queries/customer-metrics.queries";
import { getUser } from "@/shared/lib/supabase/get-user";

const DEFAULT_TARIFF_COP_PER_KWH = 800;
const DEFAULT_CO2_KG_PER_KWH = 0.16438; // Colombia SIN 2026: 164.38 gCO₂eq/kWh

export interface CustomerMetricsSummary {
  totalDevices: number;
  onlineDevices: number;
  snapshotCount: number;
  availabilityPct: number;
  energySavedKwh: number;
  energyMonthKwh: number;
  moneySaved: number;
  moneyUnit: string;
  performanceRatioPct: number | null;
  performanceRatioFromApi: boolean;
  co2ReductionKg: number;
  activePowerKw: number;
  latestSnapshotAt: Date | null;
}

export async function getCustomerMetricsSummaryAction(
  customerId: string,
  filters?: { deviceType?: "inverter" | "micro_inverter"; providerSlug?: string }
): Promise<CustomerMetricsSummary> {
  const user = await getUser();
  if (user == null) throw new Error("No autorizado");

  const [raw, agreementVariables] = await Promise.all([
    getCustomerMetricsRaw(customerId, filters),
    getAgreementVariablesByCustomerId(customerId),
  ]);

  const enabledVars = agreementVariables.filter((v) => v.enabled);

  const energiaVar = enabledVars.find((v) => v.variable === "energia_ahorrada");
  const dineroVar = enabledVars.find((v) => v.variable === "dinero_ahorrado");
  const co2Var = enabledVars.find((v) => v.variable === "mitigacion_co2");

  const monthlyEnergyTarget = energiaVar != null ? parseFloat(energiaVar.monthlyTarget) : null;
  const dailyEnergyTarget = monthlyEnergyTarget != null ? monthlyEnergyTarget / 30 : null;

  // Derive tariff rate from agreement variables when both are configured
  let tariffRate = DEFAULT_TARIFF_COP_PER_KWH;
  let moneyUnit = "COP";
  if (dineroVar != null && monthlyEnergyTarget != null && monthlyEnergyTarget > 0) {
    tariffRate = parseFloat(dineroVar.monthlyTarget) / monthlyEnergyTarget;
    moneyUnit = dineroVar.unit;
  }

  // Derive CO2 factor from agreement variables when both are configured
  let co2Factor = DEFAULT_CO2_KG_PER_KWH;
  if (co2Var != null && monthlyEnergyTarget != null && monthlyEnergyTarget > 0) {
    co2Factor = parseFloat(co2Var.monthlyTarget) / monthlyEnergyTarget;
  }

  const availabilityPct =
    raw.totalDevices > 0 ? (raw.onlineDevices / raw.totalDevices) * 100 : 0;

  // Prefer API-sourced specific yield (kWh/kWp) stored from provider polling.
  const storedPrRows = raw.rows.filter((r) => r.performanceRatioPct != null);
  const storedPr =
    storedPrRows.length > 0
      ? storedPrRows.reduce((sum, r) => sum + parseFloat(r.performanceRatioPct ?? "0"), 0) /
        storedPrRows.length
      : null;

  const calculatedPr =
    dailyEnergyTarget != null && dailyEnergyTarget > 0
      ? (raw.energyTodayKwhSum / dailyEnergyTarget) * 100
      : null;

  const performanceRatioPct = storedPr ?? calculatedPr;
  const performanceRatioFromApi = storedPr != null;

  return {
    totalDevices: raw.totalDevices,
    onlineDevices: raw.onlineDevices,
    snapshotCount: raw.rows.length,
    availabilityPct,
    energySavedKwh: raw.energyTodayKwhSum,
    energyMonthKwh: raw.energyMonthKwhSum,
    moneySaved: raw.energyTodayKwhSum * tariffRate,
    moneyUnit,
    performanceRatioPct,
    performanceRatioFromApi,
    co2ReductionKg: raw.energyTodayKwhSum * co2Factor,
    activePowerKw: raw.activePowerKwSum,
    latestSnapshotAt: raw.latestSnapshotAt,
  };
}
