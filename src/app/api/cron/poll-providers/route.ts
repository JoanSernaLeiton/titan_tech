import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { evaluateAlerts } from "@/features/dashboard/lib/alert-evaluator";
import type { MetricMapping } from "@/features/dashboard/lib/metric-mapper";
import { fetchAllMetricsForDevice } from "@/features/dashboard/lib/metric-mapper";
import { getAgreementVariablesByCustomerId } from "@/features/dashboard/queries/customer-agreement-variables.queries";
import { getAllEnabledDevicesWithProvider } from "@/features/dashboard/queries/customer-devices.queries";
import { getThresholdsByCustomerId } from "@/features/dashboard/queries/customer-thresholds.queries";
import { db } from "@/shared/db";
import { alerts } from "@/shared/db/alerts.schema";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET ?? ""}`) {
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

          const thresholds = await getThresholdsByCustomerId(device.customerId);
          const agreementVariables = await getAgreementVariablesByCustomerId(device.customerId);

          const breaches = evaluateAlerts(metrics, thresholds, agreementVariables);

          for (const breach of breaches) {
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
  }
}
