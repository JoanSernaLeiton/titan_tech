import { Sun } from 'lucide-react'

import { LoginForm } from '@/features/auth/components/login-form'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-xs">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <Sun className="size-6 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">Techos Rentables</h1>
            <p className="text-sm text-muted-foreground">Energía Solar</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
