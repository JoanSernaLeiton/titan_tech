'use client'

import type { User } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

import { Sidebar } from './sidebar/Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  user: User | null
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const pathname = usePathname()
  const sectionTitle = useMemo(() => {
    if (pathname.startsWith('/dashboard/providers')) return 'Proveedores'
    if (pathname.startsWith('/dashboard/customers')) return 'Clientes'
    if (pathname.startsWith('/dashboard/reports')) return 'Reportes'
    if (pathname.startsWith('/dashboard/alerts')) return 'Alertas'
    return 'Panel principal'
  }, [pathname])

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-20 border-b border-border/70 bg-background/95 px-6 py-4 backdrop-blur-sm md:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Techos Rentables
          </p>
          <h2 className="text-lg font-semibold text-foreground">{sectionTitle}</h2>
        </div>
        <div className="mx-auto w-full max-w-7xl p-6 md:p-8">{children}</div>
      </main>
    </div>
  )
}
