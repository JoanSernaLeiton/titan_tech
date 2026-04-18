"use client";

import Link from "next/link";

import type { MetricKey } from "@/features/dashboard/lib/home-filters";
import type { DeviceMetricsRow } from "@/features/dashboard/queries/home-metrics.queries";
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

function fmt(value: number, decimals = 1): string {
  return value.toLocaleString("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function deviceTypeLabel(type: DeviceMetricsRow["deviceType"]): string {
  return type === "inverter" ? "Inversor" : "Micro-inversor";
}

function formatDateTime(value: Date | null): string {
  if (value == null) return "Sin datos";
  return new Date(value).toLocaleString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface DevicesMetricsTableProps {
  rows: DeviceMetricsRow[];
  visibleMetrics?: ReadonlySet<MetricKey>;
}

export function DevicesMetricsTable({
  rows,
  visibleMetrics,
}: DevicesMetricsTableProps) {
  const isVisible = (key: MetricKey): boolean =>
    visibleMetrics == null || visibleMetrics.has(key);

  const showStatus = isVisible("status");
  const showEnergy = isVisible("energy");
  const showPower = isVisible("power");
  const showPR = isVisible("performance_ratio");

  const baseColumns = 5; // cliente, dispositivo, tipo, proveedor, último reporte
  const actionColumn = 1;
  const metricColumns =
    (showStatus ? 1 : 0) + (showEnergy ? 1 : 0) + (showPower ? 1 : 0) + (showPR ? 1 : 0);
  const colSpan = baseColumns + metricColumns + actionColumn;

  return (
    <div className="rounded-xl border border-border/70 bg-card/90 shadow-xs overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Dispositivo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Proveedor</TableHead>
            {showStatus && <TableHead>Estado</TableHead>}
            {showEnergy && <TableHead className="text-right">Energía (rango)</TableHead>}
            {showPower && <TableHead className="text-right">Potencia actual</TableHead>}
            {showPR && <TableHead className="text-right">PR</TableHead>}
            <TableHead>Último reporte</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
                No se encontraron dispositivos para los filtros seleccionados.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.deviceId}>
                <TableCell className="font-medium">{row.customerName}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{row.deviceName}</span>
                    <span className="text-xs text-muted-foreground">
                      ID: {row.externalId}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{deviceTypeLabel(row.deviceType)}</Badge>
                </TableCell>
                <TableCell>{row.providerName}</TableCell>
                {showStatus && (
                  <TableCell>
                    <Badge variant={row.isOnline ? "default" : "destructive"}>
                      {row.isOnline ? "En línea" : "Fuera de línea"}
                    </Badge>
                  </TableCell>
                )}
                {showEnergy && (
                  <TableCell className="text-right font-medium">
                    {fmt(row.energyRangeKwh)} kWh
                  </TableCell>
                )}
                {showPower && (
                  <TableCell className="text-right">
                    {row.latestActivePowerKw != null
                      ? `${fmt(row.latestActivePowerKw)} kW`
                      : "—"}
                  </TableCell>
                )}
                {showPR && (
                  <TableCell className="text-right">
                    {row.latestPerformanceRatioPct != null
                      ? `${fmt(row.latestPerformanceRatioPct)}%`
                      : "—"}
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground text-xs">
                  {formatDateTime(row.latestSnapshotAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/dashboard/customers/${row.customerId}`}>
                    <Button variant="outline" size="sm">
                      Ver cliente
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
