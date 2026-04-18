import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/shared/db";
import { customerDevices } from "@/shared/db/customer-devices.schema";
import { deviceMetricSnapshots } from "@/shared/db/device-metric-snapshots.schema";
import { providers } from "@/shared/db/providers.schema";

export interface DeviceMetricRow {
  deviceId: string;
  deviceType: "inverter" | "micro_inverter";
  providerSlug: string;
  energyTodayKwh: string | null;
  energyMonthKwh: string | null;
  activePowerKw: string | null;
  isOnline: boolean;
  snapshotAt: Date;
}

export interface CustomerMetricsRaw {
  totalDevices: number;
  onlineDevices: number;
  energyTodayKwhSum: number;
  energyMonthKwhSum: number;
  activePowerKwSum: number;
  latestSnapshotAt: Date | null;
  rows: DeviceMetricRow[];
}

export async function getCustomerMetricsRaw(
  customerId: string,
  filters?: { deviceType?: "inverter" | "micro_inverter"; providerSlug?: string }
): Promise<CustomerMetricsRaw> {
  const conditions = [
    eq(deviceMetricSnapshots.customerId, customerId),
    eq(customerDevices.isEnabled, true),
  ];

  if (filters?.deviceType != null) {
    conditions.push(eq(customerDevices.deviceType, filters.deviceType));
  }
  if (filters?.providerSlug != null) {
    conditions.push(eq(providers.slug, filters.providerSlug));
  }

  const rows = await db
    .select({
      deviceId: deviceMetricSnapshots.deviceId,
      deviceType: customerDevices.deviceType,
      providerSlug: providers.slug,
      energyTodayKwh: deviceMetricSnapshots.energyTodayKwh,
      energyMonthKwh: deviceMetricSnapshots.energyMonthKwh,
      activePowerKw: deviceMetricSnapshots.activePowerKw,
      isOnline: deviceMetricSnapshots.isOnline,
      snapshotAt: deviceMetricSnapshots.snapshotAt,
    })
    .from(deviceMetricSnapshots)
    .innerJoin(customerDevices, eq(deviceMetricSnapshots.deviceId, customerDevices.id))
    .innerJoin(providers, eq(customerDevices.providerId, providers.id))
    .where(and(...conditions));

  // Also count total enabled devices for this customer (even those not yet polled)
  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(customerDevices)
    .innerJoin(providers, eq(customerDevices.providerId, providers.id))
    .where(
      and(
        eq(customerDevices.customerId, customerId),
        eq(customerDevices.isEnabled, true),
        ...(filters?.deviceType != null ? [eq(customerDevices.deviceType, filters.deviceType)] : []),
        ...(filters?.providerSlug != null ? [eq(providers.slug, filters.providerSlug)] : [])
      )
    );

  const totalDevices = countRow?.total ?? 0;
  const onlineDevices = rows.filter((r) => r.isOnline).length;
  const energyTodayKwhSum = rows.reduce((acc, r) => acc + (r.energyTodayKwh != null ? parseFloat(r.energyTodayKwh) : 0), 0);
  const energyMonthKwhSum = rows.reduce((acc, r) => acc + (r.energyMonthKwh != null ? parseFloat(r.energyMonthKwh) : 0), 0);
  const activePowerKwSum = rows.reduce((acc, r) => acc + (r.activePowerKw != null ? parseFloat(r.activePowerKw) : 0), 0);
  const latestSnapshotAt = rows.reduce<Date | null>((latest, r) => {
    if (latest == null) return r.snapshotAt;
    return r.snapshotAt > latest ? r.snapshotAt : latest;
  }, null);

  return {
    totalDevices,
    onlineDevices,
    energyTodayKwhSum,
    energyMonthKwhSum,
    activePowerKwSum,
    latestSnapshotAt,
    rows: rows as DeviceMetricRow[],
  };
}
