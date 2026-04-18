'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useActionState, useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { loginAction, type LoginActionState } from '../actions/login.action'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

const schema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

type FormValues = z.infer<typeof schema>

const initialState: LoginActionState = { status: 'idle' }

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (state.status === 'error') toast.error(state.message)
  }, [state])

  const onSubmit = handleSubmit(data => {
    const fd = new FormData()
    fd.set('email', data.email)
    fd.set('password', data.password)
    startTransition(() => {
      formAction(fd)
    })
  })

  return (
    <form
      onSubmit={e => {
        void onSubmit(e)
      }}
      data-testid="login-form"
      className="space-y-5"
    >
      {state.status === 'error' && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Correo electrónico
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          {...register('email')}
        />
        {errors.email != null && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...register('password')}
        />
        {errors.password != null && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" loading={isPending}>
        Iniciar sesión
      </Button>
    </form>
  )
}
