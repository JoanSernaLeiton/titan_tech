"use client";

import { useState } from "react";

import { useCustomerMetrics } from "@/features/dashboard/hooks/use-customer-metrics";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { SelectCustomerAgreementVariable } from "@/shared/db/customer-agreement-variables.schema";

interface CustomerMetricsPanelProps {
  customerId: string;
  agreementVariables: SelectCustomerAgreementVariable[];
}

function fmt(value: number, decimals = 1): string {
  return value.toLocaleString("es-CO", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCurrency(value: number, unit: string): string {
  if (unit === "COP") {
    return `$${value.toLocaleString("es-CO", { maximumFractionDigits: 0 })} COP`;
  }
  return `${fmt(value)} ${unit}`;
}

type DeviceTypeFilter = "all" | "inverter" | "micro_inverter";
type ProviderFilter = "all" | "growatt" | "huawei" | "deye";

export function CustomerMetricsPanel({
  customerId,
  agreementVariables,
}: CustomerMetricsPanelProps) {
  const [deviceType, setDeviceType] = useState<DeviceTypeFilter>("all");
  const [provider, setProvider] = useState<ProviderFilter>("all");

  const filters = {
    ...(deviceType !== "all" ? { deviceType } : {}),
    ...(provider !== "all" ? { providerSlug: provider } : {}),
  };

  const { data, isLoading } = useCustomerMetrics(customerId, filters);

  const hasTargets = agreementVariables.some((v) => v.enabled);

  const availabilityColor =
    data == null || data.snapshotCount === 0
      ? "secondary"
      : data.availabilityPct >= 90
        ? "default"
        : data.availabilityPct >= 60
          ? "secondary"
          : data.onlineDevices === 0
            ? "secondary"
            : "destructive";

  const availabilityLabel =
    data == null || data.snapshotCount === 0
      ? "Sin datos"
      : data.availabilityPct >= 90
        ? "Óptimo"
        : data.availabilityPct >= 60
          ? "Parcial"
          : data.onlineDevices === 0
            ? "Inactivo"
            : "Crítico";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Métricas en tiempo real</h2>
          {data?.latestSnapshotAt != null && (
            <span className="text-xs text-muted-foreground">
              Actualizado: {new Date(data.latestSnapshotAt).toLocaleTimeString("es-CO")}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Select
            value={deviceType}
            onValueChange={(v) => { setDeviceType(v as DeviceTypeFilter); }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Tipo de dispositivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="inverter">Inversor</SelectItem>
              <SelectItem value="micro_inverter">Microinversor</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={provider}
            onValueChange={(v) => { setProvider(v as ProviderFilter); }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="growatt">Growatt</SelectItem>
              <SelectItem value="huawei">Huawei</SelectItem>
              <SelectItem value="deye">DeyeCloud</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!hasTargets && (
        <p className="text-sm text-muted-foreground">
          Configure las variables de acuerdo para ver dinero ahorrado, performance ratio y CO₂ calculados con precisión.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          title="Energía este mes"
          value={isLoading ? null : `${fmt(data?.energyMonthKwh ?? 0)} kWh`}
          subtitle="Acumulado mensual"
          icon="🗓️"
        />

        <MetricCard
          title="Energía ahorrada"
          value={isLoading ? null : `${fmt(data?.energySavedKwh ?? 0)} kWh`}
          subtitle="Hoy"
          icon="⚡"
        />

        <MetricCard
          title="Dinero ahorrado"
          value={
            isLoading
              ? null
              : fmtCurrency(data?.moneySaved ?? 0, data?.moneyUnit ?? "COP")
          }
          subtitle="Hoy"
          icon="💰"
        />

        <MetricCard
          title="Disponibilidad"
          value={isLoading ? null : `${fmt(data?.availabilityPct ?? 0)}%`}
          subtitle={
            data != null
              ? `${String(data.onlineDevices)}/${String(data.totalDevices)} dispositivos`
              : "—"
          }
          icon="📶"
          badge={
            data != null ? (
              <Badge variant={availabilityColor}>
                {availabilityLabel}
              </Badge>
            ) : undefined
          }
        />

        <MetricCard
          title="Performance ratio"
          value={
            isLoading
              ? null
              : data?.performanceRatioPct != null
                ? `${fmt(data.performanceRatioPct)}%`
                : "—"
          }
          subtitle={
            data?.performanceRatioPct == null && !isLoading
              ? "Configure meta mensual"
              : "vs. meta diaria"
          }
          icon="📊"
        />

        <MetricCard
          title="Reducción CO₂"
          value={isLoading ? null : `${fmt(data?.co2ReductionKg ?? 0)} kg`}
          subtitle="Hoy"
          icon="🌿"
        />
      </div>

      <div className="text-xs text-muted-foreground text-right">
        Potencia activa: {isLoading ? "…" : `${fmt(data?.activePowerKw ?? 0)} kW`} · Se actualiza cada 3 min
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | null;
  subtitle?: string;
  icon: string;
  badge?: React.ReactNode;
}

function MetricCard({ title, value, subtitle, icon, badge }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <span>{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-2xl font-bold leading-tight">
          {value ?? <span className="animate-pulse text-muted-foreground">…</span>}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {subtitle != null && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
          {badge}
        </div>
      </CardContent>
    </Card>
  );
}
