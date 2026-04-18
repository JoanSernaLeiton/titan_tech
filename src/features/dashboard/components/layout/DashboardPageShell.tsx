"use client";

import type { ReactNode } from "react";

import { Card, CardContent } from "@/shared/components/ui/card";

interface DashboardPageShellProps {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function DashboardPageShell({
  title,
  description,
  actions,
  children,
}: DashboardPageShellProps) {
  return (
    <section className="space-y-6">
      <Card className="border-border/70 bg-card/90 shadow-xs">
        <CardContent className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {title}
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
              {description}
            </p>
          </div>
          {actions}
        </CardContent>
      </Card>
      {children}
    </section>
  );
}
