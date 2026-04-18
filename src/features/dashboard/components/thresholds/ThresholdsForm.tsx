"use client";

import { useEffect, useState } from "react";

import { useThresholds, useUpsertThreshold } from "@/features/dashboard/hooks/use-thresholds";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import type { InsertCustomerThreshold, SelectCustomerThreshold } from "@/shared/db/customer-thresholds.schema";

const EMPTY_THRESHOLDS: SelectCustomerThreshold[] = [];

const DEFAULT_METRICS = [
  {
    key: "energy_today_kwh",
    label: "Energía de Hoy",
    description: "Alerta si la energía generada en el día es menor al mínimo",
    defaultMin: "1",
    unit: "kWh",
    type: "number" as const,
  },
  {
    key: "ac_frequency_hz",
    label: "Frecuencia CA",
    description: "Alerta si la frecuencia de la red eléctrica cae por debajo del mínimo",
    defaultMin: "54",
    unit: "Hz",
    type: "number" as const,
  },
  {
    key: "ac_voltage_v",
    label: "Voltaje CA",
    description: "Alerta si el voltaje de salida cae por debajo del mínimo",
    defaultMin: "108",
    unit: "V",
    type: "number" as const,
  },
  {
    key: "device_online",
    label: "Dispositivo en Línea",
    description: "Alerta si el dispositivo pierde conectividad",
    defaultMin: "1",
    unit: "",
    type: "boolean" as const,
  },
];

interface ThresholdsFormProps {
  customerId?: string;
  thresholds?: SelectCustomerThreshold[];
  onSave?: (thresholds: Partial<SelectCustomerThreshold>[]) => void;
}

export function ThresholdsForm({
  customerId,
  thresholds: propThresholds = [],
  onSave,
}: ThresholdsFormProps) {
  const { data: hookThresholds = EMPTY_THRESHOLDS } = useThresholds(customerId ?? "");
  const upsertMutation = useUpsertThreshold();
  const thresholds = propThresholds.length > 0 ? propThresholds : hookThresholds;

  const [formData, setFormData] = useState<
    Record<string, { minValue: string; enabled: boolean }>
  >(
    DEFAULT_METRICS.reduce<Record<string, { minValue: string; enabled: boolean }>>(
      (acc, metric) => {
        const existing = thresholds.find((t) => t.metric === metric.key);
        acc[metric.key] = {
          minValue: existing != null ? existing.minValue : metric.defaultMin,
          enabled: existing != null ? existing.isEnabled : true,
        };
        return acc;
      },
      {}
    )
  );

  useEffect(() => {
    setFormData(
      DEFAULT_METRICS.reduce<Record<string, { minValue: string; enabled: boolean }>>(
        (acc, metric) => {
          const existing = thresholds.find((t) => t.metric === metric.key);
          acc[metric.key] = {
            minValue: existing != null ? existing.minValue : metric.defaultMin,
            enabled: existing != null ? existing.isEnabled : true,
          };
          return acc;
        },
        {}
      )
    );
  }, [thresholds]);

  const handleSave = () => {
    const updatedThresholds = DEFAULT_METRICS.map((metric) => ({
      customerId: customerId ?? "",
      metric: metric.key,
      minValue: formData[metric.key]?.minValue ?? metric.defaultMin,
      isEnabled: formData[metric.key]?.enabled ?? true,
    }));

    if (customerId != null && propThresholds.length === 0) {
      updatedThresholds.forEach((threshold) => {
        upsertMutation.mutate(threshold as InsertCustomerThreshold);
      });
    } else if (onSave != null) {
      onSave(updatedThresholds);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Métrica</TableHead>
              <TableHead>Valor Mínimo</TableHead>
              <TableHead>Habilitado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DEFAULT_METRICS.map((metric) => {
              const row = formData[metric.key] ?? { minValue: metric.defaultMin, enabled: true };
              const isDisabled = !row.enabled;
              return (
                <TableRow key={metric.key} className={isDisabled ? "opacity-50" : ""}>
                  <TableCell>
                    <p className="font-medium">{metric.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{metric.description}</p>
                  </TableCell>
                  <TableCell>
                    {metric.type === "boolean" ? (
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        Debe estar en línea
                      </span>
                    ) : (
                      <div className="relative flex items-center w-36">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          disabled={isDisabled}
                          value={row.minValue}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              [metric.key]: {
                                minValue: e.target.value,
                                enabled: prev[metric.key]?.enabled ?? true,
                              },
                            }));
                          }}
                          className="pr-12 w-36"
                        />
                        <span className="pointer-events-none absolute right-3 text-xs font-medium text-muted-foreground">
                          {metric.unit}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={row.enabled}
                      onCheckedChange={(checked: boolean) => {
                        setFormData((prev) => ({
                          ...prev,
                          [metric.key]: {
                            minValue: prev[metric.key]?.minValue ?? metric.defaultMin,
                            enabled: checked,
                          },
                        }));
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Guardar Umbrales</Button>
      </div>
    </div>
  );
}
