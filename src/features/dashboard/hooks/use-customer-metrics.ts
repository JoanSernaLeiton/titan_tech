"use client";

import { useQuery } from "@tanstack/react-query";

import { getCustomerMetricsSummaryAction } from "@/features/dashboard/actions/customer-metrics.action";

const THREE_MINUTES_MS = 3 * 60 * 1000;

export function useCustomerMetrics(
  customerId: string,
  filters?: { deviceType?: "inverter" | "micro_inverter"; providerSlug?: string }
) {
  return useQuery({
    queryKey: ["customer-metrics", customerId, filters],
    queryFn: () => getCustomerMetricsSummaryAction(customerId, filters),
    enabled: customerId !== "",
    refetchInterval: THREE_MINUTES_MS,
  });
}
