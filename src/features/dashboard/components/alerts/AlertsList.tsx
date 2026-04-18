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

interface AlertsListProps {
  alerts: Alert[];
  onStatusChange: (id: string, status: Alert["status"]) => void;
}

export function AlertsList({ alerts, onStatusChange }: AlertsListProps) {
  const getAlertTypeColor = (type: Alert["alertType"]) => {
    switch (type) {
      case "threshold_breach":
        return "border-warning/30 bg-warning/15 text-warning";
      case "agreement_breach":
        return "border-destructive/30 bg-destructive/10 text-destructive";
      default:
        return "border-border bg-muted text-muted-foreground";
    }
  };

  const getAlertTypeLabel = (type: Alert["alertType"]) => {
    switch (type) {
      case "threshold_breach":
        return "Violación de Umbral";
      case "agreement_breach":
        return "Violación de Acuerdo";
      default:
        return "Desconocido";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card/90 shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Dispositivo</TableHead>
            <TableHead>Métrica</TableHead>
            <TableHead>Valor Detectado</TableHead>
            <TableHead>Umbral</TableHead>
            <TableHead>Fecha y Hora</TableHead>
            <TableHead>Tipo de Alerta</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                No se encontraron alertas.
              </TableCell>
            </TableRow>
          ) : (
            alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell className="font-medium">
                  {alert.customerName}
                </TableCell>
                <TableCell>{alert.deviceName}</TableCell>
                <TableCell>{alert.metric}</TableCell>
                <TableCell>{alert.triggeredValue.toFixed(2)}</TableCell>
                <TableCell>{alert.threshold.toFixed(2)}</TableCell>
                <TableCell className="text-sm">
                  {formatDate(alert.timestamp)}
                </TableCell>
                <TableCell>
                  <Badge className={getAlertTypeColor(alert.alertType)}>
                    {getAlertTypeLabel(alert.alertType)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={alert.status}
                    onValueChange={(value) => {
                      onStatusChange(alert.id, value as Alert["status"]);
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="under_review">
                        En Revisión
                      </SelectItem>
                      <SelectItem value="resolved">Resuelto</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
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
