import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/shared/db";
import { customerDevices } from "@/shared/db/customer-devices.schema";
import { customers } from "@/shared/db/customers.schema";
import { deviceMetricSnapshots } from "@/shared/db/device-metric-snapshots.schema";

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

const DEFAULT_CO2_KG_PER_KWH = 0.16438; // Colombia SIN 2026: 164.38 gCO₂eq/kWh

function startOfMonthUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

function startOfTodayUtc(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
  );
}

interface SnapshotBucket {
  latest: {
    activePowerKw: string | null;
    isOnline: boolean;
    snapshotAt: Date;
  } | null;
  energyTodayPeak: number;
  energyMonthByDay: Map<string, number>;
}

export async function getGlobalMetricsRaw(): Promise<GlobalMetricsRaw> {
  const now = new Date();
  const monthStart = startOfMonthUtc(now);
  const todayStart = startOfTodayUtc(now);

  const [snapshotRows, totalDevicesRow, totalCustomersRow] = await Promise.all([
    db
      .select({
        deviceId: deviceMetricSnapshots.deviceId,
        energyTodayKwh: deviceMetricSnapshots.energyTodayKwh,
        activePowerKw: deviceMetricSnapshots.activePowerKw,
        isOnline: deviceMetricSnapshots.isOnline,
        snapshotAt: deviceMetricSnapshots.snapshotAt,
      })
      .from(deviceMetricSnapshots)
      .innerJoin(customerDevices, eq(deviceMetricSnapshots.deviceId, customerDevices.id))
      .where(
        and(
          eq(customerDevices.isEnabled, true),
          sql`${deviceMetricSnapshots.snapshotAt} >= ${monthStart.toISOString()}`,
        )
      ),

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

  const byDevice = new Map<string, SnapshotBucket>();
  for (const s of snapshotRows) {
    const bucket = byDevice.get(s.deviceId) ?? {
      latest: null,
      energyTodayPeak: 0,
      energyMonthByDay: new Map<string, number>(),
    };

    const dayKey = s.snapshotAt.toISOString().slice(0, 10);
    const energyVal = s.energyTodayKwh != null ? parseFloat(s.energyTodayKwh) : 0;
    const priorDayPeak = bucket.energyMonthByDay.get(dayKey) ?? 0;
    if (energyVal > priorDayPeak) bucket.energyMonthByDay.set(dayKey, energyVal);

    if (s.snapshotAt >= todayStart && energyVal > bucket.energyTodayPeak) {
      bucket.energyTodayPeak = energyVal;
    }

    if (bucket.latest == null || s.snapshotAt > bucket.latest.snapshotAt) {
      bucket.latest = {
        activePowerKw: s.activePowerKw,
        isOnline: s.isOnline,
        snapshotAt: s.snapshotAt,
      };
    }

    byDevice.set(s.deviceId, bucket);
  }

  let onlineDevices = 0;
  let energyTodayKwhSum = 0;
  let energyMonthKwhSum = 0;
  let activePowerKwSum = 0;
  let latestSnapshotAt: Date | null = null;

  for (const bucket of byDevice.values()) {
    energyTodayKwhSum += bucket.energyTodayPeak;
    for (const dayPeak of bucket.energyMonthByDay.values()) {
      energyMonthKwhSum += dayPeak;
    }

    const latest = bucket.latest;
    if (latest != null) {
      if (latest.isOnline) onlineDevices += 1;
      if (latest.activePowerKw != null) {
        activePowerKwSum += parseFloat(latest.activePowerKw);
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
    snapshotCount: snapshotRows.length,
    energyTodayKwhSum,
    energyMonthKwhSum,
    activePowerKwSum,
    co2ReductionKg: energyMonthKwhSum * DEFAULT_CO2_KG_PER_KWH,
    latestSnapshotAt,
  };
}
