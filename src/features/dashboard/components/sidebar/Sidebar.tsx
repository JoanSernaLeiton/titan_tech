'use client'

import type { User } from '@supabase/supabase-js'
import { BarChart3, Bell, Building2, LayoutDashboard, LogOut, Settings2, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { logoutAction } from '@/features/auth/actions/logout.action'
import { Button } from '@/shared/components/ui/button'

const navigationItems = [
  {
    label: 'Vista General',
    href: '/dashboard' as const,
    icon: LayoutDashboard,
  },
  {
    label: 'Configurar Proveedores',
    href: '/dashboard/providers' as const,
    icon: Settings2,
  },
  {
    label: 'Clientes',
    href: '/dashboard/customers' as const,
    icon: Users,
  },
  {
    label: 'Reportes',
    href: '/dashboard/reports' as const,
    icon: BarChart3,
  },
  {
    label: 'Alertas',
    href: '/dashboard/alerts' as const,
    icon: Bell,
  },
] as const

interface SidebarProps {
  user: User | null
}

function getInitials(email: string | undefined): string {
  if (email == null || email === '') return 'U'
  const localPart = email.split('@')[0] ?? ''
  return localPart
    .split(/[._-]/)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logoutAction()
  }

  return (
    <aside className="flex w-72 flex-col border-r border-border bg-gradient-to-b from-card to-card/95">
      <div className="border-b border-border/60 p-6">
        <Link href="/dashboard/providers" className="group block space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 transition-colors group-hover:bg-primary/15">
            <div className="flex size-6 items-center justify-center rounded-full bg-primary/20">
              <Building2 className="size-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Techos Rentables
            </span>
          </div>
          <div className="space-y-0.5">
            <p className="text-xl font-bold tracking-tight text-foreground">Energía Solar</p>
            <p className="text-sm text-muted-foreground">Panel de gestión simplificado</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          Navegación
        </p>
        <ul className="space-y-1">
          {navigationItems.map(item => {
            const Icon = item.icon
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon
                    className={`size-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground/70'}`}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto size-1.5 rounded-full bg-primary-foreground/80" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-border/60 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-accent/50 p-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
            {user != null ? getInitials(user.email) : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.email ?? 'Usuario'}
            </p>
            <p className="text-xs text-muted-foreground">Sesión activa</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            void handleLogout()
          }}
          disabled={isLoggingOut}
        >
          <LogOut className="size-4" />
          {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </Button>
      </div>
    </aside>
  )
}
