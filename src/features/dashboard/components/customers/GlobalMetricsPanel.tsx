"use client";

import { HelpCircle } from "lucide-react";
import { useState } from "react";


import { useGlobalMetrics } from "@/features/dashboard/hooks/use-global-metrics";
import { Badge } from "@/shared/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

function fmt(value: number, decimals = 1): string {
  return value.toLocaleString("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

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
    <div className="flex flex-col gap-1 px-4 py-5 border-r border-white/10 last:border-r-0">
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

export function GlobalMetricsPanel() {
  const { data, isLoading } = useGlobalMetrics();

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

  const availabilityVariant =
    data == null || data.snapshotCount === 0
      ? "secondary"
      : data.availabilityPct >= 90
        ? "default"
        : data.availabilityPct >= 60
          ? "secondary"
          : data.onlineDevices === 0
            ? "secondary"
            : "destructive";

  return (
    <div className="rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h2 className="text-white font-semibold text-base">Resumen global</h2>
          <p className="text-white/50 text-xs mt-0.5">
            Todos los clientes · todas las instalaciones
          </p>
        </div>
        <div className="flex items-center gap-3 text-white/50 text-xs">
          {data?.latestSnapshotAt != null && (
            <span>
              Actualizado: {new Date(data.latestSnapshotAt).toLocaleTimeString("es-CO")}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            En vivo · cada 5 min
          </span>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 divide-y sm:divide-y-0 divide-white/10">
        <StatTile
          icon="🗓️"
          label="Energía este mes"
          value={isLoading ? null : `${fmt(data?.energyMonthKwh ?? 0)} kWh`}
          accent="text-orange-300"
          explanation="Suma de la energía generada por todos los paneles solares desde el día 1 del mes hasta hoy. Se expresa en kilovatios-hora (kWh)."
        />
        <StatTile
          icon="⚡"
          label="Energía hoy"
          value={isLoading ? null : `${fmt(data?.energyTodayKwh ?? 0)} kWh`}
          accent="text-yellow-300"
          explanation="Total de energía producida por todos los dispositivos durante el día de hoy, desde medianoche hasta el último reporte recibido."
        />
        <StatTile
          icon="🔋"
          label="Potencia activa"
          value={isLoading ? null : `${fmt(data?.activePowerKw ?? 0)} kW`}
          accent="text-blue-300"
          explanation="Potencia instantánea que están generando ahora mismo todos los dispositivos en línea. Se expresa en kilovatios (kW)."
        />
        <StatTile
          icon="🌿"
          label="Reducción CO₂"
          value={isLoading ? null : `${fmt(data?.co2ReductionKg ?? 0)} kg`}
          accent="text-emerald-300"
          explanation="Kilogramos de CO₂ que no se emitieron gracias a la generación solar, usando el factor de emisión de la red eléctrica colombiana (~0.126 kg CO₂/kWh) multiplicado por la energía del mes."
        />
        <StatTile
          icon="📶"
          label="Disponibilidad"
          value={isLoading ? null : `${fmt(data?.availabilityPct ?? 0)}%`}
          accent="text-white"
          explanation={
            <>
              Porcentaje de dispositivos que reportaron datos recientemente.
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
                <Badge variant={availabilityVariant} className="text-xs py-0 h-5">
                  {availabilityLabel}
                </Badge>
              </div>
            ) : undefined
          }
        />
        <StatTile
          icon="🖥️"
          label="Dispositivos"
          value={isLoading ? null : String(data?.totalDevices ?? 0)}
          accent="text-violet-300"
          explanation='Número total de inversores y microinversores registrados en el sistema. Los que reportan datos recientes se cuentan como "en línea".'
          sub={
            data != null ? (
              <span className="text-white/50 text-xs">{data.onlineDevices} en línea</span>
            ) : undefined
          }
        />
        <StatTile
          icon="👥"
          label="Clientes"
          value={isLoading ? null : String(data?.totalCustomers ?? 0)}
          accent="text-sky-300"
          explanation="Número total de clientes activos con instalaciones solares registradas en la plataforma."
        />
      </div>
    </div>
  );
}
