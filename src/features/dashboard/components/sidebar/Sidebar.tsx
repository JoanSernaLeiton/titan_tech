"use client";

import { Settings2, Users, BarChart3, Bell } from "lucide-react";
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
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-semibold">Panel Solar</h1>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent text-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
