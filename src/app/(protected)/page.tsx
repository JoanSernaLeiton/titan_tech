import { redirect } from "next/navigation";

import { logoutAction } from "@/features/auth/actions/logout.action";
import { createClient } from "@/shared/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user == null) redirect("/login");

  return (
    <main className="container mx-auto max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <form action={logoutAction}>
          <button type="submit" className="rounded bg-muted px-4 py-2 text-sm hover:bg-muted-foreground/10">
            Cerrar sesión
          </button>
        </form>
      </div>
      <p className="text-muted-foreground">¡Bienvenido! Empieza a construir tu aplicación.</p>
    </main>
  );
}
