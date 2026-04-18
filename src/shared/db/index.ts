import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as alerts from "./alerts.schema";
import * as customerAgreementVariables from "./customer-agreement-variables.schema";
import * as customerDevices from "./customer-devices.schema";
import * as customerThresholds from "./customer-thresholds.schema";
import * as customers from "./customers.schema";
import * as deviceMetricSnapshots from "./device-metric-snapshots.schema";
import * as profiles from "./profiles.schema";
import * as providers from "./providers.schema";
import * as reports from "./reports.schema";

const schema = {
  ...profiles,
  ...providers,
  ...customers,
  ...customerDevices,
  ...customerAgreementVariables,
  ...customerThresholds,
  ...alerts,
  ...reports,
  ...deviceMetricSnapshots,
};

type DB = PostgresJsDatabase<typeof schema>;

let _db: DB | null = null;
let _client: ReturnType<typeof postgres> | null = null;

function getDb(): DB {
  if (_db != null) return _db;
  const url = process.env.DATABASE_URL;
  if (url == null || url === "") throw new Error("DATABASE_URL is not set");
  // prepare:false required for Supabase transaction-mode pooler (port 6543).
  // max_lifetime recycles connections before Supabase's 5-min idle timeout kills them.
  _client = postgres(url, {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 1800,
    prepare: false,
  });
  _db = drizzle(_client, { schema });
  return _db;
}

export async function closeDb(): Promise<void> {
  if (_client != null) {
    await _client.end({ timeout: 5 });
    _client = null;
    _db = null;
  }
}

export const db = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    const database = getDb();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return Reflect.get(database, prop, receiver);
  },
});
