"use client";

import { useQuery } from "@tanstack/react-query";

import { getGlobalMetricsSummaryAction } from "@/features/dashboard/actions/global-metrics.action";

export function useGlobalMetrics() {
  return useQuery({
    queryKey: ["global-metrics"],
    queryFn: () => getGlobalMetricsSummaryAction(),
    refetchInterval: 3 * 60 * 1000,
  });
}
