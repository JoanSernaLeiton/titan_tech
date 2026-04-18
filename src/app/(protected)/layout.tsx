import { redirect } from "next/navigation";

import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout";
import { createClient } from "@/shared/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    redirect("/login");
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
