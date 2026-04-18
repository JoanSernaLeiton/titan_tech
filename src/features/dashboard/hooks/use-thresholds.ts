"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  listThresholdsByCustomerAction,
  upsertThreshold,
} from "@/features/dashboard/actions/customer-thresholds.action";
import type { InsertCustomerThreshold } from "@/shared/db/customer-thresholds.schema";

export function useThresholds(customerId: string) {
  return useQuery({
    queryKey: ["thresholds", customerId],
    queryFn: () => listThresholdsByCustomerAction(customerId),
    enabled: customerId !== "",
  });
}

export function useUpsertThreshold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertCustomerThreshold) => upsertThreshold(data),
    onSuccess: (result, variables) => {
      if (result.status === "success") {
        toast.success(result.message);
        void queryClient.invalidateQueries({
          queryKey: ["thresholds", variables.customerId],
        });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save threshold");
    },
  });
}
