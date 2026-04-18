"use client";

import { useState } from "react";

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
import { Spinner } from "@/shared/components/ui/spinner";
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
      <div className="p-8 space-y-6">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">No se pudieron cargar los clientes. Por favor, intenta de nuevo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus clientes y sus instalaciones solares
          </p>
        </div>
        <Button onClick={handleAddCustomer} disabled={isPending}>
          Agregar Cliente
        </Button>
      </div>

      {isPending ? (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
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
    </div>
  );
}
