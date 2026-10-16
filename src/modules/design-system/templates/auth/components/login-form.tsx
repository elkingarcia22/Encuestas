import { type ComponentProps, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert01Icon, ViewIcon, ViewOffSlashIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@ubits/flux-ui'
import { debeMostrarTour } from '@/shared/components/tour-pendiente'
import { AuthHeader } from './auth-header'
import { SIN_FONDO_AUTOCOMPLETADO } from './autocompletado'
import { CursorDeshabilitado } from './cursor-deshabilitado'
import { AUTH18_AUDIENCES, AUTH18_AUDIENCE_PATHS, AUTH18_ESPERA_INGRESO_MS, type AuthAudience } from './data'
import { reglaContrasena, reglaIdentificador, useCampo } from './validacion'

type FormSubmitEvent = Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0]

export function LoginForm({
  audienciaInicial = 'colaborador',
  sinPermisoInicial = false,
  identificador: identificadorInicial,
  autoFocus = false,
  onIdentificadorChange,
  onForgotPassword,
  onOrganizationLogin,
}: {
  audienciaInicial?: AuthAudience
  sinPermisoInicial?: boolean
  identificador: string
  autoFocus?: boolean
  onIdentificadorChange: (valor: string) => void
  onForgotPassword: () => void
  onOrganizationLogin: () => void
}) {
  const navigate = useNavigate()
  const [audience, setAudience] = useState<AuthAudience>(audienciaInicial)
  const [showPassword, setShowPassword] = useState(false)
  const identificador = useCampo(reglaIdentificador, identificadorInicial)
  const contrasena = useCampo(reglaContrasena)
  const identificadorRef = useRef<HTMLInputElement>(null)
  const contrasenaRef = useRef<HTMLInputElement>(null)
  const completo = identificador.valor.trim() !== '' && contrasena.valor !== ''
  const [ingresando, setIngresando] = useState(false)
  // El aviso de «Sin permisos de administrador» solo sale desde su caso de uso (?caso=sin-permiso); entrar como
  // administrador desde el login pasa directo.
  const [sinPermiso, setSinPermiso] = useState(sinPermisoInicial)

  useEffect(() => {
    if (!ingresando) return
    const espera = window.setTimeout(() => {
      // El tour del nuevo UBITS se abre al llegar al admin la primera vez (1 oct).
      const tour = audience === 'admin' && debeMostrarTour()
      navigate(AUTH18_AUDIENCE_PATHS[audience], tour ? { state: { tour: true } } : undefined)
    }, AUTH18_ESPERA_INGRESO_MS)
    return () => window.clearTimeout(espera)
  }, [ingresando, audience, navigate])

  function cambiarAudiencia(siguiente: AuthAudience) {
    setAudience(siguiente)
    setSinPermiso(false)
  }

  function handleSubmit(event: FormSubmitEvent) {
    event.preventDefault()
    const errorIdentificador = identificador.validar()
    const errorContrasena = contrasena.validar()
    // Al enviar, el foco va al primer campo con problema: nadie debería buscar qué salió mal.
    if (errorIdentificador) {
      identificadorRef.current?.focus()
      return
    }
    if (errorContrasena) {
      contrasenaRef.current?.focus()
      return
    }
    setIngresando(true)
  }

  return (
    <>
      <AuthHeader media="marca" title="Bienvenido de nuevo 👋" description="Ingresa a tu cuenta" />

      <Tabs
        value={audience}
        onValueChange={(next) => {
          if (next === 'admin' || next === 'colaborador') cambiarAudiencia(next)
        }}
      >
        <TabsList className="w-full" aria-label="Tipo de cuenta">
          {AUTH18_AUDIENCES.map((item) => (
            <TabsTrigger key={item.value} value={item.value} className="cursor-pointer">
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {sinPermiso ? (
        <Alert variant="destructive">
          <HugeiconsIcon icon={Alert01Icon} aria-hidden="true" />
          <AlertTitle>No tienes permisos de administrador</AlertTitle>
          {/* Sin AlertAction: en una columna de 360 px el botón al lado partía el texto palabra por palabra.
              La pestaña «Colaborador», justo encima, es la salida. */}
          <AlertDescription>Este espacio es solo para el líder de RH. Ingresa como colaborador para continuar.</AlertDescription>
        </Alert>
      ) : null}

      {/* noValidate: los avisos son los del design system, no las burbujas del navegador. */}
      <form className="flex flex-col gap-6" noValidate onSubmit={handleSubmit}>
        <FieldGroup>
          {/* gap-2.5!: en el login la etiqueta va a 10 px del campo (el tema deja 12); sin «!» no le gana al tema. */}
          <Field className="gap-2.5!" data-invalid={identificador.error ? 'true' : undefined}>
            <FieldLabel htmlFor="auth-identifier">Correo o usuario</FieldLabel>
            <Input
              ref={identificadorRef}
              id="auth-identifier"
              className={SIN_FONDO_AUTOCOMPLETADO}
              type="text"
              autoComplete="username"
              autoFocus={autoFocus}
              placeholder="nombre@empresa.com"
              required
              disabled={ingresando}
              value={identificador.valor}
              aria-invalid={identificador.error ? true : undefined}
              onChange={(event) => {
                identificador.cambiar(event.target.value)
                onIdentificadorChange(event.target.value)
              }}
              onBlur={identificador.salir}
            />
            {identificador.error ? <FieldError>{identificador.error}</FieldError> : null}
          </Field>

          <Field className="gap-2.5!" data-invalid={contrasena.error ? 'true' : undefined}>
            <div className="flex items-center justify-between gap-3">
              <FieldLabel htmlFor="auth-password">Contraseña</FieldLabel>
              {/* -my-1.5: el botón xs mide 24 px y sin esto la fila de «Contraseña» quedaba más alta que la de «Correo». */}
              <CursorDeshabilitado disabled={ingresando} className="-my-1.5 -mr-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="cursor-pointer"
                  disabled={ingresando}
                  onClick={onForgotPassword}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </CursorDeshabilitado>
            </div>
            <InputGroup>
              <InputGroupInput
                ref={contrasenaRef}
                id="auth-password"
                className={SIN_FONDO_AUTOCOMPLETADO}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Ingresa tu contraseña"
                required
                disabled={ingresando}
                value={contrasena.valor}
                aria-invalid={contrasena.error ? true : undefined}
                onChange={(event) => contrasena.cambiar(event.target.value)}
                onBlur={contrasena.salir}
              />
              <InputGroupAddon align="inline-end">
                {/* Nombre fijo + aria-pressed: si también cambiara el nombre, el lector anunciaría un estado contradictorio. */}
                <InputGroupButton
                  size="icon-xs"
                  className="cursor-pointer"
                  aria-label="Mostrar contraseña"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  <HugeiconsIcon icon={showPassword ? ViewOffSlashIcon : ViewIcon} size={16} aria-hidden="true" />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {contrasena.error ? <FieldError>{contrasena.error}</FieldError> : null}
          </Field>
        </FieldGroup>

        <div className="flex flex-col gap-2">
          {/* Deshabilitado hasta que estén los dos datos: así no se envía un formulario a medias. */}
          <CursorDeshabilitado disabled={!completo || ingresando}>
            <Button
              type="submit"
              size="lg"
              className="w-full cursor-pointer"
              disabled={!completo || ingresando}
              aria-live="polite"
            >
              {ingresando ? (
                <>
                  <Spinner aria-hidden="true" />
                  Ingresando…
                </>
              ) : (
                'Iniciar sesión'
              )}
            </Button>
          </CursorDeshabilitado>
          <CursorDeshabilitado disabled={ingresando}>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="w-full cursor-pointer"
              disabled={ingresando}
              onClick={onOrganizationLogin}
            >
              Ingresa con tu organización
            </Button>
          </CursorDeshabilitado>
        </div>
      </form>
    </>
  )
}
