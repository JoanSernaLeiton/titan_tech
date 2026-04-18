"use client";

import type { DailyEnergyPoint } from "@/features/dashboard/queries/home-metrics.queries";

function fmtKwh(value: number): string {
  return value.toLocaleString("es-CO", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function fmtDate(ymd: string): string {
  return new Date(`${ymd}T00:00:00`).toLocaleDateString("es-CO", {
    month: "short",
    day: "numeric",
  });
}

function fmtFullDate(ymd: string): string {
  return new Date(`${ymd}T00:00:00`).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface EnergyTrendChartProps {
  data: DailyEnergyPoint[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function EnergyTrendChart({ data, isLoading, isError }: EnergyTrendChartProps) {
  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        No se pudo cargar la tendencia de energía.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/70 bg-card/90 p-6 shadow-xs">
        <div className="h-5 w-40 bg-muted/60 rounded animate-pulse mb-4" />
        <div className="flex items-end gap-1 h-48">
          {Array.from({ length: 14 }).map((_, i) => {
            const height = 30 + ((i * 17) % 60);
            return (
              <div
                key={i}
                className="flex-1 bg-muted/60 rounded-t animate-pulse"
                style={{ height: `${String(height)}%` }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  const points = data ?? [];

  if (points.length === 0) {
    return (
      <div className="rounded-xl border border-border/70 bg-card/90 p-6 shadow-xs text-sm text-muted-foreground">
        Sin datos de energía en el rango seleccionado.
      </div>
    );
  }

  const maxEnergy = points.reduce((acc, p) => (p.energyKwh > acc ? p.energyKwh : acc), 0);
  const totalEnergy = points.reduce((acc, p) => acc + p.energyKwh, 0);
  const avgEnergy = totalEnergy / points.length;
  const peakPoint = points.reduce<DailyEnergyPoint | null>(
    (best, p) => (best == null || p.energyKwh > best.energyKwh ? p : best),
    null
  );

  return (
    <div className="rounded-xl border border-border/70 bg-card/90 p-6 shadow-xs">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">Energía generada por día</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Suma diaria en kWh · {points.length} {points.length === 1 ? "día" : "días"} con datos
          </p>
        </div>
        <div className="flex gap-4 text-xs">
          <div>
            <div className="text-muted-foreground">Total</div>
            <div className="font-semibold text-foreground">{fmtKwh(totalEnergy)} kWh</div>
          </div>
          <div>
            <div className="text-muted-foreground">Promedio</div>
            <div className="font-semibold text-foreground">{fmtKwh(avgEnergy)} kWh</div>
          </div>
          <div>
            <div className="text-muted-foreground">Pico</div>
            <div className="font-semibold text-emerald-600">
              {fmtKwh(peakPoint?.energyKwh ?? 0)} kWh
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-end gap-1 h-48 border-b border-border/60">
        {points.map((p) => {
          const heightPct = maxEnergy > 0 ? (p.energyKwh / maxEnergy) * 100 : 0;
          const isPeak = p.date === peakPoint?.date;
          const heightStyle = `${String(Math.max(heightPct, 2))}%`;
          return (
            <div
              key={p.date}
              className="relative flex-1 group flex items-end justify-center min-w-[4px] h-full"
            >
              <div
                className={`w-full rounded-t transition-colors ${
                  isPeak
                    ? "bg-emerald-500 group-hover:bg-emerald-600"
                    : "bg-sky-400/70 group-hover:bg-sky-500"
                }`}
                style={{ height: heightStyle }}
              />
              <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10">
                <div className="font-medium">{fmtFullDate(p.date)}</div>
                <div>{fmtKwh(p.energyKwh)} kWh · {p.deviceCount} disp.</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground mt-2 overflow-hidden">
        {points.length <= 14 ? (
          points.map((p) => (
            <span key={p.date} className="flex-1 text-center truncate">
              {fmtDate(p.date)}
            </span>
          ))
        ) : (
          <>
            <span>{fmtDate(points[0]?.date ?? "")}</span>
            <span>{fmtDate(points[Math.floor(points.length / 2)]?.date ?? "")}</span>
            <span>{fmtDate(points[points.length - 1]?.date ?? "")}</span>
          </>
        )}
      </div>
    </div>
  );
}
