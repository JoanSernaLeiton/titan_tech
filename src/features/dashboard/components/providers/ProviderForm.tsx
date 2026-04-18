"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import type { InsertProvider, SelectProvider } from "@/shared/db/providers.schema";

const providerFormSchema = z.object({
  displayName: z.string().min(1, "El nombre a mostrar es obligatorio"),
  slug: z.string().min(1, "El slug es obligatorio"),
  pollingIntervalMinutes: z.number().min(1, "Debe ser al menos 1 minuto"),
  isEnabled: z.boolean().default(true),
  metricMappings: z.string().refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    "Debe ser JSON válido"
  ),
});

type ProviderFormData = z.infer<typeof providerFormSchema>;

interface ProviderFormProps {
  provider?: SelectProvider | undefined;
  onSubmit: (data: Omit<InsertProvider, "id" | "createdAt">) => void;
  onCancel: () => void;
}

export function ProviderForm({
  provider,
  onSubmit,
  onCancel,
}: ProviderFormProps) {
  const form = useForm<ProviderFormData>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: provider != null
      ? {
          displayName: provider.displayName,
          slug: provider.slug,
          pollingIntervalMinutes: provider.pollingIntervalMinutes,
          isEnabled: provider.isEnabled,
          metricMappings: JSON.stringify(provider.metricMappings, null, 2),
        }
      : {
          displayName: "",
          slug: "",
          pollingIntervalMinutes: 3,
          isEnabled: true,
          metricMappings: "{}",
        },
  });

  const handleSubmit = (data: ProviderFormData) => {
    onSubmit({
      ...data,
      metricMappings: JSON.parse(data.metricMappings),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={(e) => { void form.handleSubmit(handleSubmit)(e); }} className="space-y-4">
        <FormField
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          control={form.control as any}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre a Mostrar</FormLabel>
              <FormControl>
                <Input placeholder="ej. Growatt" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          control={form.control as any}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="ej. growatt" {...field} value={field.value as string} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          control={form.control as any}
          name="pollingIntervalMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intervalo de Sondeo (minutos)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  {...field}
                  value={field.value as number}
                  onChange={(e) => { field.onChange(parseInt(e.target.value)); }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          control={form.control as any}
          name="isEnabled"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormLabel>Habilitado</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value as boolean}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          control={form.control as any}
          name="metricMappings"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mapeos de Métricas (JSON)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='{"metric_key": "display_name"}'
                  className="font-mono text-xs"
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {provider != null ? "Actualizar" : "Crear"} Proveedor
          </Button>
        </div>
      </form>
    </Form>
  );
}
