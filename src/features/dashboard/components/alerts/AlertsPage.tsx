"use client";

import { DashboardPageShell } from "../layout/DashboardPageShell";
import { LoadingState, PageState } from "../layout/PageState";

import { AlertsList } from "./AlertsList";

import { useAlerts, useUpdateAlertStatus } from "@/features/dashboard/hooks/use-alerts";

interface Alert {
  id: string;
  customerName: string;
  deviceName: string;
  metric: string;
  triggeredValue: number;
  threshold: number;
  timestamp: Date;
  alertType: "threshold_breach" | "agreement_breach";
  status: "pending" | "under_review" | "resolved";
}

export function AlertsPage() {
  const { data: alerts = [], isPending, isError } = useAlerts();
  const updateAlertMutation = useUpdateAlertStatus();

  const mappedAlerts: Alert[] = alerts.map((alert) => ({
    id: alert.id,
    customerName: alert.customer.name,
    deviceName: alert.device?.deviceName ?? "Desconocido",
    metric: alert.metric,
    triggeredValue: parseFloat(alert.triggeredValue),
    threshold: parseFloat(alert.thresholdValue),
    timestamp: alert.triggeredAt,
    alertType: alert.alertType,
    status: alert.status,
  }));

  const handleStatusChange = (id: string, status: Alert["status"]) => {
    updateAlertMutation.mutate({ id, status });
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
        <AlertsList alerts={mappedAlerts} onStatusChange={handleStatusChange} />
      )}
    </DashboardPageShell>
  );
}
