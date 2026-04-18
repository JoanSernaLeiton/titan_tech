"use client";

import { useEffect, useState } from "react";

import { useAgreementVariables, useUpsertAgreementVariable } from "@/features/dashboard/hooks/use-agreement-variables";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import type { InsertCustomerAgreementVariable, SelectCustomerAgreementVariable } from "@/shared/db/customer-agreement-variables.schema";

const UNIT_OPTIONS = [
  "kWh",
  "MWh",
  "GWh",
  "kW",
  "MW",
  "%",
  "kg",
  "ton",
  "COP",
  "USD",
  "EUR",
  "MXN",
];

const VARIABLES = [
  {
    key: "energia_ahorrada",
    label: "Energía Ahorrada",
    defaultUnit: "kWh",
  },
  {
    key: "dinero_ahorrado",
    label: "Dinero Ahorrado",
    defaultUnit: "USD",
  },
  {
    key: "disponibilidad_sistema",
    label: "Disponibilidad del Sistema",
    defaultUnit: "%",
  },
  {
    key: "performance_ratio",
    label: "Performance Ratio",
    defaultUnit: "%",
  },
  {
    key: "mitigacion_co2",
    label: "Mitigación CO2",
    defaultUnit: "ton",
  },
];

interface AgreementVariablesFormProps {
  customerId?: string;
  variables?: SelectCustomerAgreementVariable[];
  onSave?: (variables: Partial<SelectCustomerAgreementVariable>[]) => void;
}

export function AgreementVariablesForm({
  customerId,
  variables: propVariables = [],
  onSave,
}: AgreementVariablesFormProps) {
  const { data: hookVariables = [] } = useAgreementVariables(customerId ?? "");
  const upsertMutation = useUpsertAgreementVariable();
  const variables = propVariables.length > 0 ? propVariables : hookVariables;

  const [formData, setFormData] = useState<
    Record<string, { monthlyTarget: string; unit: string; enabled: boolean }>
  >(
    VARIABLES.reduce<Record<string, { monthlyTarget: string; unit: string; enabled: boolean }>>(
      (acc, variable) => {
        const existing = variables.find((v) => v.variable === variable.key);
        acc[variable.key] = {
          monthlyTarget: existing != null ? existing.monthlyTarget : "",
          unit: existing != null ? existing.unit : variable.defaultUnit,
          enabled: existing != null ? existing.enabled : true,
        };
        return acc;
      },
      {}
    )
  );

  useEffect(() => {
    setFormData(
      VARIABLES.reduce<Record<string, { monthlyTarget: string; unit: string; enabled: boolean }>>(
        (acc, variable) => {
          const existing = variables.find((v) => v.variable === variable.key);
          acc[variable.key] = {
            monthlyTarget: existing != null ? existing.monthlyTarget : "",
            unit: existing != null ? existing.unit : variable.defaultUnit,
            enabled: existing != null ? existing.enabled : true,
          };
          return acc;
        },
        {}
      )
    );
  }, [variables]);

  const handleSave = () => {
    const updatedVariables = VARIABLES.map((variable) => {
      const data = formData[variable.key];
      return {
        customerId: customerId ?? "",
        variable: variable.key as "energia_ahorrada" | "dinero_ahorrado" | "disponibilidad_sistema" | "performance_ratio" | "mitigacion_co2",
        monthlyTarget: data?.monthlyTarget || "0",
        unit: data?.unit ?? variable.defaultUnit,
        enabled: data?.enabled ?? true,
      };
    });

    if (customerId != null && propVariables.length === 0) {
      updatedVariables.forEach((variable) => {
        upsertMutation.mutate(variable as InsertCustomerAgreementVariable);
      });
    } else if (onSave != null) {
      onSave(updatedVariables as Partial<SelectCustomerAgreementVariable>[]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Métrica</TableHead>
              <TableHead>Meta Mensual</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Habilitado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {VARIABLES.map((variable) => {
              const data = formData[variable.key] ?? {
                monthlyTarget: "",
                unit: variable.defaultUnit,
                enabled: true,
              };
              return (
                <TableRow key={variable.key}>
                  <TableCell className="font-medium">{variable.label}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={data.monthlyTarget}
                      onChange={(e) =>
                        {
                          setFormData({
                            ...formData,
                            [variable.key]: {
                              ...data,
                              monthlyTarget: e.target.value,
                            },
                          });
                        }
                      }
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell>
                    <Select value={data.unit} onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        [variable.key]: {
                          ...data,
                          unit: value,
                        },
                      });
                    }}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={data.enabled}
                      onCheckedChange={(checked: boolean) =>
                        {
                          setFormData({
                            ...formData,
                            [variable.key]: {
                              ...data,
                              enabled: checked,
                            },
                          });
                        }
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Guardar Todas las Variables</Button>
      </div>
    </div>
  );
}
