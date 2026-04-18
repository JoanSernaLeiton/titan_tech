"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import { CustomerDetail } from "@/features/dashboard/components/customers/CustomerDetail";
import { useAgreementVariables } from "@/features/dashboard/hooks/use-agreement-variables";
import { useCustomerDevices } from "@/features/dashboard/hooks/use-customer-devices";
import {
  useCreateCustomerDevice,
  useDeleteCustomerDevice,
  useUpdateCustomerDevice,
} from "@/features/dashboard/hooks/use-customer-devices";
import { useCustomer } from "@/features/dashboard/hooks/use-customers";
import { useProviders } from "@/features/dashboard/hooks/use-providers";
import { useThresholds } from "@/features/dashboard/hooks/use-thresholds";
import type { InsertCustomerDevice, SelectCustomerDevice } from "@/shared/db/customer-devices.schema";
import type { SelectProvider } from "@/shared/db/providers.schema";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const router = useRouter();
  const { id: customerId } = use(params);

  const { data: customer } = useCustomer(customerId);
  const { data: devices = [] } = useCustomerDevices(customerId);
  const { data: variables = [] } = useAgreementVariables(customerId);
  const { data: thresholds = [] } = useThresholds(customerId);
  const { data: providers = [] } = useProviders();
  const createDeviceMutation = useCreateCustomerDevice();
  const updateDeviceMutation = useUpdateCustomerDevice();
  const deleteDeviceMutation = useDeleteCustomerDevice();

  const handleBack = () => {
    router.back();
  };

  const handleDeviceEdit = (_device: SelectCustomerDevice) => {
    /* noop */
  };

  const handleDeviceCreate = (device: Partial<SelectCustomerDevice>) => {
    createDeviceMutation.mutate({
      ...device,
      customerId,
    } as InsertCustomerDevice);
  };

  const handleDeviceUpdate = (id: string, device: Partial<SelectCustomerDevice>) => {
    updateDeviceMutation.mutate({
      id,
      customerId,
      data: device,
    });
  };

  const handleDeviceDelete = (id: string) => {
    deleteDeviceMutation.mutate({ id, customerId });
  };

  const handleThresholdsSave = (
    _thresholds: unknown[]
  ) => {
    /* noop */
  };

  // Build provider names map
  const providerNames = providers.reduce(
    (acc: Record<string, string>, provider: SelectProvider) => {
      acc[provider.id] = provider.displayName;
      return acc;
    },
    {}
  );

  if (customer == null) {
    return (
      <div className="p-8">
        <p>Cliente no encontrado</p>
      </div>
    );
  }

  return (
    <CustomerDetail
      customer={customer}
      devices={devices}
      variables={variables}
      thresholds={thresholds}
      providers={providers}
      providerNames={providerNames}
      onBack={handleBack}
      onDeviceEdit={handleDeviceEdit}
      onDeviceCreate={handleDeviceCreate}
      onDeviceUpdate={handleDeviceUpdate}
      onDeviceDelete={handleDeviceDelete}
      onThresholdsSave={handleThresholdsSave}
    />
  );
}
