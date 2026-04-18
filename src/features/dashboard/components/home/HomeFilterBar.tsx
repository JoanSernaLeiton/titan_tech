"use client";

import { Filter } from "lucide-react";
import { useMemo } from "react";

import {
  ALL_METRIC_KEYS,
  ALL_VALUE,
  METRIC_LABELS,
  type DeviceTypeFilter,
  type HomeFilters,
  type MetricKey,
} from "@/features/dashboard/lib/home-filters";
import type { DeviceMetricsRow } from "@/features/dashboard/queries/home-metrics.queries";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface HomeFilterBarProps {
  filters: HomeFilters;
  onFiltersChange: (filters: HomeFilters) => void;
  allRows: DeviceMetricsRow[];
  filteredCount: number;
}

function dedupeById<T extends { id: string; name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function HomeFilterBar({
  filters,
  onFiltersChange,
  allRows,
  filteredCount,
}: HomeFilterBarProps) {
  const customers = useMemo(
    () =>
      dedupeById(
        allRows.map((row) => ({ id: row.customerId, name: row.customerName }))
      ).sort((a, b) => a.name.localeCompare(b.name, "es")),
    [allRows]
  );

  const devices = useMemo(() => {
    const scoped =
      filters.customerId === ALL_VALUE
        ? allRows
        : allRows.filter((row) => row.customerId === filters.customerId);
    return dedupeById(
      scoped.map((row) => ({ id: row.deviceId, name: row.deviceName }))
    ).sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [allRows, filters.customerId]);

  const handleCustomerChange = (value: string) => {
    const deviceStillValid =
      filters.deviceId === ALL_VALUE ||
      allRows.some(
        (row) =>
          row.deviceId === filters.deviceId &&
          (value === ALL_VALUE || row.customerId === value)
      );
    onFiltersChange({
      ...filters,
      customerId: value,
      deviceId: deviceStillValid ? filters.deviceId : ALL_VALUE,
    });
  };

  const handleDeviceChange = (value: string) => {
    onFiltersChange({ ...filters, deviceId: value });
  };

  const handleTypeChange = (value: string) => {
    onFiltersChange({ ...filters, deviceType: value as DeviceTypeFilter });
  };

  const toggleMetric = (key: MetricKey) => {
    const next = new Set(filters.metrics);
    if (next.has(key)) {
      if (next.size === 1) return; // always keep at least one
      next.delete(key);
    } else {
      next.add(key);
    }
    onFiltersChange({ ...filters, metrics: next });
  };

  const handleReset = () => {
    onFiltersChange({
      customerId: ALL_VALUE,
      deviceId: ALL_VALUE,
      deviceType: ALL_VALUE,
      metrics: new Set(ALL_METRIC_KEYS),
    });
  };

  const totalRows = allRows.length;
  const hasActiveFilters =
    filters.customerId !== ALL_VALUE ||
    filters.deviceId !== ALL_VALUE ||
    filters.deviceType !== ALL_VALUE ||
    filters.metrics.size !== ALL_METRIC_KEYS.length;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card/90 p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Filter className="size-4 text-primary" />
          <span>Filtros</span>
          <Badge variant="secondary" className="text-xs">
            {filteredCount} / {totalRows} dispositivos
          </Badge>
        </div>
        {hasActiveFilters ? (
          <Button type="button" size="sm" variant="ghost" onClick={handleReset}>
            Limpiar filtros
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="filter-customer" className="text-xs text-muted-foreground">
            Cliente
          </Label>
          <Select value={filters.customerId} onValueChange={handleCustomerChange}>
            <SelectTrigger id="filter-customer">
              <SelectValue placeholder="Todos los clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos los clientes</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="filter-device" className="text-xs text-muted-foreground">
            Dispositivo
          </Label>
          <Select value={filters.deviceId} onValueChange={handleDeviceChange}>
            <SelectTrigger id="filter-device">
              <SelectValue placeholder="Todos los dispositivos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos los dispositivos</SelectItem>
              {devices.map((device) => (
                <SelectItem key={device.id} value={device.id}>
                  {device.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="filter-type" className="text-xs text-muted-foreground">
            Tipo
          </Label>
          <Select value={filters.deviceType} onValueChange={handleTypeChange}>
            <SelectTrigger id="filter-type">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Todos los tipos</SelectItem>
              <SelectItem value="inverter">Inversor</SelectItem>
              <SelectItem value="micro_inverter">Micro-inversor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Métricas visibles</Label>
        <div className="flex flex-wrap gap-2">
          {ALL_METRIC_KEYS.map((key) => {
            const active = filters.metrics.has(key);
            return (
              <Button
                key={key}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => { toggleMetric(key); }}
              >
                {METRIC_LABELS[key]}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
