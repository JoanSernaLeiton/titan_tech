"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/shared/lib/supabase/client";

export function useAuth() {
  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();
      if (error != null) throw error;
      return data.session;
    },
    staleTime: 5 * 60 * 1000,
  });
}
