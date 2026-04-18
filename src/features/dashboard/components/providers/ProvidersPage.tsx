"use client";

import { useState } from "react";

import { ProviderForm } from "./ProviderForm";
import { ProvidersList } from "./ProvidersList";

import {
  useCreateProvider,
  useDeleteProvider,
  useProviders,
  useUpdateProvider,
} from "@/features/dashboard/hooks/use-providers";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Spinner } from "@/shared/components/ui/spinner";
import type { InsertProvider, SelectProvider } from "@/shared/db/providers.schema";

export function ProvidersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<SelectProvider | null>(
    null
  );

  const { data: providers = [], isPending, isError } = useProviders();
  const createMutation = useCreateProvider();
  const updateMutation = useUpdateProvider();
  const deleteMutation = useDeleteProvider();

  const handleAddProvider = () => {
    setEditingProvider(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (provider: SelectProvider) => {
    setEditingProvider(provider);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleSubmit = (data: Omit<InsertProvider, "id" | "createdAt">) => {
    if (editingProvider != null) {
      updateMutation.mutate({
        id: editingProvider.id,
        data: data,
      });
    } else {
      createMutation.mutate(data);
    }
    setIsDialogOpen(false);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingProvider(null);
  };

  if (isError) {
    return (
      <div className="p-8 space-y-6">
        <h1 className="text-3xl font-bold">Configurar Proveedores</h1>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">No se pudieron cargar los proveedores. Por favor, intenta de nuevo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurar Proveedores</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus proveedores de datos solares
          </p>
        </div>
        <Button onClick={handleAddProvider} disabled={isPending}>
          Agregar Proveedor
        </Button>
      </div>

      {isPending ? (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      ) : (
        <ProvidersList
          providers={providers}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProvider != null ? "Editar Proveedor" : "Agregar Nuevo Proveedor"}
            </DialogTitle>
          </DialogHeader>
          <ProviderForm
            provider={editingProvider ?? undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
