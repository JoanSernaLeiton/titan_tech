import type { Alert, SortState } from "./AlertsPage";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";

interface AlertsListProps {
  alerts: Alert[];
  onStatusChange: (id: string, status: Alert["status"]) => void;
  onSortChange: (field: SortState["field"]) => void;
  onOpenDetail: (alert: Alert) => void;
  currentSort: SortState;
}

const ALERT_TYPE_STYLES: Record<Alert["alertType"], string> = {
  threshold_breach: "border-warning/30 bg-warning/15 text-warning",
  agreement_breach: "border-destructive/30 bg-destructive/10 text-destructive",
};

const ALERT_TYPE_LABELS: Record<Alert["alertType"], string> = {
  threshold_breach: "Violación de Umbral",
  agreement_breach: "Violación de Acuerdo",
};

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function SortableHead({
  field,
  label,
  currentSort,
  onSortChange,
  className,
}: {
  field: SortState["field"];
  label: string;
  currentSort: SortState;
  onSortChange: (field: SortState["field"]) => void;
  className?: string;
}) {
  const isActive = currentSort.field === field;
  const indicator = isActive ? (currentSort.direction === "asc" ? " ▲" : " ▼") : " ↕";

  return (
    <TableHead
      onClick={() => { onSortChange(field); }}
      className={cn("cursor-pointer select-none hover:bg-muted/50 whitespace-nowrap", className)}
    >
      <span>
        {label}
        <span className={cn("text-[10px] ml-0.5", isActive ? "text-foreground" : "text-muted-foreground/40")}>
          {indicator}
        </span>
      </span>
    </TableHead>
  );
}

export function AlertsList({ alerts, onStatusChange, onSortChange, onOpenDetail, currentSort }: AlertsListProps) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/90 shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead field="customerName" label="Cliente" currentSort={currentSort} onSortChange={onSortChange} />
            <SortableHead field="deviceName" label="Dispositivo" currentSort={currentSort} onSortChange={onSortChange} />
            <SortableHead field="metric" label="Métrica" currentSort={currentSort} onSortChange={onSortChange} />
            <SortableHead field="triggeredValue" label="Valor Detectado" currentSort={currentSort} onSortChange={onSortChange} />
            <SortableHead field="threshold" label="Umbral" currentSort={currentSort} onSortChange={onSortChange} />
            <SortableHead field="timestamp" label="Fecha y Hora" currentSort={currentSort} onSortChange={onSortChange} />
            <TableHead>Tipo de Alerta</TableHead>
            <SortableHead field="status" label="Estado" currentSort={currentSort} onSortChange={onSortChange} />
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                No se encontraron alertas.
              </TableCell>
            </TableRow>
          ) : (
            alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell className="font-medium">{alert.customerName}</TableCell>
                <TableCell>{alert.deviceName}</TableCell>
                <TableCell>{alert.metricLabel}</TableCell>
                <TableCell>{alert.formattedValue}</TableCell>
                <TableCell>{alert.formattedThreshold}</TableCell>
                <TableCell className="text-sm">{formatDate(alert.timestamp)}</TableCell>
                <TableCell>
                  <Badge className={ALERT_TYPE_STYLES[alert.alertType]}>
                    {ALERT_TYPE_LABELS[alert.alertType]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={alert.status}
                    onValueChange={(value) => { onStatusChange(alert.id, value as Alert["status"]); }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="under_review">En Revisión</SelectItem>
                      <SelectItem value="resolved">Resuelto</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => { onOpenDetail(alert); }}>
                    Detalles
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
