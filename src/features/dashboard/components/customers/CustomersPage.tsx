"use client";

import { useState } from "react";

import { DashboardPageShell } from "../layout/DashboardPageShell";
import { LoadingState, PageState } from "../layout/PageState";

import { CustomerForm } from "./CustomerForm";
import { CustomersList } from "./CustomersList";

import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
} from "@/features/dashboard/hooks/use-customers";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import type { InsertCustomer } from "@/shared/db/customers.schema";

export function CustomersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: customers = [], isPending, isError } = useCustomers();
  const createMutation = useCreateCustomer();
  const deleteMutation = useDeleteCustomer();

  const handleAddCustomer = () => {
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleSubmit = (data: InsertCustomer) => {
    createMutation.mutate(data);
    setIsDialogOpen(false);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
  };

  if (isError) {
    return (
      <DashboardPageShell
        title="Clientes"
        description="Administra clientes e instalaciones desde una vista clara y ordenada."
      >
        <PageState
          tone="error"
          message="No se pudieron cargar los clientes. Por favor, intenta de nuevo."
        />
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell
      title="Clientes"
      description="Gestiona tus clientes y sus instalaciones solares con una navegacion simple."
      actions={(
        <Button onClick={handleAddCustomer} disabled={isPending}>
          Agregar Cliente
        </Button>
      )}
    >

      {isPending ? (
        <LoadingState message="Cargando clientes..." />
      ) : (
        <CustomersList customers={customers} onDelete={handleDelete} />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <CustomerForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  );
}
