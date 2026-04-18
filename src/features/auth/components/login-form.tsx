"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { loginAction, type LoginActionState } from "../actions/login.action";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

const schema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

type FormValues = z.infer<typeof schema>;

const initialState: LoginActionState = { status: "idle" };

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (state.status === "error") toast.error(state.message);
  }, [state]);

  const onSubmit = handleSubmit((data) => {
    const fd = new FormData();
    fd.set("email", data.email);
    fd.set("password", data.password);
    startTransition(() => { formAction(fd); });
  });

  return (
    <Card className="border-border/70 bg-card/90 shadow-xs">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>Ingresa tu correo y contrasena</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { void onSubmit(e); }} data-testid="login-form" className="space-y-4">
          {state.status === "error" && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email != null && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password != null && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" loading={isPending}>
            Iniciar sesión
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
