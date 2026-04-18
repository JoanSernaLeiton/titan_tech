"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        toastOptions={{
          classNames: {
            success: "!bg-success !text-success-foreground !border-success",
            error: "!bg-destructive !text-destructive-foreground !border-destructive",
            warning: "!bg-warning !text-warning-foreground !border-warning",
            info: "!bg-info !text-info-foreground !border-info",
          },
        }}
      />
    </QueryClientProvider>
  );
}
