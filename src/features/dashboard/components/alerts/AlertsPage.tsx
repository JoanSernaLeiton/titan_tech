"use client";

import { useMemo, useState } from "react";

import { DashboardPageShell } from "../layout/DashboardPageShell";
import { LoadingState, PageState } from "../layout/PageState";

import { AlertDetail } from "./AlertDetail";
import { AlertsFilters, DEFAULT_FILTERS } from "./AlertsFilters";
import type { AlertFilters } from "./AlertsFilters";
import { AlertsList } from "./AlertsList";

import { useAlerts, useUpdateAlertStatus } from "@/features/dashboard/hooks/use-alerts";
import { formatMetricValue, getMetricLabel, getMetricUnit } from "@/features/dashboard/lib/metric-labels";

export interface Alert {
  id: string;
  customerId: string;
  customerName: string;
  deviceId: string | null;
  deviceName: string;
  providerName: string;
  metric: string;
  metricLabel: string;
  unitLabel: string;
  triggeredValue: number;
  threshold: number;
  formattedValue: string;
  formattedThreshold: string;
  timestamp: Date;
  alertType: "threshold_breach" | "agreement_breach";
  status: "pending" | "under_review" | "resolved";
}

export interface SortState {
  field: "timestamp" | "triggeredValue" | "threshold" | "customerName" | "deviceName" | "metric" | "status";
  direction: "asc" | "desc";
}

const STATUS_ORDER: Record<Alert["status"], number> = {
  pending: 0,
  under_review: 1,
  resolved: 2,
};

const STATUS_CSV_LABELS: Record<Alert["status"], string> = {
  pending: "Pendiente",
  under_review: "En Revisión",
  resolved: "Resuelto",
};

const ALERT_TYPE_CSV_LABELS: Record<Alert["alertType"], string> = {
  threshold_breach: "Violación de Umbral",
  agreement_breach: "Violación de Acuerdo",
};

function downloadCsv(alerts: Alert[]): void {
  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const headers = [
    "Cliente",
    "Dispositivo",
    "Métrica",
    "Valor Detectado",
    "Umbral",
    "Fecha y Hora",
    "Tipo de Alerta",
    "Estado",
  ];

  const rows = alerts.map((alert) => [
    alert.customerName,
    alert.deviceName,
    alert.metricLabel,
    alert.formattedValue,
    alert.formattedThreshold,
    formatDate(alert.timestamp),
    ALERT_TYPE_CSV_LABELS[alert.alertType],
    STATUS_CSV_LABELS[alert.status],
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `alertas-${new Date().toISOString().split("T")[0]}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AlertsPage() {
  const { data: rawAlerts = [], isPending, isError } = useAlerts();
  const updateAlertMutation = useUpdateAlertStatus();

  const [filters, setFilters] = useState<AlertFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortState>({ field: "timestamp", direction: "desc" });
  const [detailAlert, setDetailAlert] = useState<Alert | null>(null);

  const enrichedAlerts: Alert[] = useMemo(
    () =>
      rawAlerts.map((alert) => {
        const metric = alert.metric;
        const triggeredValue = parseFloat(alert.triggeredValue);
        const threshold = parseFloat(alert.thresholdValue);
        return {
          id: alert.id,
          customerId: alert.customer.id ?? "",
          customerName: alert.customer.name,
          deviceId: alert.device?.id ?? null,
          deviceName: alert.device?.deviceName ?? "Desconocido",
          providerName: alert.provider?.displayName ?? "Desconocido",
          metric,
          metricLabel: getMetricLabel(metric),
          unitLabel: getMetricUnit(metric),
          triggeredValue,
          threshold,
          formattedValue: formatMetricValue(triggeredValue, metric),
          formattedThreshold: formatMetricValue(threshold, metric),
          timestamp: alert.triggeredAt,
          alertType: alert.alertType,
          status: alert.status,
        };
      }),
    [rawAlerts]
  );

  const filteredAndSorted: Alert[] = useMemo(() => {
    let result = enrichedAlerts.filter((alert) => {
      if (
        filters.customerSearch &&
        !alert.customerName.toLowerCase().includes(filters.customerSearch.toLowerCase())
      ) {
        return false;
      }
      if (filters.metricKey && alert.metric !== filters.metricKey) return false;
      if (filters.alertType && alert.alertType !== filters.alertType) return false;
      if (filters.status && alert.status !== filters.status) return false;
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        if (alert.timestamp < from) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        if (alert.timestamp > to) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      switch (sort.field) {
        case "timestamp":
          aVal = a.timestamp.getTime();
          bVal = b.timestamp.getTime();
          break;
        case "triggeredValue":
          aVal = a.triggeredValue;
          bVal = b.triggeredValue;
          break;
        case "threshold":
          aVal = a.threshold;
          bVal = b.threshold;
          break;
        case "customerName":
          aVal = a.customerName.toLowerCase();
          bVal = b.customerName.toLowerCase();
          break;
        case "deviceName":
          aVal = a.deviceName.toLowerCase();
          bVal = b.deviceName.toLowerCase();
          break;
        case "metric":
          aVal = a.metricLabel.toLowerCase();
          bVal = b.metricLabel.toLowerCase();
          break;
        case "status":
          aVal = STATUS_ORDER[a.status];
          bVal = STATUS_ORDER[b.status];
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [enrichedAlerts, filters, sort]);

  const handleStatusChange = (id: string, status: Alert["status"]) => {
    updateAlertMutation.mutate({ id, status });
  };

  const handleSortChange = (field: SortState["field"]) => {
    setSort((prev) =>
      prev.field === field
        ? { field, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { field, direction: "asc" }
    );
  };

  if (isError) {
    return (
      <DashboardPageShell
        title="Alertas"
        description="Monitorea incidentes con una vista limpia y de lectura rapida."
      >
        <PageState
          tone="error"
          message="No se pudieron cargar las alertas. Por favor, intenta de nuevo."
        />
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell
      title="Alertas"
      description="Monitorea y gestiona alertas de dispositivos y violaciones de acuerdos."
    >
      {isPending ? (
        <LoadingState message="Cargando alertas..." />
      ) : (
        <div className="space-y-4">
          <AlertsFilters
            filters={filters}
            onFiltersChange={setFilters}
            resultCount={filteredAndSorted.length}
            onDownload={() => { downloadCsv(filteredAndSorted); }}
          />
          <AlertsList
            alerts={filteredAndSorted}
            onStatusChange={handleStatusChange}
            onSortChange={handleSortChange}
            onOpenDetail={setDetailAlert}
            currentSort={sort}
          />
          <AlertDetail
            alert={detailAlert}
            open={detailAlert !== null}
            onOpenChange={(open) => { if (!open) setDetailAlert(null); }}
          />
        </div>
      )}
    </DashboardPageShell>
  );
}
