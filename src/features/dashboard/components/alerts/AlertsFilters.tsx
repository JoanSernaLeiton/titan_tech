"use client";

import { useEffect, useState } from "react";

import { DEFAULT_METRICS } from "@/features/dashboard/lib/metric-labels";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export interface AlertFilters {
  customerSearch: string;
  metricKey: string | null;
  alertType: "threshold_breach" | "agreement_breach" | null;
  status: "pending" | "under_review" | "resolved" | null;
  dateFrom: string | null;
  dateTo: string | null;
}

export const DEFAULT_FILTERS: AlertFilters = {
  customerSearch: "",
  metricKey: null,
  alertType: null,
  status: null,
  dateFrom: null,
  dateTo: null,
};

interface AlertsFiltersProps {
  filters: AlertFilters;
  onFiltersChange: (filters: AlertFilters) => void;
  resultCount: number;
}

function hasActiveFilters(filters: AlertFilters): boolean {
  return (
    filters.customerSearch !== "" ||
    filters.metricKey !== null ||
    filters.alertType !== null ||
    filters.status !== null ||
    filters.dateFrom !== null ||
    filters.dateTo !== null
  );
}

export function AlertsFilters({ filters, onFiltersChange, resultCount }: AlertsFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.customerSearch);

  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, customerSearch: searchInput });
    }, 300);
    return () => { clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const update = (patch: Partial<AlertFilters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const clearAll = () => {
    setSearchInput("");
    onFiltersChange(DEFAULT_FILTERS);
  };

  const active = hasActiveFilters({ ...filters, customerSearch: searchInput });

  return (
    <div className="rounded-xl border border-border/70 bg-card/90 p-4 shadow-xs space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs text-muted-foreground font-medium">Cliente</label>
          <Input
            placeholder="Buscar por nombre..."
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); }}
            className="h-9"
          />
        </div>

        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs text-muted-foreground font-medium">Métrica</label>
          <Select
            value={filters.metricKey ?? "all"}
            onValueChange={(v) => { update({ metricKey: v === "all" ? null : v }); }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las métricas</SelectItem>
              {DEFAULT_METRICS.map((m) => (
                <SelectItem key={m.key} value={m.key}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 min-w-[180px]">
          <label className="text-xs text-muted-foreground font-medium">Tipo de Alerta</label>
          <Select
            value={filters.alertType ?? "all"}
            onValueChange={(v) =>
              { update({
                alertType: v === "all" ? null : (v as AlertFilters["alertType"]),
              }); }
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="threshold_breach">Violación de Umbral</SelectItem>
              <SelectItem value="agreement_breach">Violación de Acuerdo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-xs text-muted-foreground font-medium">Estado</label>
          <Select
            value={filters.status ?? "all"}
            onValueChange={(v) =>
              { update({
                status: v === "all" ? null : (v as AlertFilters["status"]),
              }); }
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="under_review">En Revisión</SelectItem>
              <SelectItem value="resolved">Resuelto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-xs text-muted-foreground font-medium">Desde</label>
          <input
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(e) => { update({ dateFrom: e.target.value || null }); }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-xs text-muted-foreground font-medium">Hasta</label>
          <input
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(e) => { update({ dateTo: e.target.value || null }); }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={!active}
          onClick={clearAll}
          className="h-9 self-end"
        >
          Limpiar filtros
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {resultCount} {resultCount === 1 ? "alerta encontrada" : "alertas encontradas"}
      </p>
    </div>
  );
}
