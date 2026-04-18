import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/shared/db";
import { customerDevices } from "@/shared/db/customer-devices.schema";
import { customers } from "@/shared/db/customers.schema";
import { deviceMetricSnapshots } from "@/shared/db/device-metric-snapshots.schema";
import { providers } from "@/shared/db/providers.schema";

export interface GlobalMetricsRaw {
  totalCustomers: number;
  totalDevices: number;
  onlineDevices: number;
  snapshotCount: number;
  energyTodayKwhSum: number;
  energyMonthKwhSum: number;
  activePowerKwSum: number;
  co2ReductionKg: number;
  latestSnapshotAt: Date | null;
}

const DEFAULT_CO2_KG_PER_KWH = 0.126;

export async function getGlobalMetricsRaw(): Promise<GlobalMetricsRaw> {
  const [snapshotRows, totalDevicesRow, totalCustomersRow] = await Promise.all([
    db
      .select({
        energyTodayKwh: deviceMetricSnapshots.energyTodayKwh,
        energyMonthKwh: deviceMetricSnapshots.energyMonthKwh,
        activePowerKw: deviceMetricSnapshots.activePowerKw,
        isOnline: deviceMetricSnapshots.isOnline,
        snapshotAt: deviceMetricSnapshots.snapshotAt,
      })
      .from(deviceMetricSnapshots)
      .innerJoin(customerDevices, eq(deviceMetricSnapshots.deviceId, customerDevices.id))
      .innerJoin(providers, eq(customerDevices.providerId, providers.id))
      .where(and(eq(customerDevices.isEnabled, true))),

    db
      .select({ total: sql<number>`count(*)::int` })
      .from(customerDevices)
      .where(eq(customerDevices.isEnabled, true)),

    db
      .select({ total: sql<number>`count(*)::int` })
      .from(customers),
  ]);

  const totalDevices = totalDevicesRow[0]?.total ?? 0;
  const totalCustomers = totalCustomersRow[0]?.total ?? 0;
  const onlineDevices = snapshotRows.filter((r) => r.isOnline).length;
  const energyTodayKwhSum = snapshotRows.reduce(
    (acc, r) => acc + (r.energyTodayKwh != null ? parseFloat(r.energyTodayKwh) : 0),
    0
  );
  const energyMonthKwhSum = snapshotRows.reduce(
    (acc, r) => acc + (r.energyMonthKwh != null ? parseFloat(r.energyMonthKwh) : 0),
    0
  );
  const activePowerKwSum = snapshotRows.reduce(
    (acc, r) => acc + (r.activePowerKw != null ? parseFloat(r.activePowerKw) : 0),
    0
  );
  const latestSnapshotAt = snapshotRows.reduce<Date | null>((latest, r) => {
    if (latest == null) return r.snapshotAt;
    return r.snapshotAt > latest ? r.snapshotAt : latest;
  }, null);

  return {
    totalCustomers,
    totalDevices,
    onlineDevices,
    snapshotCount: snapshotRows.length,
    energyTodayKwhSum,
    energyMonthKwhSum,
    activePowerKwSum,
    co2ReductionKg: energyTodayKwhSum * DEFAULT_CO2_KG_PER_KWH,
    latestSnapshotAt,
  };
}
