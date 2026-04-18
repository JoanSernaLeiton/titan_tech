import type { HomeMetricsSummary } from "@/features/dashboard/actions/home-metrics.action";
import type { DeviceMetricsRow } from "@/features/dashboard/queries/home-metrics.queries";

export type MetricKey = "energy" | "power" | "performance_ratio" | "status";

export const ALL_METRIC_KEYS: readonly MetricKey[] = [
  "energy",
  "power",
  "performance_ratio",
  "status",
] as const;

export const METRIC_LABELS: Record<MetricKey, string> = {
  energy: "Energía",
  power: "Potencia",
  performance_ratio: "Performance Ratio",
  status: "Estado",
};

export const ALL_VALUE = "all" as const;

export type DeviceTypeFilter = "all" | "inverter" | "micro_inverter";

export interface HomeFilters {
  customerId: string; // "all" or customer UUID
  deviceId: string; // "all" or device UUID
  deviceType: DeviceTypeFilter;
  metrics: ReadonlySet<MetricKey>;
}

export const DEFAULT_FILTERS: HomeFilters = {
  customerId: ALL_VALUE,
  deviceId: ALL_VALUE,
  deviceType: ALL_VALUE,
  metrics: new Set(ALL_METRIC_KEYS),
};

const CO2_KG_PER_KWH = 0.16438;
const DEFAULT_TARIFF_COP_PER_KWH = 800;

export function filterRows(
  rows: DeviceMetricsRow[],
  filters: HomeFilters
): DeviceMetricsRow[] {
  return rows.filter((row) => {
    if (filters.customerId !== ALL_VALUE && row.customerId !== filters.customerId) {
      return false;
    }
    if (filters.deviceId !== ALL_VALUE && row.deviceId !== filters.deviceId) {
      return false;
    }
    if (filters.deviceType !== ALL_VALUE && row.deviceType !== filters.deviceType) {
      return false;
    }
    return true;
  });
}

export function computeSummary(rows: DeviceMetricsRow[]): HomeMetricsSummary {
  const totalDevices = rows.length;
  let onlineDevices = 0;
  let energyRangeKwh = 0;
  let activePowerKw = 0;
  let prSum = 0;
  let prCount = 0;
  let snapshotCount = 0;
  let latestSnapshotAt: Date | null = null;
  const customerIds = new Set<string>();

  for (const row of rows) {
    customerIds.add(row.customerId);
    if (row.isOnline) onlineDevices += 1;
    energyRangeKwh += row.energyRangeKwh;
    if (row.latestActivePowerKw != null) {
      activePowerKw += row.latestActivePowerKw;
    }
    if (row.latestPerformanceRatioPct != null) {
      prSum += row.latestPerformanceRatioPct;
      prCount += 1;
    }
    if (row.latestSnapshotAt != null) {
      snapshotCount += 1;
      const at = new Date(row.latestSnapshotAt);
      if (latestSnapshotAt == null || at > latestSnapshotAt) {
        latestSnapshotAt = at;
      }
    }
  }

  const availabilityPct = totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 0;

  return {
    totalCustomers: customerIds.size,
    totalDevices,
    onlineDevices,
    snapshotCount,
    availabilityPct,
    energyRangeKwh,
    activePowerKw,
    co2ReductionKg: energyRangeKwh * CO2_KG_PER_KWH,
    moneySavedCop: energyRangeKwh * DEFAULT_TARIFF_COP_PER_KWH,
    averagePerformanceRatioPct: prCount > 0 ? prSum / prCount : 0,
    latestSnapshotAt,
  };
}
