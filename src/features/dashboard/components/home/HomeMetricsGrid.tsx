"use client";

import type { HomeMetricsSummary } from "@/features/dashboard/actions/home-metrics.action";
import type { MetricKey } from "@/features/dashboard/lib/home-filters";
import { Badge } from "@/shared/components/ui/badge";

function fmt(value: number, decimals = 1): string {
  return value.toLocaleString("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtCop(value: number): string {
  return value.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

interface StatTileProps {
  icon: string;
  label: string;
  value: string | null;
  sub?: React.ReactNode;
  accent?: string;
}

function StatTile({ icon, label, value, sub, accent = "text-white" }: StatTileProps) {
  return (
    <div className="flex flex-col gap-1 px-4 py-5 border-r border-white/10 last:border-r-0">
      <div className="flex items-center gap-1.5 text-white/60 text-xs font-medium uppercase tracking-wide">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className={`text-2xl font-bold leading-tight whitespace-nowrap ${accent}`}>
        {value ?? <span className="animate-pulse text-white/30">···</span>}
      </div>
      {sub != null && <div className="mt-0.5">{sub}</div>}
    </div>
  );
}

interface HomeMetricsGridProps {
  data: HomeMetricsSummary | undefined;
  isLoading: boolean;
  rangeLabel: string;
  visibleMetrics?: ReadonlySet<MetricKey>;
}

export function HomeMetricsGrid({
  data,
  isLoading,
  rangeLabel,
  visibleMetrics,
}: HomeMetricsGridProps) {
  const isVisible = (key: MetricKey): boolean =>
    visibleMetrics == null || visibleMetrics.has(key);

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

  const availabilityVariant: "default" | "secondary" | "destructive" =
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
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h2 className="text-white font-semibold text-base">Resumen por rango</h2>
          <p className="text-white/50 text-xs mt-0.5">
            {rangeLabel} · filtros aplicados
          </p>
        </div>
        <div className="flex items-center gap-3 text-white/50 text-xs">
          {data?.latestSnapshotAt != null && (
            <span>
              Último dato: {new Date(data.latestSnapshotAt).toLocaleString("es-CO")}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Auto-refresh 3 min
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 divide-white/10">
        {isVisible("energy") && (
          <StatTile
            icon="⚡"
            label="Energía generada"
            value={isLoading ? null : `${fmt(data?.energyRangeKwh ?? 0)} kWh`}
            accent="text-yellow-300"
          />
        )}
        {isVisible("energy") && (
          <StatTile
            icon="💰"
            label="Dinero ahorrado"
            value={isLoading ? null : fmtCop(data?.moneySavedCop ?? 0)}
            accent="text-emerald-300"
          />
        )}
        {isVisible("energy") && (
          <StatTile
            icon="🌿"
            label="CO₂ mitigado"
            value={isLoading ? null : `${fmt(data?.co2ReductionKg ?? 0)} kg`}
            accent="text-teal-300"
          />
        )}
        {isVisible("power") && (
          <StatTile
            icon="🔋"
            label="Potencia actual"
            value={isLoading ? null : `${fmt(data?.activePowerKw ?? 0)} kW`}
            accent="text-blue-300"
          />
        )}
        {isVisible("performance_ratio") && (
          <StatTile
            icon="📊"
            label="Performance Ratio"
            value={isLoading ? null : `${fmt(data?.averagePerformanceRatioPct ?? 0)}%`}
            accent="text-violet-300"
          />
        )}
        {isVisible("status") && (
          <StatTile
            icon="📶"
            label="Disponibilidad"
            value={isLoading ? null : `${fmt(data?.availabilityPct ?? 0)}%`}
            accent="text-sky-300"
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
        )}
        <StatTile
          icon="🖥️"
          label="Dispositivos"
          value={isLoading ? null : String(data?.totalDevices ?? 0)}
          accent="text-orange-300"
          sub={
            data != null ? (
              <span className="text-white/50 text-xs">
                {data.totalCustomers} {data.totalCustomers === 1 ? "cliente" : "clientes"}
              </span>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
