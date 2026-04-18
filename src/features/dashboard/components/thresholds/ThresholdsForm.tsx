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

const DEFAULT_METRICS = [
  { key: "energy_today_kwh", label: "Energía de Hoy (kWh)" },
  { key: "active_power_kw", label: "Potencia Activa (kW)" },
  { key: "temperature_c", label: "Temperatura (°C)" },
  { key: "ac_frequency_hz", label: "Frecuencia CA (Hz)" },
  { key: "ac_voltage_v", label: "Voltaje CA (V)" },
  { key: "device_online", label: "Dispositivo en Línea" },
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
  const { data: hookThresholds = [] } = useThresholds(customerId ?? "");
  const upsertMutation = useUpsertThreshold();
  const thresholds = propThresholds.length > 0 ? propThresholds : hookThresholds;

  const [formData, setFormData] = useState<
    Record<string, { minValue: string; enabled: boolean }>
  >({
    ...DEFAULT_METRICS.reduce<Record<string, { minValue: string; enabled: boolean }>>(
      (acc, metric) => {
        const existing = thresholds.find((t) => t.metric === metric.key);
        acc[metric.key] = {
          minValue: existing != null ? existing.minValue : "",
          enabled: existing != null ? existing.isEnabled : true,
        };
        return acc;
      },
      {}
    ),
  });

  useEffect(() => {
    setFormData({
      ...DEFAULT_METRICS.reduce<Record<string, { minValue: string; enabled: boolean }>>(
        (acc, metric) => {
          const existing = thresholds.find((t) => t.metric === metric.key);
          acc[metric.key] = {
            minValue: existing != null ? existing.minValue : "",
            enabled: existing != null ? existing.isEnabled : true,
          };
          return acc;
        },
        {}
      ),
    });
  }, [thresholds]);

  const handleSave = () => {
    const updatedThresholds = DEFAULT_METRICS.map((metric) => ({
      customerId: customerId ?? "",
      metric: metric.key,
      minValue: formData[metric.key]?.minValue ?? "0",
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
            {DEFAULT_METRICS.map((metric) => (
              <TableRow key={metric.key}>
                <TableCell className="font-medium">{metric.label}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={formData[metric.key]?.minValue ?? ""}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        [metric.key]: {
                          minValue: e.target.value,
                          enabled: prev[metric.key]?.enabled ?? true,
                        },
                      }));
                    }}
                    className="w-32"
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={formData[metric.key]?.enabled ?? true}
                    onCheckedChange={(checked: boolean) => {
                      setFormData((prev) => ({
                        ...prev,
                        [metric.key]: {
                          minValue: prev[metric.key]?.minValue ?? "",
                          enabled: checked,
                        },
                      }));
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Guardar Umbrales</Button>
      </div>
    </div>
  );
}
