"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  listAlertsAction,
  updateAlertStatus,
} from "@/features/dashboard/actions/alerts.action";

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: () => listAlertsAction(),
  });
}

export function useUpdateAlertStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "pending" | "under_review" | "resolved";
    }) => updateAlertStatus(id, status),
    onSuccess: (result) => {
      if (result.status === "success") {
        toast.success(result.message);
        void queryClient.invalidateQueries({ queryKey: ["alerts"] });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update alert status");
    },
  });
}
