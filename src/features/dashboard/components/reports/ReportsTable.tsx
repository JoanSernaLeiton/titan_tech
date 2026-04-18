"use client";

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

interface ReportRow {
  id: string;
  customerName: string;
  reportType: "monthly" | "commercial_adhoc";
  status: "pending" | "ready" | "partial" | "failed";
  periodYear: number;
  periodMonth: number;
  createdAt: Date;
  warningsCount: number;
}

interface ReportsTableProps {
  rows: ReportRow[];
  isDownloading: boolean;
  onDownload: (reportId: string, format: "pdf" | "xlsx") => void;
}

function statusVariant(status: ReportRow["status"]): "default" | "secondary" | "destructive" {
  if (status === "failed") {
    return "destructive";
  }
  if (status === "partial") {
    return "secondary";
  }
  return "default";
}

function typeLabel(type: ReportRow["reportType"]): string {
  return type === "monthly" ? "Mensual" : "Ad-hoc comercial";
}

function formatPeriod(month: number, year: number): string {
  return `${month.toString().padStart(2, "0")}/${String(year)}`;
}

export function ReportsTable({ rows, isDownloading, onDownload }: ReportsTableProps) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/90 shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Periodo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Advertencias</TableHead>
            <TableHead>Generado</TableHead>
            <TableHead>Descargas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No hay reportes para los filtros seleccionados.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.customerName}</TableCell>
                <TableCell>{typeLabel(row.reportType)}</TableCell>
                <TableCell>{formatPeriod(row.periodMonth, row.periodYear)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                </TableCell>
                <TableCell>{row.warningsCount}</TableCell>
                <TableCell>{row.createdAt.toLocaleString("es-CO")}</TableCell>
                <TableCell className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isDownloading}
                    onClick={() => {
                      onDownload(row.id, "pdf");
                    }}
                  >
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isDownloading}
                    onClick={() => {
                      onDownload(row.id, "xlsx");
                    }}
                  >
                    XLSX
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
