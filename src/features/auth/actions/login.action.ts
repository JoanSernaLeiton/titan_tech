"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/shared/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export async function loginAction(
  _prev: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: (parsed.error.issues[0] as { message: string }).message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error != null) {
    return { status: "error", message: error.message };
  }

  redirect("/");
}
