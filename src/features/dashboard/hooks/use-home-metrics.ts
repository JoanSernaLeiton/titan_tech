"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getHomeMetricsSummaryAction,
  listDailyEnergyAction,
  listDevicesWithMetricsAction,
  type SerializableDateRange,
} from "@/features/dashboard/actions/home-metrics.action";

export function useHomeMetrics(range: SerializableDateRange) {
  return useQuery({
    queryKey: ["home-metrics", range.from, range.to],
    queryFn: () => getHomeMetricsSummaryAction(range),
    refetchInterval: 3 * 60 * 1000,
  });
}

export function useDevicesWithMetrics(range: SerializableDateRange) {
  return useQuery({
    queryKey: ["home-devices-metrics", range.from, range.to],
    queryFn: () => listDevicesWithMetricsAction(range),
    refetchInterval: 3 * 60 * 1000,
  });
}

export function useDailyEnergy(range: SerializableDateRange) {
  return useQuery({
    queryKey: ["home-daily-energy", range.from, range.to],
    queryFn: () => listDailyEnergyAction(range),
    refetchInterval: 3 * 60 * 1000,
  });
}
