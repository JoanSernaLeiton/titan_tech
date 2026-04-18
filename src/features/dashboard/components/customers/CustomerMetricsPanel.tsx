"use client";

import { HelpCircle } from "lucide-react";
import { useState } from "react";


import { useCustomerMetrics } from "@/features/dashboard/hooks/use-customer-metrics";
import { Badge } from "@/shared/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { SelectCustomerAgreementVariable } from "@/shared/db/customer-agreement-variables.schema";

interface CustomerMetricsPanelProps {
  customerId: string;
  agreementVariables: SelectCustomerAgreementVariable[];
}

function fmt(value: number, decimals = 1): string {
  return value.toLocaleString("es-CO", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCurrency(value: number, unit: string): string {
  if (unit === "COP") {
    return `$${value.toLocaleString("es-CO", { maximumFractionDigits: 0 })} COP`;
  }
  return `${fmt(value)} ${unit}`;
}

type DeviceTypeFilter = "all" | "inverter" | "micro_inverter";
type ProviderFilter = "all" | "growatt" | "huawei" | "deye";

interface StatTileProps {
  icon: string;
  label: string;
  value: string | null;
  sub?: React.ReactNode;
  accent?: string;
  explanation?: React.ReactNode;
}

function StatTile({ icon, label, value, sub, accent = "text-white", explanation }: StatTileProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1 px-4 py-5">
      <div className="flex items-center gap-1.5 text-white/60 text-xs font-medium uppercase tracking-wide overflow-hidden h-8">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
        {explanation != null && (
          <button
            onClick={() => { setOpen(true); }}
            className="ml-auto shrink-0 text-white/40 hover:text-white/80 transition-colors"
            aria-label={`¿Cómo se calcula ${label}?`}
          >
            <HelpCircle className="size-3.5" />
          </button>
        )}
      </div>
      <div className={`text-2xl font-bold leading-tight whitespace-nowrap ${accent}`}>
        {value ?? <span className="animate-pulse text-white/30 text-2xl">···</span>}
      </div>
      {sub != null && <div className="mt-0.5">{sub}</div>}
      {explanation != null && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>{icon}</span> {label}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription asChild>
              <div className="text-sm leading-relaxed">{explanation}</div>
            </DialogDescription>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export function CustomerMetricsPanel({
  customerId,
  agreementVariables,
}: CustomerMetricsPanelProps) {
  const [deviceType, setDeviceType] = useState<DeviceTypeFilter>("all");
  const [provider, setProvider] = useState<ProviderFilter>("all");

  const filters = {
    ...(deviceType !== "all" ? { deviceType } : {}),
    ...(provider !== "all" ? { providerSlug: provider } : {}),
  };

  const { data, isLoading } = useCustomerMetrics(customerId, filters);

  const hasTargets = agreementVariables.some((v) => v.enabled);

  const availabilityColor =
    data == null || data.snapshotCount === 0
      ? "secondary"
      : data.availabilityPct >= 90
        ? "default"
        : data.availabilityPct >= 60
          ? "secondary"
          : data.onlineDevices === 0
            ? "secondary"
            : "destructive";

  const availabilityLabel =
    data == null || data.snapshotCount === 0
      ? "Sin datos"
      : data.availabilityPct >= 90
        ? "Óptimo"
        : data.availabilityPct >= 60
          ? "Parcial"
          : data.onlineDevices === 0
            ? "Inactivo"
            : "Crítico";

  return (
    <div className="rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-wrap gap-3">
        <div>
          <h2 className="text-white font-semibold text-base">Métricas en tiempo real</h2>
          {data?.latestSnapshotAt != null && (
            <p className="text-white/50 text-xs mt-0.5">
              Actualizado: {new Date(data.latestSnapshotAt).toLocaleTimeString("es-CO")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select
            value={deviceType}
            onValueChange={(v) => { setDeviceType(v as DeviceTypeFilter); }}
          >
            <SelectTrigger className="w-44 border-white/20 bg-white/10 text-white text-xs h-8 hover:bg-white/20 focus:ring-white/20">
              <SelectValue placeholder="Tipo de dispositivo" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/10 text-white">
              <SelectItem value="all" className="text-white/80 focus:bg-white/10 focus:text-white">Todos los tipos</SelectItem>
              <SelectItem value="inverter" className="text-white/80 focus:bg-white/10 focus:text-white">Inversor</SelectItem>
              <SelectItem value="micro_inverter" className="text-white/80 focus:bg-white/10 focus:text-white">Microinversor</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={provider}
            onValueChange={(v) => { setProvider(v as ProviderFilter); }}
          >
            <SelectTrigger className="w-36 border-white/20 bg-white/10 text-white text-xs h-8 hover:bg-white/20 focus:ring-white/20">
              <SelectValue placeholder="Proveedor" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/10 text-white">
              <SelectItem value="all" className="text-white/80 focus:bg-white/10 focus:text-white">Todos</SelectItem>
              <SelectItem value="growatt" className="text-white/80 focus:bg-white/10 focus:text-white">Growatt</SelectItem>
              <SelectItem value="huawei" className="text-white/80 focus:bg-white/10 focus:text-white">Huawei</SelectItem>
              <SelectItem value="deye" className="text-white/80 focus:bg-white/10 focus:text-white">DeyeCloud</SelectItem>
            </SelectContent>
          </Select>

          <span className="inline-flex items-center gap-1.5 text-white/50 text-xs">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            En vivo · cada 5 min
          </span>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y divide-white/10 lg:divide-y-0 lg:divide-x">
        <StatTile
          icon="🗓️"
          label="Energía este mes"
          value={isLoading ? null : `${fmt(data?.energyMonthKwh ?? 0)} kWh`}
          sub={<span className="text-white/40 text-xs">Acumulado mensual</span>}
          accent="text-orange-300"
          explanation="Energía total generada por las instalaciones de este cliente desde el día 1 del mes hasta hoy. Acumula los reportes de todos sus dispositivos."
        />

        <StatTile
          icon="⚡"
          label="Energía ahorrada"
          value={isLoading ? null : `${fmt(data?.energySavedKwh ?? 0)} kWh`}
          sub={<span className="text-white/40 text-xs">Hoy</span>}
          accent="text-yellow-300"
          explanation="Energía generada hoy por las instalaciones — equivale a la energía que no fue necesario comprar a la red eléctrica durante el día."
        />

        <StatTile
          icon="💰"
          label="Dinero ahorrado"
          value={
            isLoading
              ? null
              : fmtCurrency(data?.moneySaved ?? 0, data?.moneyUnit ?? "COP")
          }
          sub={<span className="text-white/40 text-xs">Hoy</span>}
          accent="text-emerald-300"
          explanation={
            <>
              Ahorro económico del día.
              <br />
              <br />
              <strong>Fórmula:</strong> kWh generados hoy × tarifa pactada en el acuerdo del cliente ($/kWh). Requiere que la tarifa esté configurada en el acuerdo.
            </>
          }
        />

        <StatTile
          icon="📶"
          label="Disponibilidad"
          value={isLoading ? null : `${fmt(data?.availabilityPct ?? 0)}%`}
          accent="text-white"
          explanation={
            <>
              Porcentaje de dispositivos de este cliente que reportaron datos recientemente.
              <br />
              <br />
              <strong>Fórmula:</strong> (dispositivos en línea ÷ total de dispositivos) × 100.
            </>
          }
          sub={
            data != null ? (
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-xs">
                  {data.onlineDevices}/{data.totalDevices} disp.
                </span>
                <Badge variant={availabilityColor} className="text-xs py-0 h-5">
                  {availabilityLabel}
                </Badge>
              </div>
            ) : undefined
          }
        />

        <StatTile
          icon="📊"
          label="Performance ratio"
          value={
            isLoading
              ? null
              : data?.performanceRatioPct != null
                ? `${fmt(data.performanceRatioPct)}%`
                : "—"
          }
          sub={
            <span className="text-white/40 text-xs">
              {data?.performanceRatioPct == null && !isLoading
                ? "Configure meta mensual"
                : "vs. meta diaria"}
            </span>
          }
          accent="text-blue-300"
          explanation={
            <>
              Qué tan cerca estuvo la producción real de la meta diaria.
              <br />
              <br />
              <strong>Fórmula:</strong> (kWh generados hoy ÷ meta diaria configurada) × 100. Requiere configurar la meta mensual en el acuerdo del cliente.
            </>
          }
        />

        <StatTile
          icon="🌿"
          label="Reducción CO₂"
          value={isLoading ? null : `${fmt(data?.co2ReductionKg ?? 0)} kg`}
          sub={<span className="text-white/40 text-xs">Hoy</span>}
          accent="text-teal-300"
          explanation="Kilogramos de CO₂ evitados hoy gracias a la generación solar. Fórmula: kWh generados hoy × factor de emisión (~0.126 kg CO₂/kWh) de la red eléctrica colombiana."
        />
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between gap-4">
        {!hasTargets && (
          <p className="text-white/40 text-xs">
            Configure las variables de acuerdo para ver dinero ahorrado, performance ratio y CO₂ calculados con precisión.
          </p>
        )}
        <span className="text-white/40 text-xs ml-auto shrink-0">
          Potencia activa: {isLoading ? "…" : `${fmt(data?.activePowerKw ?? 0)} kW`}
        </span>
      </div>
    </div>
  );
}
