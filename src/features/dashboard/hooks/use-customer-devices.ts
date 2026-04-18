"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createCustomerDevice,
  deleteCustomerDevice,
  listDevicesByCustomerAction,
  updateCustomerDevice,
} from "@/features/dashboard/actions/customer-devices.action";
import type { InsertCustomerDevice } from "@/shared/db/customer-devices.schema";

export function useCustomerDevices(customerId: string) {
  return useQuery({
    queryKey: ["customer-devices", customerId],
    queryFn: () => listDevicesByCustomerAction(customerId),
    enabled: customerId !== "",
  });
}

export function useCreateCustomerDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertCustomerDevice) => createCustomerDevice(data),
    onSuccess: (result, variables) => {
      if (result.status === "success") {
        toast.success(result.message);
        void queryClient.invalidateQueries({
          queryKey: ["customer-devices", variables.customerId],
        });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create device");
    },
  });
}

export function useUpdateCustomerDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      customerId,
      data,
    }: {
      id: string;
      customerId: string;
      data: Partial<InsertCustomerDevice>;
    }) => updateCustomerDevice(id, data).then((result) => ({ result, customerId })),
    onSuccess: (result) => {
      if (result.result.status === "success") {
        toast.success(result.result.message);
        void queryClient.invalidateQueries({
          queryKey: ["customer-devices", result.customerId],
        });
      } else {
        toast.error(result.result.message);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update device");
    },
  });
}

export function useDeleteCustomerDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, customerId }: { id: string; customerId: string }) =>
      deleteCustomerDevice(id).then((result) => ({ result, customerId })),
    onSuccess: (result) => {
      if (result.result.status === "success") {
        toast.success(result.result.message);
        void queryClient.invalidateQueries({
          queryKey: ["customer-devices", result.customerId],
        });
      } else {
        toast.error(result.result.message);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete device");
    },
  });
}
