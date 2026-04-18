/* eslint-disable no-console */
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { customerDevices } from "./customer-devices.schema";
import { customers } from "./customers.schema";
import { providers } from "./providers.schema";

const client = postgres(process.env.DATABASE_URL ?? "");
const db = drizzle(client);

interface AvailableDevice {
  providerSlug: "growatt" | "huawei" | "deye";
  externalId: string;
  deviceName: string;
}

interface SeedCustomerSpec {
  name: string;
  email: string;
  providerSlug: "growatt" | "huawei" | "deye";
  deviceCount: number;
}

const SEED_CUSTOMERS: SeedCustomerSpec[] = [
  { name: "Solar Quimbaya", email: "solar.quimbaya@demo.co", providerSlug: "growatt", deviceCount: 1 },
  { name: "EDS Anserma", email: "eds.anserma@demo.co", providerSlug: "growatt", deviceCount: 1 },
  { name: "Plaza Campesina Cartago", email: "plaza.cartago@demo.co", providerSlug: "growatt", deviceCount: 1 },
  { name: "Cámara de Comercio Florencia", email: "ccf.florencia@demo.co", providerSlug: "growatt", deviceCount: 1 },
  { name: "Artesanías Barroco", email: "artesanias.cartago@demo.co", providerSlug: "growatt", deviceCount: 1 },
];

async function middlewareCall(
  method: "GET" | "POST",
  url: string,
  body?: unknown
): Promise<unknown> {
  const apiKey = process.env.TINKU_API_KEY ?? "";
  const init: RequestInit = {
    method,
    headers: { Authorization: apiKey, "Content-Type": "application/json" },
  };
  if (method === "POST") {
    init.body = JSON.stringify(body ?? {});
  }
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`HTTP ${String(res.status)} ${res.statusText} for ${url}`);
  }
  return res.json();
}

