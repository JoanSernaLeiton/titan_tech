import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-3 text-center">
          <p className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-primary">
            Techos Rentables
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Bienvenido de nuevo</h1>
          <p className="text-sm text-muted-foreground">
            Inicia sesion para acceder a una experiencia simple y facil de navegar.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
