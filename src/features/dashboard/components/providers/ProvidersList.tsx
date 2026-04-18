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
import type { SelectProvider } from "@/shared/db/providers.schema";

interface ProvidersListProps {
  providers: SelectProvider[];
  onEdit: (provider: SelectProvider) => void;
  onDelete: (id: string) => void;
}

export function ProvidersList({
  providers,
  onEdit,
  onDelete,
}: ProvidersListProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre a Mostrar</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Intervalo de Sondeo (min)</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No se encontraron proveedores. Agrega uno para empezar.
              </TableCell>
            </TableRow>
          ) : (
            providers.map((provider) => (
              <TableRow key={provider.id}>
                <TableCell className="font-medium">
                  {provider.displayName}
                </TableCell>
                <TableCell>{provider.slug}</TableCell>
                <TableCell>{provider.pollingIntervalMinutes}</TableCell>
                <TableCell>
                  <Badge
                    variant={provider.isEnabled ? "default" : "secondary"}
                  >
                    {provider.isEnabled ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { onEdit(provider); }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => { onDelete(provider.id); }}
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
