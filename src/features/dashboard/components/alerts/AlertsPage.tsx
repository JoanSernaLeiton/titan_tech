"use client";

import { AlertsList } from "./AlertsList";

import { useAlerts, useUpdateAlertStatus } from "@/features/dashboard/hooks/use-alerts";
import { Spinner } from "@/shared/components/ui/spinner";

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
      <div className="p-8 space-y-6">
        <h1 className="text-3xl font-bold">Alertas</h1>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">No se pudieron cargar las alertas. Por favor, intenta de nuevo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alertas</h1>
        <p className="text-muted-foreground mt-2">
          Monitorea y gestiona alertas de dispositivos y violaciones de acuerdos
        </p>
      </div>

      {isPending ? (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      ) : (
        <AlertsList alerts={mappedAlerts} onStatusChange={handleStatusChange} />
      )}
    </div>
  );
}
