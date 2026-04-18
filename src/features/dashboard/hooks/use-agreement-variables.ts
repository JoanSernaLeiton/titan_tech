"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  listVariablesByCustomerAction,
  upsertAgreementVariable,
} from "@/features/dashboard/actions/customer-agreement-variables.action";
import type { InsertCustomerAgreementVariable } from "@/shared/db/customer-agreement-variables.schema";

export function useAgreementVariables(customerId: string) {
  return useQuery({
    queryKey: ["agreement-variables", customerId],
    queryFn: () => listVariablesByCustomerAction(customerId),
    enabled: customerId !== "",
  });
}

export function useUpsertAgreementVariable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertCustomerAgreementVariable) => upsertAgreementVariable(data),
    onSuccess: (result, variables) => {
      if (result.status === "success") {
        toast.success(result.message);
        void queryClient.invalidateQueries({
          queryKey: ["agreement-variables", variables.customerId],
        });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to save agreement variable"
      );
    },
  });
}
