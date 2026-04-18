"use client";

import { useMemo, useState } from "react";

import { ReportsTable } from "./ReportsTable";

import { useCustomerDevices } from "@/features/dashboard/hooks/use-customer-devices";
import { useCustomers } from "@/features/dashboard/hooks/use-customers";
import {
  useDownloadReport,
  useGenerateCommercialReport,
  useGenerateMonthlyReport,
  useReports,
} from "@/features/dashboard/hooks/use-reports";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Spinner } from "@/shared/components/ui/spinner";

function currentMonth(): string {
  return String(new Date().getMonth() + 1);
}

function currentYear(): string {
  return String(new Date().getFullYear());
}

export function ReportsPlaceholder() {
  const [customerId, setCustomerId] = useState("");
  const [reportType, setReportType] = useState<"monthly" | "commercial_adhoc" | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const filters = useMemo(
    () => ({
      customerId: customerId === "" ? undefined : customerId,
      reportType: reportType === "all" ? undefined : reportType,
      searchTerm: searchTerm === "" ? undefined : searchTerm,
    }),
    [customerId, reportType, searchTerm]
  );

  const { data: customers = [] } = useCustomers();
  const { data: customerDevices = [] } = useCustomerDevices(customerId);
  const { data: reports = [], isPending, isError } = useReports(filters);
  const monthlyMutation = useGenerateMonthlyReport();
  const commercialMutation = useGenerateCommercialReport();
  const downloadMutation = useDownloadReport();

  const handleGenerateMonthly = () => {
    if (customerId === "") {
      return;
    }
    const parsedMonth = Number(month);
    const parsedYear = Number(year);
    if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return;
    }
    if (!Number.isInteger(parsedYear) || parsedYear < 2020 || parsedYear > 2100) {
      return;
    }
    monthlyMutation.mutate({
      customerId,
      month: parsedMonth,
      year: parsedYear,
    });
  };

  const handleGenerateCommercial = () => {
    if (customerId === "") {
      return;
    }
    const projectIds = customerDevices.slice(0, 2).map((device) => device.id);
    commercialMutation.mutate({
      customerId,
      projectIds,
    });
  };

  if (isError) {
    return (
      <div className="p-8 space-y-6">
        <h1 className="text-3xl font-bold">Reportes</h1>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">No se pudieron cargar los reportes. Intenta nuevamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reportes</h1>
        <p className="text-muted-foreground mt-2">
          Genera reportes mensuales para clientes y ad-hoc comercial con exportacion PDF/XLSX.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generacion de Reportes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona cliente" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            min={1}
            max={12}
            type="number"
            value={month}
            onChange={(event) => {
              setMonth(event.target.value);
            }}
            placeholder="Mes"
          />

          <Input
            min={2020}
            max={2100}
            type="number"
            value={year}
            onChange={(event) => {
              setYear(event.target.value);
            }}
            placeholder="Año"
          />

          <div className="flex gap-2">
            <Button
              disabled={monthlyMutation.isPending || customerId === ""}
              onClick={handleGenerateMonthly}
            >
              Generar mensual
            </Button>
            <Button
              variant="outline"
              disabled={commercialMutation.isPending || customerDevices.length < 2}
              onClick={handleGenerateCommercial}
            >
              Generar ad-hoc
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Reportes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
              }}
              placeholder="Buscar por cliente"
            />
            <Select
              value={reportType}
              onValueChange={(value) => {
                setReportType(value as "all" | "monthly" | "commercial_adhoc");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de reporte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="commercial_adhoc">Ad-hoc comercial</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground self-center">{reports.length} resultados</div>
          </div>

          {isPending ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <ReportsTable
              rows={reports}
              isDownloading={downloadMutation.isPending}
              onDownload={(reportId, format) => {
                downloadMutation.mutate({ reportId, format });
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
