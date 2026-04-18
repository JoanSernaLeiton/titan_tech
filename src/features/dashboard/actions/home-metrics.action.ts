"use server";

import {
  getHomeMetricsRaw,
  listDevicesWithMetricsInRange,
  type DateRange,
  type DeviceMetricsRow,
} from "@/features/dashboard/queries/home-metrics.queries";
import { getUser } from "@/shared/lib/supabase/get-user";

export interface HomeMetricsSummary {
  totalCustomers: number;
  totalDevices: number;
  onlineDevices: number;
  snapshotCount: number;
  availabilityPct: number;
  energyRangeKwh: number;
  activePowerKw: number;
  co2ReductionKg: number;
  moneySavedCop: number;
  averagePerformanceRatioPct: number;
  latestSnapshotAt: Date | null;
}

const DEFAULT_TARIFF_COP_PER_KWH = 800;

export interface SerializableDateRange {
  from: string;
  to: string;
}

function parseRange(range: SerializableDateRange): DateRange {
  return {
    from: new Date(range.from),
    to: new Date(range.to),
  };
}

export async function getHomeMetricsSummaryAction(
  range: SerializableDateRange
): Promise<HomeMetricsSummary> {
  const user = await getUser();
  if (user == null) throw new Error("No autorizado");

  const raw = await getHomeMetricsRaw(parseRange(range));
  const availabilityPct =
    raw.totalDevices > 0 ? (raw.onlineDevices / raw.totalDevices) * 100 : 0;

  return {
    totalCustomers: raw.totalCustomers,
    totalDevices: raw.totalDevices,
    onlineDevices: raw.onlineDevices,
    snapshotCount: raw.snapshotCount,
    availabilityPct,
    energyRangeKwh: raw.energyRangeKwh,
    activePowerKw: raw.activePowerKw,
    co2ReductionKg: raw.co2ReductionKg,
    moneySavedCop: raw.energyRangeKwh * DEFAULT_TARIFF_COP_PER_KWH,
    averagePerformanceRatioPct: raw.averagePerformanceRatioPct,
    latestSnapshotAt: raw.latestSnapshotAt,
  };
}

export async function listDevicesWithMetricsAction(
  range: SerializableDateRange
): Promise<DeviceMetricsRow[]> {
  const user = await getUser();
  if (user == null) throw new Error("No autorizado");
  return listDevicesWithMetricsInRange(parseRange(range));
}
