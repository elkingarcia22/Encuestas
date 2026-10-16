import { Fragment, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Heading,
  Text,
  cn,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { PAGE_WIDTH, type PageWidth } from '@/shared/components/page-width'
import { useSetPageCrumbs } from '@/shared/components/page-crumbs'
import { getBreadcrumbs, type Crumb } from '@/shared/layouts/nav-config'

// Marco de página del Workspace: contenedor (1140px por defecto), cabecera, contenido y pie.
// Cada parte lleva data-region con su nombre para dibujar la anatomía en el design system.

const WIDTH_LABEL: Record<PageWidth, string> = {
  narrow: 'Contenedor · 720px',
  default: 'Contenedor · 1140px máx.',
  wide: 'Contenedor · 1600px máx.',
  full: 'Contenedor · ancho completo',
}

export function PageShell({ width = 'default', className, children }: { width?: PageWidth; className?: string; children: ReactNode }) {
  return (
    <div data-region={WIDTH_LABEL[width]} className={cn('mx-auto flex w-full flex-1 flex-col', PAGE_WIDTH[width], className)}>
      {children}
    </div>
  )
}

// Migas de pan: salen solas de la ruta y del menú, o se pasan a mano.
//
// `compact` es el modo de la barra de arriba, que mide 60px y comparte fila con el buscador y las acciones:
// ahí **nunca pueden partirse en dos líneas** (antes se partían en 18 pantallas) ni cortar el nombre de la pantalla.
// Por eso en ese modo se muestran solo dos niveles —el de encima y dónde estás—, y si la barra se queda angosta
// (por ejemplo con el panel del agente abierto) queda solo el nombre de la pantalla. Dentro de una página, donde hay
// ancho de sobra, se muestra la ruta completa.
export function PageBreadcrumbs({ items, compact = false }: { items?: Crumb[]; compact?: boolean }) {
  const { pathname } = useLocation()
  const todas = items ?? getBreadcrumbs(pathname)
  if (todas.length < 2) return null

  const crumbs = compact ? todas.slice(-2) : todas
  const oculta = compact ? ' @max-[64rem]:hidden' : ''

  return (
    <Breadcrumb data-region="Migas de pan" className="min-w-0">
      <BreadcrumbList className={cn('min-w-0', compact && 'flex-nowrap!')}>
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              <BreadcrumbItem className={last ? 'min-w-0' : `shrink-0${oculta}`}>
                {last ? (
                  <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                ) : crumb.path ? (
                  <BreadcrumbLink render={<Link to={crumb.path} />}>{crumb.label}</BreadcrumbLink>
                ) : (
                  crumb.label
                )}
              </BreadcrumbItem>
              {last ? null : <BreadcrumbSeparator className={`shrink-0${oculta}`} />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

// Tamaños del título: grande (el de siempre), mediano para fichas y compacto para pantallas densas o de proceso.
export type PageTitleSize = 'lg' | 'md' | 'sm'

// Cada tamaño es un nivel de Heading del tema (Inter seminegrita), sin tamaños ni pesos forzados.
const TITLE_LEVEL: Record<PageTitleSize, 2 | 3 | 4> = { lg: 2, md: 3, sm: 4 }

// Alto de la flecha «Volver» para que quede centrada con la primera línea del título.
const BACK_OFFSET: Record<PageTitleSize, string> = { lg: 'mt-1', md: 'mt-1', sm: 'mt-0.5' }

type PageHeaderProps = {
  // Dónde está esta pantalla. NO se dibuja aquí: se la lleva la barra de arriba, que es donde vive la miga de pan.
  // Solo hace falta cuando la pantalla está más adentro de lo que el menú conoce («Encuestas › Crear encuesta»);
  // si no, la barra saca la ruta del menú sola.
  breadcrumbs?: Crumb[] | false
  // Navegación a medida arriba del título (migas con menú, volver + migas…). Reemplaza a las migas y a «Volver».
  nav?: ReactNode
  // Flecha para volver, junto al título (la miga de pan ya dice dónde estás, arriba). Con onClick se puede
  // preguntar antes de salir (cambios sin guardar). `variant` se acepta por compatibilidad: desde el 22 sep
  // siempre es la flecha, nunca el enlace «‹ Volver a…» encima del título.
  back?: { label: string; to?: string; onClick?: () => void; variant?: 'text' | 'icon' }
  kicker?: string
  title: ReactNode
  titleSize?: PageTitleSize
  // Botón pegado al título: favorito, editar nombre.
  titleAction?: ReactNode
  // Estado junto al título (insignia).
  badge?: ReactNode
  description?: ReactNode
  // Avatar, logo o icono a la izquierda del título.
  media?: ReactNode
  // Fila de datos bajo la descripción (responsable, fechas…).
  meta?: ReactNode
  // Botones: secundarios primero, primario al final.
  actions?: ReactNode
  // Pestañas o navegación secundaria bajo la cabecera.
  tabs?: ReactNode
  // Nombre de esa franja en la anatomía (por defecto «Pestañas»; p. ej. «Menú del producto»). Con false no se
  // marca: sirve cuando la franja junta varias partes que ya traen su propio nombre.
  tabsRegion?: string | false
  className?: string
}

export function PageHeader({
  breadcrumbs,
  nav,
  back,
  kicker,
  title,
  titleSize = 'lg',
  titleAction,
  badge,
  description,
  media,
  meta,
  actions,
  tabs,
  tabsRegion = 'Pestañas',
  className,
}: PageHeaderProps) {
  const navigate = useNavigate()
  // La ruta se registra para la barra de arriba; aquí no se dibuja nada.
  useSetPageCrumbs(breadcrumbs || undefined)
  const goBack = () => (back?.onClick ? back.onClick() : back?.to ? navigate(back.to) : navigate(-1))
  // Una sola forma de volver (Nicolás, 22 sep): el enlace de texto encima del título se leía como una segunda miga
  // de pan, y la miga vive arriba. Queda la flecha junto al título, que convive con la miga.
  const iconBack = !!back

  return (
    <header className={cn('flex flex-col gap-4', className)}>
      {nav}
      {/* La miga de pan no va aquí: vive arriba, en la barra superior, pegada al botón que abre y cierra el menú
          (Nicolás, 21 sep: «el breadcrumb debe estar arriba con el cierre y apertura de la sidebar y no arriba del
          título»). Lo que se pasa en `breadcrumbs` se registra para esa barra. */}

      <div className="flex min-w-0 items-start gap-4">
        {/* Flecha para volver junto al título. Su nombre va en un contenedor para que quede arriba y no se encime
            con los de abajo (descripción, metadatos). */}
        {iconBack && back ? (
          <div data-region="Volver" className={cn('-mr-1 -ml-1.5 shrink-0', BACK_OFFSET[titleSize])}>
            <BotonIcono
              className="text-muted-foreground!"
              aria-label={`Volver a ${back.label}`}
              onClick={goBack}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </BotonIcono>
          </div>
        ) : null}
        {media ? (
          <div data-region="Imagen" className="mt-1 shrink-0">
            {media}
          </div>
        ) : null}
        {/* 4px entre antetítulo, título y bajada: la misma separación que usa la librería en Item, Card y Field,
            y la que ya tenía PageSection. Antes eran 6px y la cabecera de página no rimaba con nada más. */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* Tipografía del tema, sin tamaños ni pesos forzados: el título es un Heading de nivel 2 (Inter
              seminegrita, el mismo de las páginas del design system) y el antetítulo un Text pequeño en gris. */}
          {kicker ? (
            <Text data-region="Antetítulo" as="div" variant="muted" size="xs" weight="medium">
              {kicker}
            </Text>
          ) : null}
          {/* Los botones van en la fila del título, a la derecha (Nicolás, 22 sep: «acá los botones están abajo y
              aquí están arriba»). Antes se alineaban con el final de la cabecera, así que bajaban o subían según lo
              larga que fuera la descripción. Desde 13-oct (Elkin) un título largo ya no los baja: en pantallas medianas y
              anchas la fila no salta y el título se encoge (si viene con `truncate`, se corta con «…»). En celular sí
              saltan debajo del título, nunca encima de la bajada. */}
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 md:flex-nowrap">
            {/* El nombre va en un contenedor: el título de la librería fuerza margen cero y en la anatomía su nombre
                quedaba encima de lo de arriba. */}
            <div data-region="Título" className="min-w-0">
              <Heading as="h1" level={TITLE_LEVEL[titleSize]}>
                {title}
              </Heading>
            </div>
            {titleAction}
            {/* Misma altura que los botones: centrada y 2px abajo. Sin `flex`, una insignia suelta se apoyaba en la
                línea de texto y quedaba 2px más abajo que una envuelta: cada pantalla la ponía a una altura distinta. */}
            {badge ? (
              <div data-region="Estado" className="flex shrink-0 translate-y-0.5 items-center">
                {badge}
              </div>
            ) : null}
            {/* `translate-y-0.5`: centrados con la caja del título, los botones quedaban con su centro a la altura de
                las mayúsculas, y un título se lee por sus minúsculas: medido, 3px más abajo. Se veían «un pelín más
                arriba» (Nicolás, 22 sep). Bajarlos 2px los centra con el cuerpo del texto sin despegarlos de la fila. */}
            {actions ? (
              <div data-region="Acciones" className="ml-auto flex max-w-full shrink-0 translate-y-0.5 flex-wrap items-center gap-2">
                {actions}
              </div>
            ) : null}
          </div>
          {description ? (
            <Text data-region="Descripción" as="div" variant="muted" className="max-w-2xl">
              {description}
            </Text>
          ) : null}
          {meta ? (
            <div data-region="Metadatos" className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {meta}
            </div>
          ) : null}
        </div>
      </div>

      {tabs ? (
        <div data-region={tabsRegion || undefined} className="mt-1">
          {tabs}
        </div>
      ) : null}
    </header>
  )
}

// El contenido es un slot: lo que cada pantalla necesite. No es parte del marco (en la anatomía se dibuja en gris).
export function PageContent({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div data-slot-region="Contenido" className={cn('flex flex-1 flex-col gap-6 pt-6', className)}>
      {children}
    </div>
  )
}

// Bloque dentro del contenido con título, bajada y acciones propias.
export function PageSection({
  title,
  description,
  actions,
  className,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('flex flex-col gap-4', className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Heading as="h2" level={5}>
            {title}
          </Heading>
          {description ? (
            <Text as="div" variant="muted" size="sm">
              {description}
            </Text>
          ) : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}

// Barra fija al fondo para guardar o avanzar (formularios, configuración, pasos).
export function PageActionBar({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      data-region="Barra de acciones"
      className={cn('sticky bottom-4 z-10 mt-8 flex flex-wrap items-center gap-3 rounded-xl border bg-background px-4 py-3 shadow-lg', className)}
    >
      {children}
    </div>
  )
}

// El pie («Con la tecnología de UBITS» y legales) lo pone el marco general: ver AppFooter.
