"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { cn } from "@/shared/lib/utils";

interface Alert {
  id: string;
  customerId: string;
  customerName: string;
  deviceId: string | null;
  deviceName: string;
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

interface AlertDetailProps {
  alert: Alert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({
  label,
  value,
  monospace,
}: {
  label: string;
  value: React.ReactNode;
  monospace?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/30 last:border-b-0">
      <span className="font-medium text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-sm text-right break-all", monospace && "font-mono text-xs")}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}

const STATUS_LABELS: Record<Alert["status"], string> = {
  pending: "Pendiente",
  under_review: "En Revisión",
  resolved: "Resuelto",
};

const STATUS_COLORS: Record<Alert["status"], string> = {
  pending: "border-warning/30 bg-warning/15 text-warning",
  under_review: "border-blue-300/30 bg-blue-500/10 text-blue-600",
  resolved: "border-green-300/30 bg-green-500/10 text-green-600",
};

const ALERT_TYPE_LABELS: Record<Alert["alertType"], string> = {
  threshold_breach: "Violación de Umbral",
  agreement_breach: "Violación de Acuerdo",
};

export function AlertDetail({ alert, open, onOpenChange }: AlertDetailProps) {
  if (!alert) return null;

  const diff = alert.triggeredValue - alert.threshold;
  const diffSign = diff >= 0 ? "+" : "";
  const formattedDiff = `${diffSign}${diff.toFixed(2)}${alert.unitLabel ? ` ${alert.unitLabel}` : ""}`;

  const isoTimestamp = new Date(alert.timestamp).toISOString();
  const localTimestamp = new Date(alert.timestamp).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de Alerta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Section title="Información General">
            <DetailRow label="ID de Alerta" value={alert.id} monospace />
            <DetailRow label="Tipo" value={ALERT_TYPE_LABELS[alert.alertType]} />
            <DetailRow
              label="Estado"
              value={
                <Badge className={STATUS_COLORS[alert.status]}>
                  {STATUS_LABELS[alert.status]}
                </Badge>
              }
            />
          </Section>

          <Section title="Métrica">
            <DetailRow label="Clave" value={alert.metric} monospace />
            <DetailRow label="Nombre" value={alert.metricLabel} />
            <DetailRow label="Unidad" value={alert.unitLabel || "Sin unidad"} />
          </Section>

          <Section title="Valores y Umbrales">
            <DetailRow label="Valor Detectado" value={alert.formattedValue} />
            <DetailRow label="Umbral" value={alert.formattedThreshold} />
            <DetailRow label="Diferencia" value={formattedDiff} />
          </Section>

          <Section title="Dispositivo & Cliente">
            <DetailRow label="ID Cliente" value={alert.customerId} monospace />
            <DetailRow label="Nombre Cliente" value={alert.customerName} />
            <DetailRow label="ID Dispositivo" value={alert.deviceId ?? "N/A"} monospace />
            <DetailRow label="Nombre Dispositivo" value={alert.deviceName} />
          </Section>

          <Section title="Timestamp">
            <DetailRow label="ISO 8601" value={isoTimestamp} monospace />
            <DetailRow label="Fecha y Hora Local" value={localTimestamp} />
          </Section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); }}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
