"use client";

import { useState } from "react";

import { DashboardPageShell } from "../layout/DashboardPageShell";
import { LoadingState, PageState } from "../layout/PageState";

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
      <DashboardPageShell
        title="Configurar proveedores"
        description="Gestiona los proveedores de datos solares con una estructura simple y consistente."
      >
        <PageState
          tone="error"
          message="No se pudieron cargar los proveedores. Por favor, intenta de nuevo."
        />
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell
      title="Configurar proveedores"
      description="Gestiona tus proveedores de datos solares y mantiene tu operacion conectada."
      actions={(
        <Button onClick={handleAddProvider} disabled={isPending}>
          Agregar Proveedor
        </Button>
      )}
    >

      {isPending ? (
        <LoadingState message="Cargando proveedores..." />
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
    </DashboardPageShell>
  );
}
