"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import type { SelectCustomerDevice } from "@/shared/db/customer-devices.schema";
import type { SelectProvider } from "@/shared/db/providers.schema";

const deviceFormSchema = z.object({
  deviceName: z.string().min(1, "El nombre del dispositivo es obligatorio"),
  providerId: z.string().min(1, "El proveedor es obligatorio"),
  deviceType: z.enum(["inverter", "micro_inverter"]),
  externalId: z.string().min(1, "El ID externo es obligatorio"),
  displayLabel: z.string().optional(),
  apiParams: z.string().optional(),
});

type DeviceFormData = z.infer<typeof deviceFormSchema>;

interface DeviceFormProps {
  device?: SelectCustomerDevice;
  providers: SelectProvider[];
  onSubmit: (data: Partial<SelectCustomerDevice>) => void;
  onCancel: () => void;
}

export function DeviceForm({
  device,
  providers,
  onSubmit,
  onCancel,
}: DeviceFormProps) {
  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: device != null
      ? {
          deviceName: device.deviceName,
          providerId: device.providerId,
          deviceType: device.deviceType,
          externalId: device.externalId,
          displayLabel: device.deviceName,
          apiParams: JSON.stringify(device.apiParams, null, 2),
        }
      : {
          deviceName: "",
          providerId: "",
          deviceType: "inverter",
          externalId: "",
          displayLabel: "",
          apiParams: "{}",
        },
  });

  const handleSubmit = (data: DeviceFormData) => {
    onSubmit({
      ...data,
      apiParams: data.apiParams != null && data.apiParams !== "" ? JSON.parse(data.apiParams) : null,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={(e) => { void form.handleSubmit(handleSubmit)(e); }} className="space-y-4">
        <FormField
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          control={form.control as any}
          name="deviceName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Dispositivo</FormLabel>
              <FormControl>
                <Input placeholder="ej. Panel Solar 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          control={form.control as any}
          name="providerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proveedor</FormLabel>
              <Select value={field.value as string} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          control={form.control as any}
          name="deviceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Dispositivo</FormLabel>
              <Select value={field.value as string} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo de dispositivo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="inverter">Inversor</SelectItem>
                  <SelectItem value="micro_inverter">Micro-Inversor</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          control={form.control as any}
          name="externalId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID Externo (Número de Serie / ID de Planta)</FormLabel>
              <FormControl>
                <Input placeholder="ej. SN123456" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          control={form.control as any}
          name="displayLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Etiqueta de Visualización (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Nombre personalizado" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          control={form.control as any}
          name="apiParams"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parámetros de API (JSON, Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="{}"
                  className="font-mono text-xs"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {device != null ? "Actualizar" : "Agregar"} Dispositivo
          </Button>
        </div>
      </form>
    </Form>
  );
}
