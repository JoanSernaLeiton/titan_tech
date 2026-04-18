import { describe, it, expect, vi, beforeEach } from "vitest";

import * as metricMapper from "@/features/dashboard/lib/metric-mapper";

vi.mock("@/features/dashboard/lib/middleware-api", () => ({
  middlewareRequest: vi.fn(),
}));

const { middlewareRequest } = await import("@/features/dashboard/lib/middleware-api");

describe("metric-mapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("substituteTemplate", () => {
    it("replaces {{external_id}} in string", async () => {
      vi.mocked(middlewareRequest).mockResolvedValue({ status: "ok" });

      await metricMapper.fetchMetricForDevice("growatt", "device123", "status", {
        path: "/v1/device/status",
        method: "GET",
        query_params: { device_id: "{{external_id}}" },
      });

      expect(vi.mocked(middlewareRequest)).toHaveBeenCalledWith(
        "growatt",
        "/v1/device/status",
        expect.objectContaining({
          queryParams: { device_id: "device123" },
        })
      );
    });

    it("replaces {{external_id}} in body", async () => {
      vi.mocked(middlewareRequest).mockResolvedValue({ result: 100 });

      await metricMapper.fetchMetricForDevice("deye", "dev456", "energy", {
        path: "/v1.0/device/list",
        method: "POST",
        body: { device_sn: "{{external_id}}" },
      });

      expect(vi.mocked(middlewareRequest)).toHaveBeenCalledWith(
        "deye",
        "/v1.0/device/list",
        expect.objectContaining({
          body: { device_sn: "dev456" },
        })
      );
    });

    it("replaces {{external_id}} in nested structures", async () => {
      vi.mocked(middlewareRequest).mockResolvedValue({ data: { id: "dev789" } });

      await metricMapper.fetchMetricForDevice("huawei", "dev789", "metric", {
        path: "/api/endpoint",
        method: "POST",
        body: {
          params: {
            device: "{{external_id}}",
            nested: {
              id: "{{external_id}}",
            },
          },
        },
      });

      expect(vi.mocked(middlewareRequest)).toHaveBeenCalledWith(
        "huawei",
        "/api/endpoint",
        expect.objectContaining({
          body: {
            params: {
              device: "dev789",
              nested: {
                id: "dev789",
              },
            },
          },
        })
      );
    });
  });

  describe("extractByPath", () => {
    it("extracts simple nested path", async () => {
      vi.mocked(middlewareRequest).mockResolvedValue({
        data: {
          value: 42,
        },
      });

      const result = await metricMapper.fetchMetricForDevice("provider", "device1", "test", {
        path: "/endpoint",
        method: "GET",
        response_path: "data.value",
      });

      expect(result).toBe(42);
    });

    it("extracts array indexed path", async () => {
      vi.mocked(middlewareRequest).mockResolvedValue({
        data: [{ dataItemMap: { day_cap: 123.456 } }],
      });

      const result = await metricMapper.fetchMetricForDevice("provider", "device1", "test", {
        path: "/endpoint",
        method: "GET",
        response_path: "data[0].dataItemMap.day_cap",
      });

      expect(result).toBe(123.456);
    });

    it("returns null for missing path", async () => {
      vi.mocked(middlewareRequest).mockResolvedValue({
        data: { some: "value" },
      });

      const result = await metricMapper.fetchMetricForDevice("provider", "device1", "test", {
        path: "/endpoint",
        method: "GET",
        response_path: "data.missing.path",
      });

      expect(result).toBeNull();
    });
  });

  describe("extractByAliases", () => {
    it("returns first matching alias", async () => {
      vi.mocked(middlewareRequest).mockResolvedValue({
        day_cap: 500,
        dayCapacity: 400,
      });

      const result = await metricMapper.fetchMetricForDevice("provider", "device1", "test", {
        path: "/endpoint",
        method: "GET",
        key_aliases: ["dayCapacity", "day_cap"],
      });

      expect(result).toBe(500);
    });

    it("tries aliases in order", async () => {
      vi.mocked(middlewareRequest).mockResolvedValue({
        energy_today: 250,
      });

      const result = await metricMapper.fetchMetricForDevice("provider", "device1", "test", {
        path: "/endpoint",
        method: "GET",
        key_aliases: ["missing1", "missing2", "energy_today"],
      });

      expect(result).toBe(250);
    });

    it("returns null if no alias matches", async () => {
      vi.mocked(middlewareRequest).mockResolvedValue({
        some: "value",
      });

      const result = await metricMapper.fetchMetricForDevice("provider", "device1", "test", {
        path: "/endpoint",
        method: "GET",
        key_aliases: ["missing1", "missing2"],
      });

      expect(result).toBeNull();
    });
  });

  describe("applyTransform", () => {
    it("transforms divide_1000", async () => {
      vi.mocked(middlewareRequest).mockResolvedValue({
        value: 1500,
      });

      const result = await metricMapper.fetchMetricForDevice("provider", "device1", "test", {
        path: "/endpoint",
        method: "GET",
        response_path: "value",
        transform: "divide_1000",
      });

      expect(result).toBe(1.5);
    });

    it("transforms status_to_bool_growatt", async () => {
      vi.mocked(middlewareRequest).mockResolvedValue({ status: 1 });
      let result = await metricMapper.fetchMetricForDevice("growatt", "device1", "test", {
        path: "/endpoint",
        method: "GET",
        response_path: "status",
        transform: "status_to_bool_growatt",
      });
      expect(result).toBe(true);

      vi.mocked(middlewareRequest).mockResolvedValue({ status: 0 });
      result = await metricMapper.fetchMetricForDevice("growatt", "device1", "test", {
        path: "/endpoint",
        method: "GET",
        response_path: "status",
        transform: "status_to_bool_growatt",
      });
      expect(result).toBe(false);
    });

    it("transforms status_to_bool_huawei", async () => {
      vi.mocked(middlewareRequest).mockResolvedValue({ status: "1" });
      let result = await metricMapper.fetchMetricForDevice("huawei", "device1", "test", {
        path: "/endpoint",
        method: "GET",
        response_path: "status",
        transform: "status_to_bool_huawei",
      });
      expect(result).toBe(true);

      vi.mocked(middlewareRequest).mockResolvedValue({ status: "0" });
      result = await metricMapper.fetchMetricForDevice("huawei", "device1", "test", {
        path: "/endpoint",
        method: "GET",
        response_path: "status",
        transform: "status_to_bool_huawei",
      });
      expect(result).toBe(false);
    });

    it("transforms status_to_bool_deye", async () => {
      vi.mocked(middlewareRequest).mockResolvedValue({ online: 1 });
      let result = await metricMapper.fetchMetricForDevice("deye", "device1", "test", {
        path: "/endpoint",
        method: "GET",
        response_path: "online",
        transform: "status_to_bool_deye",
      });
      expect(result).toBe(true);

      vi.mocked(middlewareRequest).mockResolvedValue({ online: 0 });
      result = await metricMapper.fetchMetricForDevice("deye", "device1", "test", {
        path: "/endpoint",
        method: "GET",
        response_path: "online",
        transform: "status_to_bool_deye",
      });
      expect(result).toBe(false);
    });
  });

  describe("fetchAllMetricsForDevice", () => {
    it("fetches all metrics in parallel", async () => {
      vi.mocked(middlewareRequest).mockResolvedValue({ value: 100 });

      const mappings = {
        metric1: { path: "/endpoint1", method: "GET" as const },
        metric2: { path: "/endpoint2", method: "GET" as const },
        metric3: { path: "/endpoint3", method: "GET" as const },
      };

      await metricMapper.fetchAllMetricsForDevice("provider", "device1", mappings);

      expect(vi.mocked(middlewareRequest)).toHaveBeenCalledTimes(3);
    });
  });
});
