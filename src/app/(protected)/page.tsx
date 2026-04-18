import { redirect } from "next/navigation";

import { logoutAction } from "@/features/auth/actions/logout.action";
import { createClient } from "@/shared/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user == null) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-4xl p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between rounded-xl border border-border/70 bg-card/90 px-5 py-4 shadow-xs">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
            Techos Rentables
          </p>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="rounded-lg border border-border bg-background px-4 py-2 text-sm hover:bg-accent">
            Cerrar sesión
          </button>
        </form>
      </div>
      <p className="text-muted-foreground">
        Bienvenido. Usa el menu lateral para navegar entre modulos.
      </p>
    </main>
  );
}
