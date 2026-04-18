"use server";

import { getAgreementVariablesByCustomerId } from "@/features/dashboard/queries/customer-agreement-variables.queries";
import { getCustomerMetricsRaw } from "@/features/dashboard/queries/customer-metrics.queries";
import { getUser } from "@/shared/lib/supabase/get-user";

const DEFAULT_TARIFF_COP_PER_KWH = 800;
const DEFAULT_CO2_KG_PER_KWH = 0.126;

export interface CustomerMetricsSummary {
  totalDevices: number;
  onlineDevices: number;
  availabilityPct: number;
  energySavedKwh: number;
  moneySaved: number;
  moneyUnit: string;
  performanceRatioPct: number | null;
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

  const performanceRatioPct =
    dailyEnergyTarget != null && dailyEnergyTarget > 0
      ? (raw.energyTodayKwhSum / dailyEnergyTarget) * 100
      : null;

  return {
    totalDevices: raw.totalDevices,
    onlineDevices: raw.onlineDevices,
    availabilityPct,
    energySavedKwh: raw.energyTodayKwhSum,
    moneySaved: raw.energyTodayKwhSum * tariffRate,
    moneyUnit,
    performanceRatioPct,
    co2ReductionKg: raw.energyTodayKwhSum * co2Factor,
    activePowerKw: raw.activePowerKwSum,
    latestSnapshotAt: raw.latestSnapshotAt,
  };
}