async function fetchGrowattDevices(baseUrl: string): Promise<AvailableDevice[]> {
  try {
    const json = (await middlewareCall("GET", `${baseUrl}/growatt/v1/plant/list`)) as {
      data?: { plants?: { plant_id?: number; name?: string }[] };
    };
    const plants = json.data?.plants ?? [];
    return plants
      .filter((p) => p.plant_id != null && p.name != null)
      .map((p) => ({
        providerSlug: "growatt" as const,
        externalId: String(p.plant_id),
        deviceName: p.name ?? `Planta ${String(p.plant_id)}`,
      }));
  } catch (err) {
    console.warn("  growatt list failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

async function fetchHuaweiDevices(baseUrl: string): Promise<AvailableDevice[]> {
  try {
    const json = (await middlewareCall(
      "POST",
      `${baseUrl}/huawei/thirdData/getStationList`,
      {}
    )) as {
      data?: unknown;
      success?: boolean;
      failCode?: number;
    };
    if (json.success !== true || !Array.isArray(json.data)) {
      console.warn("  huawei list unavailable:", JSON.stringify(json).slice(0, 200));
      return [];
    }
    const stations = json.data as { stationCode?: string; stationName?: string }[];
    return stations
      .filter((s) => s.stationCode != null && s.stationName != null)
      .map((s) => ({
        providerSlug: "huawei" as const,
        externalId: s.stationCode ?? "",
        deviceName: s.stationName ?? s.stationCode ?? "",
      }));
  } catch (err) {
    console.warn("  huawei list failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

async function fetchDeyeDevices(baseUrl: string): Promise<AvailableDevice[]> {
  try {
    const json = (await middlewareCall("POST", `${baseUrl}/deye/v1.0/device/list`, {
      page: 1,
      size: 100,
    })) as {
      deviceList?: { deviceSn?: string; deviceName?: string }[];
      success?: boolean;
    };
    if (json.success !== true) {
      console.warn("  deye list unavailable:", JSON.stringify(json).slice(0, 200));
      return [];
    }
    const list = json.deviceList ?? [];
    return list
      .filter((d) => d.deviceSn != null)
      .map((d) => ({
        providerSlug: "deye" as const,
        externalId: d.deviceSn ?? "",
        deviceName: d.deviceName ?? d.deviceSn ?? "",
      }));
  } catch (err) {
    console.warn("  deye list failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

async function seed() {
  const baseUrl = process.env.TINKU_BASE_URL ?? "";
  const apiKey = process.env.TINKU_API_KEY ?? "";
  if (baseUrl === "" || apiKey === "") {
    console.error("Missing TINKU_BASE_URL or TINKU_API_KEY");
    process.exit(1);
  }

  try {
    console.log("Fetching available devices from providers...");
    const [growatt, huawei, deye] = await Promise.all([
      fetchGrowattDevices(baseUrl),
      fetchHuaweiDevices(baseUrl),
      fetchDeyeDevices(baseUrl),
    ]);
    console.log(
      `  growatt: ${String(growatt.length)} plants, huawei: ${String(huawei.length)} stations, deye: ${String(deye.length)} devices`
    );

    const providerRows = await db.select().from(providers);
    const providerIdBySlug = new Map(providerRows.map((p) => [p.slug, p.id]));

    const existingDevices = await db
      .select({ providerId: customerDevices.providerId, externalId: customerDevices.externalId })
      .from(customerDevices);
    const takenKeys = new Set(
      existingDevices.map((d) => `${d.providerId}:${d.externalId}`)
    );

    const poolBySlug = new Map<"growatt" | "huawei" | "deye", AvailableDevice[]>([
      ["growatt", growatt],
      ["huawei", huawei],
      ["deye", deye],
    ]);

    let customersCreated = 0;
    let devicesRegistered = 0;

    for (const spec of SEED_CUSTOMERS) {
      const providerId = providerIdBySlug.get(spec.providerSlug);
      if (providerId == null) {
        console.warn(`  skip ${spec.name}: provider ${spec.providerSlug} not in DB`);
        continue;
      }

      const pool = poolBySlug.get(spec.providerSlug) ?? [];
      const available = pool.filter(
        (d) => !takenKeys.has(`${providerId}:${d.externalId}`)
      );
      if (available.length === 0) {
        console.warn(
          `  skip ${spec.name}: no unregistered ${spec.providerSlug} devices available`
        );
        continue;
      }

      const existing = await db
        .select()
        .from(customers)
        .where(eq(customers.email, spec.email));
      let customerId: string;
      if (existing[0] != null) {
        customerId = existing[0].id;
        console.log(`  customer exists: ${spec.email}`);
      } else {
        const [inserted] = await db
          .insert(customers)
          .values({ name: spec.name, email: spec.email })
          .returning();
        if (inserted == null) throw new Error(`Failed to insert ${spec.email}`);
        customerId = inserted.id;
        customersCreated += 1;
        console.log(`  created customer: ${spec.name} <${spec.email}>`);
      }

      const alreadyOwned = await db
        .select({ id: customerDevices.id })
        .from(customerDevices)
        .where(
          and(
            eq(customerDevices.customerId, customerId),
            eq(customerDevices.providerId, providerId)
          )
        );
      const remaining = spec.deviceCount - alreadyOwned.length;
      if (remaining <= 0) {
        console.log(
          `    already has ${String(alreadyOwned.length)} ${spec.providerSlug} device(s); skipping`
        );
        continue;
      }

      const take = Math.min(remaining, available.length);
      for (let i = 0; i < take; i++) {
        const dev = available[i];
        if (dev == null) continue;
        await db.insert(customerDevices).values({
          customerId,
          providerId,
          deviceType: "inverter",
          externalId: dev.externalId,
          deviceName: dev.deviceName,
          isEnabled: true,
        });
        takenKeys.add(`${providerId}:${dev.externalId}`);
        devicesRegistered += 1;
        console.log(`    + device ${dev.externalId} "${dev.deviceName}"`);
      }
    }

    console.log(
      `\nDone: ${String(customersCreated)} new customers, ${String(devicesRegistered)} devices registered.`
    );
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

void seed();
