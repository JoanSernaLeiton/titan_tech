import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { evaluateAlerts } from "@/features/dashboard/lib/alert-evaluator";
import type { MetricMapping } from "@/features/dashboard/lib/metric-mapper";
import { fetchAllMetricsForDevice } from "@/features/dashboard/lib/metric-mapper";
import { getActiveAlertByDeviceAndMetric } from "@/features/dashboard/queries/alerts.queries";
import { getAgreementVariablesByCustomerId } from "@/features/dashboard/queries/customer-agreement-variables.queries";
import { getAllEnabledDevicesWithProvider } from "@/features/dashboard/queries/customer-devices.queries";
import { getThresholdsByCustomerId } from "@/features/dashboard/queries/customer-thresholds.queries";
import { closeDb, db } from "@/shared/db";
import { alerts } from "@/shared/db/alerts.schema";
import { deviceMetricSnapshots } from "@/shared/db/device-metric-snapshots.schema";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret == null || cronSecret === "") {
    // eslint-disable-next-line no-console
    console.error("CRON_SECRET env var is not set — set it in Vercel project settings");
    return NextResponse.json({ error: "Service misconfigured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let polledCount = 0;
  let alertsCreated = 0;

  try {
    const devices = await getAllEnabledDevicesWithProvider();

    const devicesByProvider = new Map<string, typeof devices>();
    for (const device of devices) {
      const slug = device.provider.slug;
      if (!devicesByProvider.has(slug)) {
        devicesByProvider.set(slug, []);
      }
      devicesByProvider.get(slug)?.push(device);
    }

    for (const [providerSlug, providerDevices] of devicesByProvider.entries()) {
      for (const device of providerDevices) {
        try {
          const provider = device.provider;
          const metricMappings = provider.metricMappings as Record<string, MetricMapping>;

          const metrics = await fetchAllMetricsForDevice(
            providerSlug,
            device.externalId,
            metricMappings
          );

          polledCount++;

          // Store each poll as a new row (full history). Energy values of 0 are stored
          // as null — they indicate a transient API gap, not genuine zero production.
          // Queries use DISTINCT ON (device_id) ORDER BY snapshot_at DESC to read the latest.
          await db.insert(deviceMetricSnapshots).values({
            deviceId: device.id,
            customerId: device.customerId,
            energyTodayKwh:
              typeof metrics.energy_today_kwh === "number" && metrics.energy_today_kwh > 0
                ? String(metrics.energy_today_kwh)
                : null,
            energyMonthKwh:
              typeof metrics.energy_month_kwh === "number" && metrics.energy_month_kwh > 0
                ? String(metrics.energy_month_kwh)
                : null,
            activePowerKw:
              typeof metrics.active_power_kw === "number"
                ? String(metrics.active_power_kw)
                : null,
            performanceRatioPct:
              typeof metrics.performance_ratio_pct === "number" && metrics.performance_ratio_pct > 0
                ? String(metrics.performance_ratio_pct)
                : null,
            isOnline: metrics.device_online === true,
            snapshotAt: new Date(),
          });

          const thresholds = await getThresholdsByCustomerId(device.customerId);
          const agreementVariables = await getAgreementVariablesByCustomerId(device.customerId);

          const breaches = evaluateAlerts(metrics, thresholds, agreementVariables);

          for (const breach of breaches) {
            const existing = await getActiveAlertByDeviceAndMetric(device.id, breach.metric);
            if (existing != null) {
              continue;
            }
            await db.insert(alerts).values({
              customerId: device.customerId,
              deviceId: device.id,
              metric: breach.metric,
              triggeredValue: breach.triggeredValue.toString(),
              thresholdValue: breach.thresholdValue.toString(),
              alertType: breach.alertType,
              status: "pending",
            });
            alertsCreated++;
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Error processing device ${device.id}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      polled: polledCount,
      alertsCreated,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        polled: polledCount,
        alertsCreated,
      },
      { status: 500 }
    );
  } finally {
    await closeDb();
  }
}
