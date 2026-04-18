export const DEFAULT_METRICS = [
  {
    key: "energy_today_kwh",
    label: "Energía de Hoy",
    description: "Alerta si la energía generada en el día es menor al mínimo",
    defaultMin: "1",
    defaultMax: null as string | null,
    hasMax: false,
    unit: "kWh",
    type: "number" as const,
  },
  {
    key: "ac_frequency_hz",
    label: "Frecuencia CA",
    description: "Alerta si la frecuencia sale del rango permitido (54–66 Hz)",
    defaultMin: "54",
    defaultMax: "66" as string | null,
    hasMax: true,
    unit: "Hz",
    type: "number" as const,
  },
  {
    key: "ac_voltage_v",
    label: "Voltaje CA",
    description: "Alerta si el voltaje sale del rango aceptable ±10%",
    defaultMin: "108",
    defaultMax: "132" as string | null,
    hasMax: true,
    unit: "V",
    type: "number" as const,
  },
  {
    key: "device_online",
    label: "Dispositivo en Línea",
    description: "Alerta si el dispositivo pierde conectividad",
    defaultMin: "1",
    defaultMax: null as string | null,
    hasMax: false,
    unit: "",
    type: "boolean" as const,
  },
];

export function getMetricLabel(metricKey: string): string {
  const metric = DEFAULT_METRICS.find((m) => m.key === metricKey);
  return metric?.label ?? metricKey;
}

export function getMetricUnit(metricKey: string): string {
  const metric = DEFAULT_METRICS.find((m) => m.key === metricKey);
  return metric?.unit ?? "";
}

export function formatMetricValue(value: number, metricKey: string): string {
  const unit = getMetricUnit(metricKey);
  const formatted = value.toFixed(2);
  return unit !== "" ? `${formatted} ${unit}` : formatted;
}
