import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { providers } from "./providers.schema";

// Type definitions for metric mappings
interface MetricMapping {
  method: "GET" | "POST";
  path: string;
  query_params?: Record<string, string>;
  body?: Record<string, unknown>;
  response_path?: string;
  key_aliases?: string[];
  dataList_path?: string;
  divide_by_path?: string;
  transform?: string;
}

type ProviderMetricMappings = Record<string, MetricMapping>;

const client = postgres(process.env.DATABASE_URL ?? "");
const db = drizzle(client);

// Growatt metric mappings — externalId must be the PLANT_ID (numeric string).
// Real-time metrics come from plant-level endpoints; no per-device real-time API exists
// for generic inverter types (type=1/4). Device status comes from /v1/device/list.
const growattMappings: ProviderMetricMappings = {
  energy_today_kwh: {
    method: "GET",
    path: "/v1/plant/data",
    query_params: { plant_id: "{{external_id}}" },
    response_path: "data.today_energy",
  },
  active_power_kw: {
    method: "GET",
    path: "/v1/plant/data",
    query_params: { plant_id: "{{external_id}}" },
    response_path: "data.current_power",
  },
  energy_month_kwh: {
    method: "GET",
    path: "/v1/plant/data",
    query_params: { plant_id: "{{external_id}}" },
    response_path: "data.monthly_energy",
  },
  device_online: {
    method: "GET",
    path: "/v1/device/list",
    query_params: { plant_id: "{{external_id}}" },
    response_path: "data.devices[0].status",
    transform: "status_to_bool_growatt",
  },
  // Specific yield (kWh/kWp) = today_energy ÷ installed peak capacity.
  // Growatt does not expose a direct PR field; this computes it from plant data.
  performance_ratio_pct: {
    method: "GET",
    path: "/v1/plant/data",
    query_params: { plant_id: "{{external_id}}" },
    response_path: "data.today_energy",
    divide_by_path: "data.peak_power_actual",
  },
};

// Huawei FusionSolar metric mappings
// Real-time (getDevRealKpi): uses devIds (numeric device ID) + devTypeId as number.
// Monthly energy and PR come from KPI history endpoints that require a collectTime (ms).
const huaweiMappings: ProviderMetricMappings = {
  energy_today_kwh: {
    method: "POST",
    path: "/thirdData/getDevRealKpi",
    body: { devIds: "{{external_id}}", devTypeId: 1 },
    response_path: "data[0].dataItemMap.day_cap",
  },
  active_power_kw: {
    method: "POST",
    path: "/thirdData/getDevRealKpi",
    body: { devIds: "{{external_id}}", devTypeId: 1 },
    response_path: "data[0].dataItemMap.active_power",
  },
  temperature_c: {
    method: "POST",
    path: "/thirdData/getDevRealKpi",
    body: { devIds: "{{external_id}}", devTypeId: 1 },
    response_path: "data[0].dataItemMap.temperature",
  },
  ac_frequency_hz: {
    method: "POST",
    path: "/thirdData/getDevRealKpi",
    body: { devIds: "{{external_id}}", devTypeId: 1 },
    response_path: "data[0].dataItemMap.elec_freq",
  },
  ac_voltage_v: {
    method: "POST",
    path: "/thirdData/getDevRealKpi",
    body: { devIds: "{{external_id}}", devTypeId: 1 },
    response_path: "data[0].dataItemMap.a_u",
  },
  // Monthly energy: getDevKpiMonth returns monthly buckets; last entry = current month.
  energy_month_kwh: {
    method: "POST",
    path: "/thirdData/getDevKpiMonth",
    body: { devIds: "{{external_id}}", devTypeId: 1, collectTime: "{{today_ms}}" },
    response_path: "data[-1].dataItemMap.product_power",
  },
  device_online: {
    method: "POST",
    path: "/thirdData/getDevRealKpi",
    body: { devIds: "{{external_id}}", devTypeId: 1 },
    response_path: "data[0].dataItemMap.run_state",
    transform: "status_to_bool_huawei",
  },
  // Specific yield (kWh/kWp) from daily KPI buckets; last entry = today.
  performance_ratio_pct: {
    method: "POST",
    path: "/thirdData/getDevKpiDay",
    body: { devIds: "{{external_id}}", devTypeId: 1, collectTime: "{{today_ms}}" },
    response_path: "data[-1].dataItemMap.perpower_ratio",
  },
};

