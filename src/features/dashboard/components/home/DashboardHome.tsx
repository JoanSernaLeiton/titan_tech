"use client";

import { useMemo, useState } from "react";

import { DashboardPageShell } from "../layout/DashboardPageShell";
import { LoadingState, PageState } from "../layout/PageState";

import { DateRangePicker, presetToRange, type DateRangeValue } from "./DateRangePicker";
import { DevicesMetricsTable } from "./DevicesMetricsTable";
import { EnergyTrendChart } from "./EnergyTrendChart";
import { HomeFilterBar } from "./HomeFilterBar";
import { HomeMetricsGrid } from "./HomeMetricsGrid";

import {
  useDailyEnergy,
  useDevicesWithMetrics,
} from "@/features/dashboard/hooks/use-home-metrics";
import {
  computeSummary,
  DEFAULT_FILTERS,
  filterRows,
  type HomeFilters,
} from "@/features/dashboard/lib/home-filters";

function buildRangeLabel(value: DateRangeValue): string {
  const fmt = (ymd: string) =>
    new Date(`${ymd}T00:00:00`).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  return `${fmt(value.from)} — ${fmt(value.to)}`;
}

function toIsoRange(value: DateRangeValue): { from: string; to: string } {
  const from = new Date(`${value.from}T00:00:00`).toISOString();
  const to = new Date(`${value.to}T23:59:59.999`).toISOString();
  return { from, to };
}

export function DashboardHome() {
  const [range, setRange] = useState<DateRangeValue>(() => presetToRange("last_30"));
  const [filters, setFilters] = useState<HomeFilters>(DEFAULT_FILTERS);

  const isoRange = useMemo(() => toIsoRange(range), [range]);

  const {
    data: rows = [],
    isPending,
    isError,
  } = useDevicesWithMetrics(isoRange);

  const {
    data: dailyEnergy,
    isPending: isDailyPending,
    isError: isDailyError,
  } = useDailyEnergy(isoRange);

  const filteredRows = useMemo(() => filterRows(rows, filters), [rows, filters]);
  const summary = useMemo(() => computeSummary(filteredRows), [filteredRows]);
  const rangeLabel = buildRangeLabel(range);
  const showEnergyChart = filters.metrics.has("energy");

  return (
    <DashboardPageShell
      title="Vista General"
      description="Monitoreo consolidado de todos los clientes e instalaciones solares."
    >
      <DateRangePicker value={range} onChange={setRange} />

      {isError ? (
        <PageState
          tone="error"
          message="No se pudieron cargar los datos. Por favor, intenta de nuevo."
        />
      ) : isPending ? (
        <LoadingState message="Cargando datos..." />
      ) : (
        <>
          <HomeFilterBar
            filters={filters}
            onFiltersChange={setFilters}
            allRows={rows}
            filteredCount={filteredRows.length}
          />
          <HomeMetricsGrid
            data={summary}
            isLoading={false}
            rangeLabel={rangeLabel}
            visibleMetrics={filters.metrics}
          />
          {showEnergyChart && (
            <EnergyTrendChart
              data={dailyEnergy}
              isLoading={isDailyPending}
              isError={isDailyError}
            />
          )}
          <DevicesMetricsTable rows={filteredRows} visibleMetrics={filters.metrics} />
        </>
      )}
    </DashboardPageShell>
  );
}
