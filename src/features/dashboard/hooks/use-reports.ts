"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  downloadReportAction,
  generateCommercialReportAction,
  generateMonthlyReportAction,
  listReportsAction,
} from "@/features/dashboard/actions/reports.action";

interface ReportsFilters {
  customerId?: string | undefined;
  reportType?: "monthly" | "commercial_adhoc" | undefined;
  searchTerm?: string | undefined;
}

export function useReports(filters: ReportsFilters) {
  return useQuery({
    queryKey: ["reports", filters.customerId, filters.reportType, filters.searchTerm],
    queryFn: () => listReportsAction(filters),
  });
}

function notifyResult(status: "success" | "error", message: string) {
  if (status === "success") {
    toast.success(message);
    return;
  }
  toast.error(message);
}

export function useGenerateMonthlyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateMonthlyReportAction,
    onSuccess: (result) => {
      notifyResult(result.status, result.message);
      if (result.status === "success") {
        void queryClient.invalidateQueries({ queryKey: ["reports"] });
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo generar el reporte mensual");
    },
  });
}

export function useGenerateCommercialReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateCommercialReportAction,
    onSuccess: (result) => {
      notifyResult(result.status, result.message);
      if (result.status === "success") {
        void queryClient.invalidateQueries({ queryKey: ["reports"] });
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo generar el reporte comercial");
    },
  });
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: ({ format, reportId }: { reportId: string; format: "pdf" | "xlsx" }) =>
      downloadReportAction(reportId, format),
    onSuccess: (content, variables) => {
      const extension = variables.format === "pdf" ? "pdf" : "xlsx";
      const mime = variables.format === "pdf" ? "application/pdf" : "text/csv";
      const blob = new Blob([content], { type: mime });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `reporte-${variables.reportId}.${extension}`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      toast.success("Reporte descargado correctamente");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el reporte");
    },
  });
}
