"use client";

import { Calendar } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

export type DateRangePreset =
  | "today"
  | "last_7"
  | "last_30"
  | "this_month"
  | "this_year"
  | "last_year"
  | "custom";

export interface DateRangeValue {
  from: string;
  to: string;
  preset: DateRangePreset;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

const PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: "today", label: "Hoy" },
  { key: "last_7", label: "Últimos 7 días" },
  { key: "last_30", label: "Últimos 30 días" },
  { key: "this_month", label: "Este mes" },
  { key: "this_year", label: "Este año" },
  { key: "last_year", label: "Último año" },
];

function toYmd(date: Date): string {
  const yyyy = date.getFullYear().toString().padStart(4, "0");
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function presetToRange(preset: DateRangePreset): DateRangeValue {
  const now = new Date();
  const to = toYmd(now);

  if (preset === "today") {
    return { from: to, to, preset };
  }
  if (preset === "last_7") {
    const from = new Date(now);
    from.setDate(now.getDate() - 6);
    return { from: toYmd(from), to, preset };
  }
  if (preset === "last_30") {
    const from = new Date(now);
    from.setDate(now.getDate() - 29);
    return { from: toYmd(from), to, preset };
  }
  if (preset === "this_month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toYmd(from), to, preset };
  }
  if (preset === "this_year") {
    const from = new Date(now.getFullYear(), 0, 1);
    return { from: toYmd(from), to, preset };
  }
  if (preset === "last_year") {
    const from = new Date(now);
    from.setFullYear(now.getFullYear() - 1);
    return { from: toYmd(from), to, preset };
  }
  return { from: to, to, preset: "custom" };
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const handlePreset = (preset: DateRangePreset) => {
    onChange(presetToRange(preset));
  };

  const handleFromChange = (from: string) => {
    onChange({ from, to: value.to, preset: "custom" });
  };

  const handleToChange = (to: string) => {
    onChange({ from: value.from, to, preset: "custom" });
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/90 p-4 shadow-xs">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Calendar className="size-4 text-primary" />
        <span>Rango de fechas</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.key}
            type="button"
            size="sm"
            variant={value.preset === preset.key ? "default" : "outline"}
            onClick={() => { handlePreset(preset.key); }}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <Label htmlFor="date-from" className="text-xs text-muted-foreground">
            Desde
          </Label>
          <Input
            id="date-from"
            type="date"
            value={value.from}
            max={value.to}
            onChange={(event) => { handleFromChange(event.target.value); }}
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor="date-to" className="text-xs text-muted-foreground">
            Hasta
          </Label>
          <Input
            id="date-to"
            type="date"
            value={value.to}
            min={value.from}
            onChange={(event) => { handleToChange(event.target.value); }}
          />
        </div>
      </div>
    </div>
  );
}
