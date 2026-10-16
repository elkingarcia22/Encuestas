import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Image01Icon, Menu01Icon, Notification03Icon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label,
  Skeleton,
  Text,
  cn,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import avatar from '@/shared/assets/avatar-carolina.jpg'

// Marco de la vista previa (columna derecha de Personalización).
export function MarcoVistaPrevia({ descripcion, accion, children }: { descripcion: string; accion?: ReactNode; children: ReactNode }) {
  return (
    <Frame className="min-w-0 lg:sticky lg:top-4">
      <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <FrameTitle>Vista previa</FrameTitle>
          <FrameDescription>{descripcion}</FrameDescription>
        </div>
        {accion}
      </FrameHeader>
      <FramePanel>{children}</FramePanel>
    </Frame>
  )
}

function Logo({ src, className }: { src?: string; className?: string }) {
  // Sin logo propio, la plataforma muestra el de UBITS.
  return src ? (
    <img src={src} alt="Meta Colombia" className={cn('w-auto', className)} />
  ) : (
    <>
      <img src="/ubits-logo.svg" alt="UBITS" className={cn('w-auto dark:hidden', className)} />
      <img src="/ubits-logo-white.svg" alt="UBITS" className={cn('hidden w-auto dark:block', className)} />
    </>
  )
}

// Inicio de sesión en miniatura: imagen de fondo a la izquierda y formulario con el logo a la derecha.
// Es decorativa (inert): no se puede escribir en ella.
export function VistaInicioSesion({ logo, fondo }: { logo?: string; fondo?: string }) {
  return (
    <div inert className="grid overflow-hidden rounded-lg border sm:grid-cols-2">
      {fondo ? (
        <img src={fondo} alt="" className="hidden aspect-[960/1080] size-full object-cover sm:block" />
      ) : (
        <div className="hidden bg-muted sm:flex">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Image01Icon} />
              </EmptyMedia>
              <EmptyDescription>Aquí va tu imagen de fondo</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      )}

      <div className="flex flex-col justify-center gap-4 bg-background p-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo src={logo} className="h-7" />
          <div className="flex flex-col gap-1">
            <Text as="span" size="sm" weight="semibold">
              Bienvenido de nuevo
            </Text>
            <Text as="span" variant="muted" size="xs">
              Ingresa a tu cuenta
            </Text>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Correo o usuario</Label>
          <Input placeholder="nombre@empresa.com" readOnly tabIndex={-1} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Contraseña</Label>
          <Input type="password" placeholder="Ingresa tu contraseña" readOnly tabIndex={-1} />
        </div>
        <Button size="sm" className="w-full" tabIndex={-1}>
          Iniciar sesión
        </Button>
      </div>
    </div>
  )
}

// Encabezado de UBITS con el logo principal, en escritorio o en celular.
export function VistaEncabezado({ logo, logoCelular, celular }: { logo?: string; logoCelular?: string; celular: boolean }) {
  if (celular) {
    return (
      <div inert className="mx-auto w-full max-w-[360px] overflow-hidden rounded-3xl border bg-muted p-2">
        <div className="flex items-center justify-between gap-3 rounded-2xl border bg-background px-3 py-2">
          <BotonIcono tabIndex={-1} aria-label="Menú">
            <HugeiconsIcon icon={Menu01Icon} size={18} />
          </BotonIcono>
          <Logo src={logoCelular ?? logo} className="h-6" />
          <PerfilDemo />
        </div>
        <div className="flex h-72 flex-col gap-2 p-3">
          <Relleno />
        </div>
      </div>
    )
  }

  return (
    <div inert className="overflow-hidden rounded-lg border bg-muted">
      <div className="flex items-center gap-4 border-b bg-background px-4 py-2.5">
        <Logo src={logo} className="h-7" />
        <InputGroup className="ml-auto max-w-56 max-sm:hidden">
          <InputGroupAddon>
            <HugeiconsIcon icon={Search01Icon} size={16} />
          </InputGroupAddon>
          <InputGroupInput placeholder="Buscar" readOnly tabIndex={-1} />
        </InputGroup>
        <BotonIcono tabIndex={-1} aria-label="Notificaciones" className="max-sm:ml-auto">
          <HugeiconsIcon icon={Notification03Icon} size={18} />
        </BotonIcono>
        <PerfilDemo />
      </div>
      <div className="flex h-44 flex-col gap-2 p-4">
        <Relleno />
      </div>
    </div>
  )
}

function PerfilDemo() {
  return (
    <Avatar size="sm">
      <AvatarImage src={avatar} alt="" />
      <AvatarFallback>CM</AvatarFallback>
    </Avatar>
  )
}

// Contenido de la página debajo del encabezado, solo como referencia de escala.
function Relleno() {
  return (
    <>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="mt-2 h-20 w-full" />
    </>
  )
}
