export const DEFAULT_METRICS = [
  {
    key: "energy_today_kwh",
    label: "Energía de Hoy",
    description: "Alerta si la energía generada en el día es menor al mínimo",
    defaultMin: "1",
    unit: "kWh",
    type: "number" as const,
  },
  {
    key: "ac_frequency_hz",
    label: "Frecuencia CA",
    description: "Alerta si la frecuencia de la red eléctrica cae por debajo del mínimo",
    defaultMin: "54",
    unit: "Hz",
    type: "number" as const,
  },
  {
    key: "ac_voltage_v",
    label: "Voltaje CA",
    description: "Alerta si el voltaje de salida cae por debajo del mínimo",
    defaultMin: "108",
    unit: "V",
    type: "number" as const,
  },
  {
    key: "device_online",
    label: "Dispositivo en Línea",
    description: "Alerta si el dispositivo pierde conectividad",
    defaultMin: "1",
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
  return unit ? `${formatted} ${unit}` : formatted;
}
