"use client";

import { BarChart3, Bell, Building2, Settings2, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    label: "Configurar Proveedores",
    href: "/dashboard/providers" as const,
    icon: Settings2,
  },
  {
    label: "Clientes",
    href: "/dashboard/customers" as const,
    icon: Users,
  },
  {
    label: "Reportes",
    href: "/dashboard/reports" as const,
    icon: BarChart3,
  },
  {
    label: "Alertas",
    href: "/dashboard/alerts" as const,
    icon: Bell,
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-72 flex-col border-r border-border/70 bg-card/70">
      <div className="border-b border-border/70 p-6">
        <Link href="/dashboard/providers" className="block space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1">
            <Building2 className="size-4 text-primary" />
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
              Techos Rentables
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">Energia Solar</p>
            <p className="text-sm text-muted-foreground">Panel de gestion simplificado</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-4">
        <p className="px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Navegacion
        </p>
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-border/70 p-4">
        <p className="rounded-lg bg-muted/70 px-3 py-2 text-xs text-muted-foreground">
          Diseno minimalista para navegacion clara y rapida.
        </p>
      </div>
    </aside>
  );
}
