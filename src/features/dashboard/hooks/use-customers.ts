"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createCustomer,
  deleteCustomer,
  getCustomerAction,
  listCustomersAction,
  updateCustomer,
} from "@/features/dashboard/actions/customers.action";
import type { InsertCustomer } from "@/shared/db/customers.schema";

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: () => listCustomersAction(),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => getCustomerAction(id),
    enabled: id !== "",
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertCustomer) => createCustomer(data),
    onSuccess: (result) => {
      if (result.status === "success") {
        toast.success(result.message);
        void queryClient.invalidateQueries({ queryKey: ["customers"] });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create customer");
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertCustomer> }) =>
      updateCustomer(id, data),
    onSuccess: (result) => {
      if (result.status === "success") {
        toast.success(result.message);
        void queryClient.invalidateQueries({ queryKey: ["customers"] });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update customer");
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: (result) => {
      if (result.status === "success") {
        toast.success(result.message);
        void queryClient.invalidateQueries({ queryKey: ["customers"] });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete customer");
    },
  });
}
