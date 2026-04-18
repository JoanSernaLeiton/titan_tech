"use server";

import { getGlobalMetricsRaw } from "@/features/dashboard/queries/global-metrics.queries";
import { getUser } from "@/shared/lib/supabase/get-user";

export interface GlobalMetricsSummary {
  totalCustomers: number;
  totalDevices: number;
  onlineDevices: number;
  snapshotCount: number;
  availabilityPct: number;
  energyTodayKwh: number;
  energyMonthKwh: number;
  activePowerKw: number;
  co2ReductionKg: number;
  latestSnapshotAt: Date | null;
}

export async function getGlobalMetricsSummaryAction(): Promise<GlobalMetricsSummary> {
  const user = await getUser();
  if (user == null) throw new Error("No autorizado");

  const raw = await getGlobalMetricsRaw();

  const availabilityPct =
    raw.totalDevices > 0 ? (raw.onlineDevices / raw.totalDevices) * 100 : 0;

  return {
    totalCustomers: raw.totalCustomers,
    totalDevices: raw.totalDevices,
    onlineDevices: raw.onlineDevices,
    snapshotCount: raw.snapshotCount,
    availabilityPct,
    energyTodayKwh: raw.energyTodayKwhSum,
    energyMonthKwh: raw.energyMonthKwhSum,
    activePowerKw: raw.activePowerKwSum,
    co2ReductionKg: raw.co2ReductionKg,
    latestSnapshotAt: raw.latestSnapshotAt,
  };
}
