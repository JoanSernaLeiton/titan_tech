import { middlewareRequest } from "./middleware-api";

export interface MetricMapping {
  path: string;
  method: "GET" | "POST";
  query_params?: Record<string, string>;
  body?: Record<string, unknown>;
  response_path?: string;
  key_aliases?: string[];
  // Navigate to an array at this path, then search for {key, value} pairs where key ∈ key_aliases.
  // Used for Deye's deviceDataList[0].dataList structure.
  dataList_path?: string;
  // Divide the value at response_path by the value at this path in the same response.
  // Used for computing specific yield (kWh/kWp) = today_energy / peak_power_kw.
  divide_by_path?: string;
  transform?: "divide_1000" | "status_to_bool_growatt" | "status_to_bool_huawei" | "status_to_bool_deye";
}

function substituteTemplate(template: unknown, externalId: string): unknown {
  if (typeof template === "string") {
    return template
      .replace(/\{\{external_id\}\}/g, externalId)
      .replace(/\{\{today_ms\}\}/g, Date.now().toString());
  }
  if (typeof template === "object" && template !== null) {
    if (Array.isArray(template)) {
      return template.map((item) => substituteTemplate(item, externalId));
    }
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(template)) {
      result[key] = substituteTemplate(value, externalId);
    }
    return result;
  }
  return template;
}

function extractByPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    const arrayMatch = /^(\w+)\[(-?\d+)\]$/.exec(part);

    if (arrayMatch != null && arrayMatch.length >= 3) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const key = arrayMatch[1]!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const index = arrayMatch[2]!;
      if (typeof current === "object" && current !== null && key in current) {
        const arr = (current as Record<string, unknown>)[key];
        if (Array.isArray(arr)) {
          const idx = parseInt(index);
          current = arr[idx < 0 ? arr.length + idx : idx];
        } else {
          return undefined;
        }
      } else {
        return undefined;
      }
    } else {
      if (typeof current === "object" && current !== null && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
  }

  return current;
}

function extractByAliases(obj: unknown, aliases: string[]): unknown {
  if (typeof obj !== "object" || obj === null) {
    return undefined;
  }

  const aliasSet = new Set(aliases);
  for (const key in obj) {
    if (aliasSet.has(key)) {
      return (obj as Record<string, unknown>)[key];
    }
  }

  return undefined;
}

function extractFromDataList(response: unknown, dataListPath: string, aliases: string[]): unknown {
  const list = extractByPath(response, dataListPath);
  if (!Array.isArray(list)) return undefined;

  const aliasSet = new Set(aliases);
  for (const item of list) {
    if (typeof item === "object" && item !== null && "key" in item && "value" in item) {
      const entry = item as { key: unknown; value: unknown };
      if (typeof entry.key === "string" && aliasSet.has(entry.key)) {
        const num = parseFloat(entry.value as string);
        return isNaN(num) ? entry.value : num;
      }
    }
  }

  return undefined;
}

function applyTransform(value: unknown, transform: string): unknown {
  if (transform === "divide_1000") {
    if (typeof value === "number") {
      return value / 1000;
    }
    if (typeof value === "string") {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return num / 1000;
      }
    }
    return null;
  }

  if (transform === "status_to_bool_growatt") {
    // 0=Standby (nighttime, device reachable), 1=Normal; ≥2 means fault/disconnected
    if (value === 1 || value === "1") return true;
    if (value === 0 || value === "0") return true;
    const n = typeof value === "string" ? parseInt(value, 10) : typeof value === "number" ? value : NaN;
    if (!isNaN(n)) return n >= 2 ? false : true;
    return null;
  }

  if (transform === "status_to_bool_huawei") {
    if (value === 1 || value === "1") return true;
    if (value === 0 || value === "0") return false;
    return null;
  }

  if (transform === "status_to_bool_deye") {
    if (value === 1 || value === "1") return true;
    if (value === 0 || value === "0") return false;
    return null;
  }

  return value;
}

export async function fetchMetricForDevice(
  providerSlug: string,
  externalId: string,
  metricName: string,
  mapping: MetricMapping
): Promise<number | boolean | null> {
  try {
    let queryParams: Record<string, string> | undefined = mapping.query_params;
    if (queryParams != null) {
      queryParams = substituteTemplate(queryParams, externalId) as Record<string, string>;
    }

    let body: Record<string, unknown> | undefined = mapping.body;
    if (body != null) {
      body = substituteTemplate(body, externalId) as Record<string, unknown>;
    }

    const response = await middlewareRequest(providerSlug, mapping.path, {
      method: mapping.method,
      ...(queryParams != null && { queryParams }),
      ...(body != null && { body }),
    });

    let value: unknown = response;

    if (mapping.dataList_path != null && mapping.key_aliases != null) {
      value = extractFromDataList(response, mapping.dataList_path, mapping.key_aliases);
    } else if (mapping.response_path != null) {
      value = extractByPath(response, mapping.response_path);
    } else if (mapping.key_aliases != null) {
      value = extractByAliases(response, mapping.key_aliases);
    }

    if (value === null || value === undefined) {
      return null;
    }

    if (mapping.divide_by_path != null) {
      const denominator = extractByPath(response, mapping.divide_by_path);
      const num = typeof value === "number" ? value : parseFloat(value as string);
      const den = typeof denominator === "number" ? denominator : parseFloat(denominator as string);
      if (isNaN(num) || isNaN(den) || den === 0) return null;
      return num / den;
    }

    if (mapping.transform != null) {
      value = applyTransform(value, mapping.transform);
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      const num = parseFloat(value);
      if (!isNaN(num)) return num;
    }

    return null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to fetch metric ${metricName} for device ${externalId}:`, error);
    return null;
  }
}

export async function fetchAllMetricsForDevice(
  providerSlug: string,
  externalId: string,
  metricMappings: Record<string, MetricMapping>
): Promise<Record<string, number | boolean | null>> {
  const results: Record<string, number | boolean | null> = {};

  const promises = Object.entries(metricMappings).map(async ([metricName, mapping]) => {
    const value = await fetchMetricForDevice(providerSlug, externalId, metricName, mapping);
    results[metricName] = value;
  });

  await Promise.all(promises);

  return results;
}
