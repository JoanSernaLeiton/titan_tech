import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/shared/db";
import { customerDevices } from "@/shared/db/customer-devices.schema";
import { customers } from "@/shared/db/customers.schema";
import { deviceMetricSnapshots } from "@/shared/db/device-metric-snapshots.schema";
import { providers } from "@/shared/db/providers.schema";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface HomeMetricsRaw {
  totalCustomers: number;
  totalDevices: number;
  onlineDevices: number;
  snapshotCount: number;
  energyRangeKwh: number;
  activePowerKw: number;
  co2ReductionKg: number;
  averagePerformanceRatioPct: number;
  latestSnapshotAt: Date | null;
}

export interface DeviceMetricsRow {
  deviceId: string;
  deviceName: string;
  deviceType: "inverter" | "micro_inverter";
  externalId: string;
  customerId: string;
  customerName: string;
  providerSlug: string;
  providerName: string;
  isOnline: boolean;
  energyRangeKwh: number;
  latestActivePowerKw: number | null;
  latestPerformanceRatioPct: number | null;
  latestSnapshotAt: Date | null;
}

const CO2_KG_PER_KWH = 0.16438; // Colombia SIN 2026

interface SnapshotRow {
  deviceId: string;
  energyTodayKwh: string | null;
  activePowerKw: string | null;
  performanceRatioPct: string | null;
  isOnline: boolean;
  snapshotAt: Date;
}

interface DeviceAgg {
  energyByDay: Map<string, number>;
  latest: SnapshotRow | null;
}

function buildAggregates(rows: SnapshotRow[]): Map<string, DeviceAgg> {
  const byDevice = new Map<string, DeviceAgg>();
  for (const row of rows) {
    const agg = byDevice.get(row.deviceId) ?? {
      energyByDay: new Map<string, number>(),
      latest: null,
    };

    const dayKey = row.snapshotAt.toISOString().slice(0, 10);
    const energyValue = row.energyTodayKwh != null ? parseFloat(row.energyTodayKwh) : 0;
    const existing = agg.energyByDay.get(dayKey) ?? 0;
    if (energyValue > existing) {
      agg.energyByDay.set(dayKey, energyValue);
    }

    if (agg.latest == null || row.snapshotAt > agg.latest.snapshotAt) {
      agg.latest = row;
    }

    byDevice.set(row.deviceId, agg);
  }
  return byDevice;
}

function sumDailyEnergy(agg: DeviceAgg | undefined): number {
  if (agg == null) return 0;
  let sum = 0;
  for (const value of agg.energyByDay.values()) sum += value;
  return sum;
}

export async function getHomeMetricsRaw(range: DateRange): Promise<HomeMetricsRaw> {
  const [snapshots, totalDevicesRow, totalCustomersRow] = await Promise.all([
    db
      .select({
        deviceId: deviceMetricSnapshots.deviceId,
        energyTodayKwh: deviceMetricSnapshots.energyTodayKwh,
        activePowerKw: deviceMetricSnapshots.activePowerKw,
        performanceRatioPct: deviceMetricSnapshots.performanceRatioPct,
        isOnline: deviceMetricSnapshots.isOnline,
        snapshotAt: deviceMetricSnapshots.snapshotAt,
      })
      .from(deviceMetricSnapshots)
      .innerJoin(customerDevices, eq(deviceMetricSnapshots.deviceId, customerDevices.id))
      .where(
        and(
          eq(customerDevices.isEnabled, true),
          sql`${deviceMetricSnapshots.snapshotAt} >= ${range.from.toISOString()}`,
          sql`${deviceMetricSnapshots.snapshotAt} <= ${range.to.toISOString()}`,
        )
      ),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(customerDevices)
      .where(eq(customerDevices.isEnabled, true)),
    db.select({ total: sql<number>`count(*)::int` }).from(customers),
  ]);

  const totalDevices = totalDevicesRow[0]?.total ?? 0;
  const totalCustomers = totalCustomersRow[0]?.total ?? 0;
  const byDevice = buildAggregates(snapshots);

  let energyRangeKwh = 0;
  let activePowerKw = 0;
  let onlineDevices = 0;
  let prSum = 0;
  let prCount = 0;
  let latestSnapshotAt: Date | null = null;

  for (const agg of byDevice.values()) {
    energyRangeKwh += sumDailyEnergy(agg);
    const latest = agg.latest;
    if (latest != null) {
      activePowerKw += latest.activePowerKw != null ? parseFloat(latest.activePowerKw) : 0;
      if (latest.isOnline) onlineDevices += 1;
      if (latest.performanceRatioPct != null) {
        prSum += parseFloat(latest.performanceRatioPct);
        prCount += 1;
      }
      if (latestSnapshotAt == null || latest.snapshotAt > latestSnapshotAt) {
        latestSnapshotAt = latest.snapshotAt;
      }
    }
  }

  return {
    totalCustomers,
    totalDevices,
    onlineDevices,
    snapshotCount: snapshots.length,
    energyRangeKwh,
    activePowerKw,
    co2ReductionKg: energyRangeKwh * CO2_KG_PER_KWH,
    averagePerformanceRatioPct: prCount > 0 ? prSum / prCount : 0,
    latestSnapshotAt,
  };
}

export async function listDevicesWithMetricsInRange(
  range: DateRange
): Promise<DeviceMetricsRow[]> {
  const [deviceRows, snapshots] = await Promise.all([
    db
      .select({
        device: customerDevices,
        customer: customers,
        provider: providers,
      })
      .from(customerDevices)
      .innerJoin(customers, eq(customerDevices.customerId, customers.id))
      .innerJoin(providers, eq(customerDevices.providerId, providers.id))
      .where(eq(customerDevices.isEnabled, true)),
    db
      .select({
        deviceId: deviceMetricSnapshots.deviceId,
        energyTodayKwh: deviceMetricSnapshots.energyTodayKwh,
        activePowerKw: deviceMetricSnapshots.activePowerKw,
        performanceRatioPct: deviceMetricSnapshots.performanceRatioPct,
        isOnline: deviceMetricSnapshots.isOnline,
        snapshotAt: deviceMetricSnapshots.snapshotAt,
      })
      .from(deviceMetricSnapshots)
      .where(
        and(
          sql`${deviceMetricSnapshots.snapshotAt} >= ${range.from.toISOString()}`,
          sql`${deviceMetricSnapshots.snapshotAt} <= ${range.to.toISOString()}`,
        )
      ),
  ]);

  const byDevice = buildAggregates(snapshots);

  return deviceRows.map(({ device, customer, provider }) => {
    const agg = byDevice.get(device.id);
    const latest = agg?.latest ?? null;
    return {
      deviceId: device.id,
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      externalId: device.externalId,
      customerId: customer.id,
      customerName: customer.name,
      providerSlug: provider.slug,
      providerName: provider.displayName,
      isOnline: latest?.isOnline ?? false,
      energyRangeKwh: sumDailyEnergy(agg),
      latestActivePowerKw:
        latest?.activePowerKw != null ? parseFloat(latest.activePowerKw) : null,
      latestPerformanceRatioPct:
        latest?.performanceRatioPct != null ? parseFloat(latest.performanceRatioPct) : null,
      latestSnapshotAt: latest?.snapshotAt ?? null,
    };
  });
}
