import { Fragment, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Heading,
  Separator,
  Text,
  ToggleGroup,
  ToggleGroupItem,
} from '@ubits/flux-ui'
import { ChipGuardado, type EstadoGuardado } from '@/shared/components/ChipGuardado'
import { CloseButton } from '@/shared/components/CloseButton'
import type { Visibilidad } from './borrador'
import { VISIBILIDAD } from './ajustes'
import { TokenBadge } from './tokens'

// La cabecera del editor inmersivo: volver a Contenidos, el título del flujo con la miga de dónde se está
// («Portada › Sección 1 › Página»), la visibilidad y el autoguardado; a la derecha los tokens de IA, el conmutador
// «Editar | Vista del colaborador» y el enlace discreto para cargar el contenido de ejemplo o empezar vacío.
//
// La misma cabecera sirve a los flujos hijos (video con IA, presentación interactiva, roleplay y sus editores) a través
// de MarcoInmersivo: ahí cambia la etiqueta de volver («Volver al contenido», «Salir del editor»), la miga es una línea
// de apoyo (`subtitulo`) y a la derecha van sus acciones. Todo lo que no se pasa, no se pinta.

/** «Editar» o «Vista del colaborador»: el conmutador de la cabecera (lo usan los flujos que lo ofrezcan). */
export type ModoVista = 'editar' | 'colaborador'

type Props = {
  /** Texto (el nombre del flujo) o un campo editable (el título del video o de la presentación). */
  titulo: ReactNode
  /** Los niveles después de «Portada». Solo se pinta con `onPortada`. */
  miga?: string[]
  onPortada?: () => void
  /** Línea de apoyo bajo el título cuando no hay miga: la página de destino, el paso. */
  subtitulo?: ReactNode
  /** Junto al título, antes de visibilidad y guardado (p. ej. «MVP»). */
  insignia?: ReactNode
  visibilidad?: Visibilidad
  guardado?: EstadoGuardado
  tokens?: number
  modo?: ModoVista
  onModo?: (modo: ModoVista) => void
  /** El aviso «Mira cómo lo verá tu colaborador», la primera vez. */
  aviso?: boolean
  onCerrarAviso?: () => void
  enlaceDemo?: { etiqueta: string; onClick: () => void }
  /** A la derecha, después de los tokens: Ajustes, la acción principal del editor. */
  acciones?: ReactNode
  /** La salida de la izquierda. Sin `onSalir` no se pinta: el flujo sale solo por `cerrar`, como un modal. */
  volver?: string
  /**
   * La flecha sola, pegada al título, como el «volver» de los modales de recurso. Por defecto el volver es un botón
   * con su texto y un separador, que es lo que piden los editores largos; en un flujo corto esa etiqueta pesa más
   * que el propio título (Dave, 2-oct).
   */
  volverSoloIcono?: boolean
  onSalir?: () => void
  /** Una segunda salida al extremo derecho (cerrar sin guardar), cuando el flujo tiene dos. */
  cerrar?: { etiqueta: string; onClick: () => void }
}

export function EncabezadoEditor({
  titulo,
  miga,
  onPortada,
  subtitulo,
  insignia,
  visibilidad,
  guardado,
  tokens,
  modo,
  onModo,
  aviso = false,
  onCerrarAviso,
  enlaceDemo,
  acciones,
  volver = 'Contenidos',
  volverSoloIcono = false,
  onSalir,
  cerrar,
}: Props) {
  return (
    <div className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-2 py-3">
      {onSalir && volverSoloIcono ? (
        <BotonIcono aria-label={volver} onClick={onSalir}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
        </BotonIcono>
      ) : onSalir ? (
        <>
          <Button variant="ghost" size="sm" className="text-muted-foreground!" onClick={onSalir}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} aria-hidden="true" />
            {volver}
          </Button>
          <Separator orientation="vertical" className="h-8 self-center!" />
        </>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          {typeof titulo === 'string' ? (
            <Heading as="h1" level={6} className="truncate">
              {titulo}
            </Heading>
          ) : (
            titulo
          )}
          {miga && onPortada ? (
            <Breadcrumb aria-label="Ubicación en el contenido">
              <BreadcrumbList className="flex-nowrap">
                <BreadcrumbItem>
                  {miga.length ? (
                    <BreadcrumbLink
                      href="#portada"
                      onClick={(e) => {
                        e.preventDefault()
                        onPortada()
                      }}
                    >
                      Portada
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>Portada</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {miga.map((nivel, i) => (
                  <Fragment key={`${i}-${nivel}`}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem className="min-w-0">
                      {i === miga.length - 1 ? (
                        <BreadcrumbPage className="max-w-56 truncate">{nivel}</BreadcrumbPage>
                      ) : (
                        <span className="max-w-40 truncate">{nivel}</span>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          ) : subtitulo ? (
            <Text as="p" size="xs" variant="muted" className="max-w-md truncate">
              {subtitulo}
            </Text>
          ) : null}
        </div>
        {insignia || visibilidad || guardado ? (
          <div className="flex items-center gap-2">
            {insignia}
            {/* Misma pastilla que el chip de guardado para que el par se lea parejo. */}
            {visibilidad ? (
              <Badge variant={VISIBILIDAD[visibilidad].badge} radius="full" size="lg">
                {VISIBILIDAD[visibilidad].etiqueta}
              </Badge>
            ) : null}
            {guardado ? <ChipGuardado estado={guardado} /> : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {tokens != null ? <TokenBadge tokens={tokens} /> : null}
        {modo && onModo ? (
          <div className="relative">
            <ToggleGroup
              aria-label="Modo"
              value={[modo]}
              onValueChange={(v) => v.length && onModo(v[0] as ModoVista)}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="editar" className="px-3">
                Editar
              </ToggleGroupItem>
              <ToggleGroupItem value="colaborador" className="px-3">
                Vista del colaborador
              </ToggleGroupItem>
            </ToggleGroup>
            {aviso ? (
              // Aparece una sola vez junto al conmutador; los colores suaves del Alert son translúcidos: base de tarjeta.
              <div className="absolute top-full right-0 z-30 mt-2 w-80">
                <Alert variant="info" className="bg-card shadow-lg">
                  <AlertTitle>Mira cómo lo verá tu colaborador</AlertTitle>
                  <AlertDescription>
                    <p>Aquí editas. Los botones, el progreso y el cierre del colaborador aparecen en «Vista del colaborador».</p>
                  </AlertDescription>
                  <AlertAction>
                    <CloseButton label="Cerrar aviso" onClick={() => onCerrarAviso?.()} />
                  </AlertAction>
                </Alert>
              </div>
            ) : null}
          </div>
        ) : null}
        {enlaceDemo ? (
          <Button variant="link" size="sm" className="text-muted-foreground!" onClick={enlaceDemo.onClick}>
            {enlaceDemo.etiqueta}
          </Button>
        ) : null}
        {acciones}
        {cerrar ? <CloseButton label={cerrar.etiqueta} onClick={cerrar.onClick} /> : null}
      </div>
    </div>
  )
}
