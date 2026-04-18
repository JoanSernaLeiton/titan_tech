import { NextResponse } from "next/server";

import { createClient } from "@/shared/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (code == null) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error != null) {
    return NextResponse.redirect(`${origin}/login?error=auth_error`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
