import { type ComponentProps, useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { Button, Field, FieldError, FieldGroup, FieldLabel, Input } from '@ubits/flux-ui'
import { AuthHeader } from './auth-header'
import { SIN_FONDO_AUTOCOMPLETADO } from './autocompletado'
import { CursorDeshabilitado } from './cursor-deshabilitado'
import { reglaIdentificador, useCampo } from './validacion'

type FormSubmitEvent = Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0]

export function ForgotPasswordForm({
  identificador: identificadorInicial,
  onBack,
  onSubmitted,
}: {
  identificador: string
  onBack: () => void
  onSubmitted: (identificador: string) => void
}) {
  // Llega con lo que ya escribió en el login: no se le pide dos veces el mismo dato.
  const identificador = useCampo(reglaIdentificador, identificadorInicial)
  const identificadorRef = useRef<HTMLInputElement>(null)

  function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault()
    if (identificador.validar()) {
      identificadorRef.current?.focus()
      return
    }
    onSubmitted(identificador.valor.trim())
  }

  return (
    <>
      <AuthHeader
        media={{ glass: 'glass-lock' }}
        title="¿Olvidaste tu contraseña?"
        description="Ingresa tu correo corporativo y te enviaremos un enlace para que recuperes tu contraseña."
      />

      <form className="flex flex-col gap-6" noValidate onSubmit={handleSubmit}>
        <FieldGroup>
          <Field data-invalid={identificador.error ? 'true' : undefined}>
            <FieldLabel htmlFor="auth-recovery-email">Correo o usuario</FieldLabel>
            <Input
              ref={identificadorRef}
              id="auth-recovery-email"
              className={SIN_FONDO_AUTOCOMPLETADO}
              type="text"
              autoComplete="username"
              autoFocus
              placeholder="nombre@empresa.com"
              required
              value={identificador.valor}
              aria-invalid={identificador.error ? true : undefined}
              onChange={(event) => identificador.cambiar(event.target.value)}
              onBlur={identificador.salir}
            />
            {identificador.error ? <FieldError>{identificador.error}</FieldError> : null}
          </Field>
        </FieldGroup>

        <div className="flex flex-col gap-2">
          <CursorDeshabilitado disabled={identificador.valor.trim() === ''}>
            <Button
              type="submit"
              size="lg"
              className="w-full cursor-pointer"
              disabled={identificador.valor.trim() === ''}
            >
              Enviar enlace
            </Button>
          </CursorDeshabilitado>
          <Button type="button" variant="ghost" size="lg" className="w-full cursor-pointer" onClick={onBack}>
            <HugeiconsIcon icon={ArrowLeft02Icon} size={16} aria-hidden="true" />
            Volver a iniciar sesión
          </Button>
        </div>
      </form>
    </>
  )
}
