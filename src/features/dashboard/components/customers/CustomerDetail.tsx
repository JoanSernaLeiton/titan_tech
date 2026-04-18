"use client";

import { useState } from "react";

import { AgreementVariablesForm } from "../agreement-variables/AgreementVariablesForm";
import { DeviceForm } from "../devices/DeviceForm";
import { DevicesList } from "../devices/DevicesList";
import { ThresholdsForm } from "../thresholds/ThresholdsForm";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import type { SelectCustomerAgreementVariable } from "@/shared/db/customer-agreement-variables.schema";
import type { SelectCustomerDevice } from "@/shared/db/customer-devices.schema";
import type { SelectCustomerThreshold } from "@/shared/db/customer-thresholds.schema";
import type { SelectCustomer } from "@/shared/db/customers.schema";
import type { SelectProvider } from "@/shared/db/providers.schema";

interface CustomerDetailProps {
  customer: SelectCustomer;
  devices: SelectCustomerDevice[];
  variables: SelectCustomerAgreementVariable[];
  thresholds: SelectCustomerThreshold[];
  providers?: SelectProvider[];
  providerNames?: Record<string, string>;
  onBack: () => void;
  onDeviceEdit?: (device: SelectCustomerDevice) => void;
  onDeviceDelete?: (id: string) => void;
  onDeviceCreate?: (device: Partial<SelectCustomerDevice>) => void;
  onDeviceUpdate?: (id: string, device: Partial<SelectCustomerDevice>) => void;
  onVariablesSave?: (variables: Partial<SelectCustomerAgreementVariable>[]) => void;
  onThresholdsSave?: (thresholds: Partial<SelectCustomerThreshold>[]) => void;
}

export function CustomerDetail({
  customer,
  devices,
  variables,
  thresholds,
  providers = [],
  providerNames = {},
  onBack,
  onDeviceEdit,
  onDeviceDelete,
  onDeviceCreate,
  onDeviceUpdate,
  onVariablesSave,
  onThresholdsSave,
}: CustomerDetailProps) {
  const [activeTab, setActiveTab] = useState("devices");
  const [isDeviceDialogOpen, setIsDeviceDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<SelectCustomerDevice | null>(null);

  const handleAddDevice = () => {
    setEditingDevice(null);
    setIsDeviceDialogOpen(true);
  };

  const handleEditDevice = (device: SelectCustomerDevice) => {
    setEditingDevice(device);
    setIsDeviceDialogOpen(true);
    onDeviceEdit?.(device);
  };

  const isEditingDevice = editingDevice != null;

  const handleDeleteDevice = (id: string) => {
    onDeviceDelete?.(id);
  };

  const handleDeviceSubmit = (data: Partial<SelectCustomerDevice>) => {
    if (editingDevice != null) {
      onDeviceUpdate?.(editingDevice.id, data);
    } else {
      onDeviceCreate?.({
        ...data,
        customerId: customer.id,
      });
    }
    setIsDeviceDialogOpen(false);
  };

  const handleDeviceCancel = () => {
    setIsDeviceDialogOpen(false);
    setEditingDevice(null);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{customer.name}</h1>
          <p className="text-muted-foreground mt-1">{customer.email}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
          <TabsTrigger value="variables">Variables de Acuerdo</TabsTrigger>
          <TabsTrigger value="thresholds">Umbrales</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Dispositivos</CardTitle>
              <Button onClick={handleAddDevice} size="sm">
                Agregar Dispositivo
              </Button>
            </CardHeader>
            <CardContent>
              <DevicesList
                devices={devices}
                providerNames={providerNames}
                onEdit={handleEditDevice}
                onDelete={handleDeleteDevice}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Variables de Acuerdo</CardTitle>
            </CardHeader>
            <CardContent>
              <AgreementVariablesForm
                customerId={customer.id}
                variables={variables}
                onSave={onVariablesSave ?? (() => { /* noop */ })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thresholds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Umbrales</CardTitle>
            </CardHeader>
            <CardContent>
              <ThresholdsForm
                customerId={customer.id}
                thresholds={thresholds}
                onSave={onThresholdsSave ?? (() => { /* noop */ })}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDeviceDialogOpen} onOpenChange={setIsDeviceDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditingDevice ? "Editar Dispositivo" : "Agregar Nuevo Dispositivo"}
            </DialogTitle>
          </DialogHeader>
          <DeviceForm
            {...(isEditingDevice ? { device: editingDevice } : {})}
            providers={providers}
            onSubmit={handleDeviceSubmit}
            onCancel={handleDeviceCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
