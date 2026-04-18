import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import type { SelectCustomerDevice } from "@/shared/db/customer-devices.schema";

interface DevicesListProps {
  devices: SelectCustomerDevice[];
  providerNames?: Record<string, string>;
  onEdit: (device: SelectCustomerDevice) => void;
  onDelete: (id: string) => void;
}

export function DevicesList({
  devices,
  providerNames = {},
  onEdit,
  onDelete,
}: DevicesListProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre del Dispositivo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>ID Externo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No se encontraron dispositivos. Agrega uno para empezar.
              </TableCell>
            </TableRow>
          ) : (
            devices.map((device) => (
              <TableRow key={device.id}>
                <TableCell className="font-medium">{device.deviceName}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {device.deviceType === "inverter" ? "Inversor" : "Micro-Inversor"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {providerNames[device.providerId] ?? "Desconocido"}
                </TableCell>
                <TableCell>{device.externalId}</TableCell>
                <TableCell>
                  <Badge variant={device.isEnabled ? "default" : "secondary"}>
                    {device.isEnabled ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { onEdit(device); }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => { onDelete(device.id); }}
                  >
                    Eliminar
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
