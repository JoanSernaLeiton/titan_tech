import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Bienvenido de nuevo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inicia sesión en tu cuenta para continuar
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