// DeyeCloud metric mappings — body must use deviceList (array), not deviceSn.
// Metrics live in deviceDataList[0].dataList as [{key, value, unit}] pairs.
const deyeMappings: ProviderMetricMappings = {
  energy_today_kwh: {
    method: "POST",
    path: "/v1.0/device/latest",
    body: { deviceList: ["{{external_id}}"] },
    dataList_path: "deviceDataList[0].dataList",
    key_aliases: ["DailyActiveProduction", "Today's Production", "Daily Energy", "Today Energy", "Daily Production"],
  },
  active_power_kw: {
    method: "POST",
    path: "/v1.0/device/latest",
    body: { deviceList: ["{{external_id}}"] },
    dataList_path: "deviceDataList[0].dataList",
    key_aliases: ["TotalDCInputPower", "DCPowerPV1"],
    transform: "divide_1000",
  },
  temperature_c: {
    method: "POST",
    path: "/v1.0/device/latest",
    body: { deviceList: ["{{external_id}}"] },
    dataList_path: "deviceDataList[0].dataList",
    key_aliases: ["DC Temperature", "AC Temperature", "Temperature- Battery", "Temperature"],
  },
  ac_frequency_hz: {
    method: "POST",
    path: "/v1.0/device/latest",
    body: { deviceList: ["{{external_id}}"] },
    dataList_path: "deviceDataList[0].dataList",
    key_aliases: ["GridFrequency", "ACOutputFrequencyR", "Grid Frequency", "Frequency"],
  },
  ac_voltage_v: {
    method: "POST",
    path: "/v1.0/device/latest",
    body: { deviceList: ["{{external_id}}"] },
    dataList_path: "deviceDataList[0].dataList",
    key_aliases: ["ACVoltageRUA", "AC Voltage L1", "MI Voltage L1", "Voltage L1"],
  },
  energy_month_kwh: {
    method: "POST",
    path: "/v1.0/device/latest",
    body: { deviceList: ["{{external_id}}"] },
    dataList_path: "deviceDataList[0].dataList",
    key_aliases: ["MonthlyActiveProduction", "Monthly Production", "Monthly Energy", "Month Energy"],
  },
  device_online: {
    method: "POST",
    path: "/v1.0/device/latest",
    body: { deviceList: ["{{external_id}}"] },
    response_path: "deviceDataList[0].deviceState",
    transform: "status_to_bool_deye",
  },
};

async function seed() {
  // eslint-disable-next-line no-console
  console.log("Starting database seed...");

  try {
    // Upsert providers
    const providerData = [
      {
        slug: "growatt",
        displayName: "Growatt",
        pollingIntervalMinutes: 3,
        metricMappings: growattMappings,
        isEnabled: true,
      },
      {
        slug: "huawei",
        displayName: "Huawei FusionSolar",
        pollingIntervalMinutes: 3,
        metricMappings: huaweiMappings,
        isEnabled: true,
      },
      {
        slug: "deye",
        displayName: "DeyeCloud",
        pollingIntervalMinutes: 3,
        metricMappings: deyeMappings,
        isEnabled: true,
      },
    ];

    for (const provider of providerData) {
      await db
        .insert(providers)
        .values({
          id: undefined, // Will be generated
          ...provider,
        })
        .onConflictDoUpdate({
          target: providers.slug,
          set: {
            displayName: provider.displayName,
            pollingIntervalMinutes: provider.pollingIntervalMinutes,
            metricMappings: provider.metricMappings,
            isEnabled: provider.isEnabled,
          },
        });

      // eslint-disable-next-line no-console
      console.log(`Seeded provider: ${provider.displayName}`);
    }

    // eslint-disable-next-line no-console
    console.log("Database seed completed successfully!");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Seed error:", error);
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
  }
}

// Run the seed
void seed();
