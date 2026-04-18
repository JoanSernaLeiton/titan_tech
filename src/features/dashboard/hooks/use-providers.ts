"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createProvider,
  deleteProvider,
  listProvidersAction,
  updateProvider,
} from "@/features/dashboard/actions/providers.action";
import type { InsertProvider } from "@/shared/db/providers.schema";

export function useProviders() {
  return useQuery({
    queryKey: ["providers"],
    queryFn: () => listProvidersAction(),
  });
}

export function useCreateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertProvider) => createProvider(data),
    onSuccess: (result) => {
      if (result.status === "success") {
        toast.success(result.message);
        void queryClient.invalidateQueries({ queryKey: ["providers"] });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create provider");
    },
  });
}

export function useUpdateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertProvider> }) =>
      updateProvider(id, data),
    onSuccess: (result) => {
      if (result.status === "success") {
        toast.success(result.message);
        void queryClient.invalidateQueries({ queryKey: ["providers"] });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update provider");
    },
  });
}

export function useDeleteProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProvider(id),
    onSuccess: (result) => {
      if (result.status === "success") {
        toast.success(result.message);
        void queryClient.invalidateQueries({ queryKey: ["providers"] });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete provider");
    },
  });
}
