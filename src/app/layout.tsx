import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "@/shared/components/providers";

export const metadata: Metadata = {
  title: "Techos Rentables",
  description: "Plataforma solar con experiencia minimalista y simple.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
