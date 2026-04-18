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
  performanceRatioPct: string | null;
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

function startOfMonthUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}

function startOfTodayUtc(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
  );
}

interface SnapshotBucket {
  deviceType: "inverter" | "micro_inverter";
  providerSlug: string;
  latest: {
    energyTodayKwh: string | null;
    energyMonthKwh: string | null;
    activePowerKw: string | null;
    performanceRatioPct: string | null;
    isOnline: boolean;
    snapshotAt: Date;
  } | null;
  energyTodayPeak: number; // peak of energyTodayKwh among today's snapshots
  energyMonthByDay: Map<string, number>; // YYYY-MM-DD → peak energyTodayKwh that day
}

export async function getCustomerMetricsRaw(
  customerId: string,
  filters?: { deviceType?: "inverter" | "micro_inverter"; providerSlug?: string }
): Promise<CustomerMetricsRaw> {
  const now = new Date();
  const monthStart = startOfMonthUtc(now);
  const todayStart = startOfTodayUtc(now);

  const conditions = [
    eq(deviceMetricSnapshots.customerId, customerId),
    eq(customerDevices.isEnabled, true),
    sql`${deviceMetricSnapshots.snapshotAt} >= ${monthStart.toISOString()}`,
  ];

  if (filters?.deviceType != null) {
    conditions.push(eq(customerDevices.deviceType, filters.deviceType));
  }
  if (filters?.providerSlug != null) {
    conditions.push(eq(providers.slug, filters.providerSlug));
  }

  const snapshots = await db
    .select({
      deviceId: deviceMetricSnapshots.deviceId,
      deviceType: customerDevices.deviceType,
      providerSlug: providers.slug,
      energyTodayKwh: deviceMetricSnapshots.energyTodayKwh,
      energyMonthKwh: deviceMetricSnapshots.energyMonthKwh,
      activePowerKw: deviceMetricSnapshots.activePowerKw,
      performanceRatioPct: deviceMetricSnapshots.performanceRatioPct,
      isOnline: deviceMetricSnapshots.isOnline,
      snapshotAt: deviceMetricSnapshots.snapshotAt,
    })
    .from(deviceMetricSnapshots)
    .innerJoin(customerDevices, eq(deviceMetricSnapshots.deviceId, customerDevices.id))
    .innerJoin(providers, eq(customerDevices.providerId, providers.id))
    .where(and(...conditions));

  const byDevice = new Map<string, SnapshotBucket>();
  for (const s of snapshots) {
    const bucket = byDevice.get(s.deviceId) ?? {
      deviceType: s.deviceType,
      providerSlug: s.providerSlug,
      latest: null,
      energyTodayPeak: 0,
      energyMonthByDay: new Map<string, number>(),
    };

    // Track peak energy-today for each calendar day (per-day peak = energy generated that day,
    // since energyTodayKwh is a daily-reset counter).
    const dayKey = s.snapshotAt.toISOString().slice(0, 10);
    const energyVal = s.energyTodayKwh != null ? parseFloat(s.energyTodayKwh) : 0;
    const priorDayPeak = bucket.energyMonthByDay.get(dayKey) ?? 0;
    if (energyVal > priorDayPeak) bucket.energyMonthByDay.set(dayKey, energyVal);

    // Today's peak (for "Energía ahorrada (Hoy)")
    if (s.snapshotAt >= todayStart && energyVal > bucket.energyTodayPeak) {
      bucket.energyTodayPeak = energyVal;
    }

    // Latest snapshot (for isOnline, activePower, PR, timestamp)
    if (bucket.latest == null || s.snapshotAt > bucket.latest.snapshotAt) {
      bucket.latest = {
        energyTodayKwh: s.energyTodayKwh,
        energyMonthKwh: s.energyMonthKwh,
        activePowerKw: s.activePowerKw,
        performanceRatioPct: s.performanceRatioPct,
        isOnline: s.isOnline,
        snapshotAt: s.snapshotAt,
      };
    }

    byDevice.set(s.deviceId, bucket);
  }

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(customerDevices)
    .innerJoin(providers, eq(customerDevices.providerId, providers.id))
    .where(
      and(
        eq(customerDevices.customerId, customerId),
        eq(customerDevices.isEnabled, true),
        ...(filters?.deviceType != null
          ? [eq(customerDevices.deviceType, filters.deviceType)]
          : []),
        ...(filters?.providerSlug != null
          ? [eq(providers.slug, filters.providerSlug)]
          : [])
      )
    );

  const totalDevices = countRow?.total ?? 0;

  let onlineDevices = 0;
  let energyTodayKwhSum = 0;
  let energyMonthKwhSum = 0;
  let activePowerKwSum = 0;
  let latestSnapshotAt: Date | null = null;
  const rows: DeviceMetricRow[] = [];

  for (const [deviceId, bucket] of byDevice) {
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
      rows.push({
        deviceId,
        deviceType: bucket.deviceType,
        providerSlug: bucket.providerSlug,
        energyTodayKwh: latest.energyTodayKwh,
        energyMonthKwh: latest.energyMonthKwh,
        activePowerKw: latest.activePowerKw,
        performanceRatioPct: latest.performanceRatioPct,
        isOnline: latest.isOnline,
        snapshotAt: latest.snapshotAt,
      });
    }
  }

  return {
    totalDevices,
    onlineDevices,
    energyTodayKwhSum,
    energyMonthKwhSum,
    activePowerKwSum,
    latestSnapshotAt,
    rows,
  };
}
