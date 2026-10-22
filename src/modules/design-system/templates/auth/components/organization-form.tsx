import { type ComponentProps, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { Button, Field, FieldError, FieldGroup, FieldLabel, Input, Spinner } from '@ubits/flux-ui'
import { AuthHeader } from './auth-header'
import { SIN_FONDO_AUTOCOMPLETADO } from './autocompletado'
import { CursorDeshabilitado } from './cursor-deshabilitado'
import { AUTH18_AUDIENCE_PATHS, AUTH18_ESPERA_INGRESO_MS } from './data'
import { reglaCorreoEmpresa, useCampo } from './validacion'

type FormSubmitEvent = Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0]


export function OrganizationForm({ onBackToLogin }: { onBackToLogin: () => void }) {
  const navigate = useNavigate()
  const correo = useCampo(reglaCorreoEmpresa)
  const correoRef = useRef<HTMLInputElement>(null)
  const [redirigiendo, setRedirigiendo] = useState(false)

  useEffect(() => {
    if (!redirigiendo) return
    // En el producto real este paso lleva al inicio de sesión de la empresa (SSO).
    const espera = window.setTimeout(() => navigate(AUTH18_AUDIENCE_PATHS.colaborador), AUTH18_ESPERA_INGRESO_MS)
    return () => window.clearTimeout(espera)
  }, [redirigiendo, navigate])

  function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault()
    if (correo.validar()) {
      correoRef.current?.focus()
      return
    }
    setRedirigiendo(true)
  }

  return (
    <>
      <AuthHeader
        media="marca"
        title="Ingresa con tu organización"
        description="Por esta opción ingresas con el correo electrónico de tu empresa."
      />

      <form className="flex flex-col gap-6" noValidate onSubmit={handleSubmit}>
        <FieldGroup>
          <Field data-invalid={correo.error ? 'true' : undefined} data-disabled={redirigiendo ? 'true' : undefined}>
            <FieldLabel htmlFor="auth-org-email">Correo de tu organización</FieldLabel>
            <Input
              ref={correoRef}
              id="auth-org-email"
              className={SIN_FONDO_AUTOCOMPLETADO}
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="nombre@empresa.com"
              required
              disabled={redirigiendo}
              value={correo.valor}
              aria-invalid={correo.error ? true : undefined}
              onChange={(event) => correo.cambiar(event.target.value)}
              onBlur={correo.salir}
            />
            {correo.error ? <FieldError>{correo.error}</FieldError> : null}
          </Field>
        </FieldGroup>

        <div className="flex flex-col gap-2">
          <CursorDeshabilitado disabled={redirigiendo || correo.valor.trim() === ''}>
            <Button
              type="submit"
              size="lg"
              className="w-full cursor-pointer"
              disabled={redirigiendo || correo.valor.trim() === ''}
              aria-live="polite"
            >
              {redirigiendo ? (
                <>
                  <Spinner aria-hidden="true" />
                  Ingresando…
                </>
              ) : (
                'Iniciar sesión'
              )}
            </Button>
          </CursorDeshabilitado>
          <CursorDeshabilitado disabled={redirigiendo}>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="w-full cursor-pointer"
              disabled={redirigiendo}
              onClick={onBackToLogin}
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={16} aria-hidden="true" />
              Volver a iniciar sesión
            </Button>
          </CursorDeshabilitado>
        </div>
      </form>
    </>
  )
}
