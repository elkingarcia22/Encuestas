import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  IconTile,
  cn,
} from '@ubits/flux-ui'
import { CloseButton } from '@/shared/components/CloseButton'
import { Orb } from '@/shared/components/Orb'
import { scrollFocus } from '../../components/scroll-focus'
import { KICKER } from './drawer-styles'
import { ContextoPanel, usePanelActual, type PanelActual, type Vista } from './panel-actual'

export type DrawerDirection = 'right' | 'left' | 'bottom' | 'top'

type DrawerShellProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  direction?: DrawerDirection
  // Ancho de los laterales: 24, 30, 36 o 60rem (xl: catálogos con tres tarjetas por fila).
  size?: 'sm' | 'md' | 'lg' | 'xl'
  title: ReactNode
  description?: ReactNode
  // Palabra corta sobre el título (producto o tipo de registro).
  kicker?: string
  // Estado junto al título (insignia).
  badge?: ReactNode
  icon?: IconSvgElement
  // Imagen propia en lugar del icono (avatar, logo).
  media?: ReactNode
  // Superficie de IA: orbe y botones en pastilla.
  ai?: boolean
  // Fila de navegación sobre la cabecera: volver o pasar entre registros.
  navigation?: ReactNode
  // Franja bajo la cabecera (pestañas, pasos, contexto).
  headerExtra?: ReactNode
  footer?: ReactNode
  footerClassName?: string
  // Nombre del pie en la anatomía (por defecto «Pie»).
  footerRegion?: string
  snapPoints?: number[]
  // Para paneles que conviven con otro (p. ej. la ficha de candidato con el agente abierto): sin bloquear la pantalla,
  // sin cerrarse al tocar fuera y corrido a la izquierda del otro panel (posición, no apariencia).
  modal?: boolean
  disablePointerDismissal?: boolean
  style?: CSSProperties
  children: ReactNode
}

const WIDTH = {
  sm: 'sm:[--drawer-content-width:24rem]!',
  md: 'sm:[--drawer-content-width:30rem]!',
  lg: 'sm:[--drawer-content-width:36rem]!',
  xl: 'sm:[--drawer-content-width:min(60rem,calc(100vw_-_1.5rem))]!',
}

// Laterales flotando a 12px del borde con esquinas de 16px (panel flotante del handoff);
// arriba y abajo, centrados en pantallas grandes con esquinas amplias.
// Los laterales apagan el «relleno» de la librería (after): es para paneles pegados al borde y,
// al flotar, quedaba como un rectángulo visible junto al panel.
const SHAPE: Record<DrawerDirection, string> = {
  right: '[--drawer-inset:0.75rem] rounded-2xl! border! shadow-xl after:hidden!',
  left: '[--drawer-inset:0.75rem] rounded-2xl! border! shadow-xl after:hidden!',
  bottom: 'rounded-t-3xl! sm:mx-auto sm:max-w-2xl',
  top: 'rounded-b-3xl! sm:mx-auto sm:max-w-2xl',
}

const TITULO = 'text-base font-semibold'

// Estructura común: navegación opcional, cabecera con imagen, antetítulo, título, estado, bajada y cerrar; cuerpo
// con scroll (el slot de cada caso); pie con acciones. Cada parte lleva su nombre en data-region (anatomía).
//
// Un DrawerShell que se abre **dentro de otro** (o una ventana pedida desde un drawer: `VentanaDeAccion`,
// `DialogoConfirmar`) no es otro drawer: es una vista del mismo, que tapa su contenido y trae arriba «← título del
// panel» para volver (8 oct, Nicolás: «nada de abrir un nuevo drawer»). La cabecera, el cuerpo y el pie son los mismos.
export function DrawerShell(props: DrawerShellProps) {
  const padre = usePanelActual()
  return padre ? <VistaDelPanel {...props} padre={padre} /> : <PanelPropio {...props} />
}

function PanelPropio({
  open,
  onOpenChange,
  direction = 'right',
  size = 'md',
  title,
  description,
  kicker,
  badge,
  icon,
  media,
  ai = false,
  navigation,
  headerExtra,
  footer,
  footerClassName,
  footerRegion = 'Pie',
  snapPoints,
  modal,
  disablePointerDismissal,
  style,
  children,
}: DrawerShellProps) {
  const side = direction === 'right' || direction === 'left'

  // Las vistas abiertas dentro, de la más vieja a la de arriba.
  const [vistas, setVistas] = useState<Vista[]>([])
  const [capa, setCapa] = useState<HTMLDivElement | null>(null)
  const registrar = useCallback((vista: Vista) => {
    setVistas((antes) => [...antes.filter((otra) => otra.id !== vista.id), vista])
    return () => setVistas((antes) => antes.filter((otra) => otra.id !== vista.id))
  }, [])
  const arriba = vistas.at(-1)
  // Escape, tocar fuera o deslizar con una vista abierta: vuelve al panel, no lo cierra entero.
  const cambiar = (abrir: boolean) => {
    if (!abrir && arriba) return arriba.cerrar()
    onOpenChange(abrir)
  }
  const alDia = useRef(onOpenChange)
  useEffect(() => {
    alDia.current = onOpenChange
  })
  const panel = useMemo<PanelActual>(
    () => ({
      titulo: typeof title === 'string' ? title : 'Volver',
      size,
      capa,
      registrar,
      arriba: arriba?.id,
      cerrarPanel: () => alDia.current(false),
    }),
    [title, size, capa, registrar, arriba?.id],
  )
  // Una vista de dos columnas ensancha el panel mientras está abierta.
  const ancho = vistas.some((vista) => vista.ancha) ? 'xl' : size

  return (
    <Drawer
      open={open}
      onOpenChange={cambiar}
      direction={direction}
      snapPoints={snapPoints}
      showSwipeHandle={!side}
      modal={modal}
      disablePointerDismissal={disablePointerDismissal}
    >
      <DrawerContent className={cn(SHAPE[direction], side && WIDTH[ancho])} style={style}>
        <ContextoPanel.Provider value={panel}>
          <div className="relative flex min-h-0 flex-1 flex-col">
            {/* Con una vista abierta, lo de abajo no se ve ni recibe el foco. */}
            <div className="flex min-h-0 flex-1 flex-col" inert={vistas.length > 0}>
              {navigation}
              <Cabecera
                visual={<Visual media={media} ai={ai} icon={icon} />}
                kicker={kicker}
                titulo={
                  <DrawerTitle data-region="Título" className={TITULO}>
                    {title}
                  </DrawerTitle>
                }
                badge={badge}
                bajada={
                  description ? (
                    <DrawerDescription data-region="Descripción" className="text-left">
                      {description}
                    </DrawerDescription>
                  ) : null
                }
                cerrar={
                  // La X estándar de ventanas y tarjetas (auditoría, 5 oct): círculo claro de 32px con filo fino.
                  <span data-region="Cerrar" className="flex shrink-0">
                    <CloseButton label="Cerrar" onClick={() => onOpenChange(false)} />
                  </span>
                }
              />
              {headerExtra}
              <Cuerpo footer={footer} footerClassName={footerClassName} footerRegion={footerRegion}>
                {children}
              </Cuerpo>
            </div>
            {/* Aquí se dibujan las vistas abiertas desde este panel, encima de todo lo anterior. */}
            <div ref={setCapa} />
          </div>
        </ContextoPanel.Provider>
      </DrawerContent>
    </Drawer>
  )
}

// Una vista dentro del panel: tapa su contenido con la misma cabecera, cuerpo y pie, y arriba la fila para volver.
function VistaDelPanel({
  open,
  onOpenChange,
  size,
  title,
  description,
  kicker,
  badge,
  icon,
  media,
  ai = false,
  navigation,
  headerExtra,
  footer,
  footerClassName,
  footerRegion = 'Pie',
  children,
  padre,
}: DrawerShellProps & { padre: PanelActual }) {
  const id = useId()
  const ancha = size === 'xl' && padre.size !== 'xl'
  const cerrar = useRef(onOpenChange)
  useEffect(() => {
    cerrar.current = onOpenChange
  })
  const { registrar } = padre
  useEffect(() => {
    if (!open) return
    return registrar({ id, cerrar: () => cerrar.current(false), ancha })
  }, [open, id, ancha, registrar])

  // Al abrir, el foco pasa a la vista (a «volver»); al cerrar, regresa a lo que lo tenía, si sigue ahí.
  const volver = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const antes = document.activeElement instanceof HTMLElement ? document.activeElement : null
    volver.current?.focus()
    return () => {
      if (antes?.isConnected) antes.focus()
    }
  }, [open])

  // Lo que se abra desde esta vista vuelve a ella, no al panel.
  const tituloTexto = typeof title === 'string' ? title : padre.titulo
  const propio = useMemo<PanelActual>(() => ({ ...padre, titulo: tituloTexto }), [padre, tituloTexto])

  if (!open || !padre.capa) return null
  const tituloId = `${id}-titulo`
  return createPortal(
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby={tituloId}
      inert={padre.arriba !== undefined && padre.arriba !== id}
      className="absolute inset-0 z-10 flex flex-col bg-popover text-popover-foreground animate-in duration-200 fade-in-0 slide-in-from-right-3"
    >
      <ContextoPanel.Provider value={propio}>
        <div className="flex items-center border-b px-3 py-1.5">
          <Button
            ref={volver}
            data-region="Volver"
            variant="ghost"
            size="sm"
            className="max-w-full text-muted-foreground!"
            aria-label={`Volver a ${padre.titulo}`}
            onClick={() => onOpenChange(false)}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} aria-hidden="true" />
            <span className="truncate">{padre.titulo}</span>
          </Button>
        </div>
        {navigation}
        <Cabecera
          visual={<Visual media={media} ai={ai} icon={icon} />}
          kicker={kicker}
          titulo={
            <h2 id={tituloId} data-region="Título" className={cn('cn-drawer-title cn-font-heading', TITULO)}>
              {title}
            </h2>
          }
          badge={badge}
          bajada={
            description ? (
              <p data-region="Descripción" className="cn-drawer-description text-left text-balance">
                {description}
              </p>
            ) : null
          }
          cerrar={
            // La X estándar de ventanas y tarjetas (auditoría, 5 oct): cierra todo el panel, no solo esta vista.
            <span data-region="Cerrar" className="flex shrink-0">
              <CloseButton
                label="Cerrar el panel"
                onClick={() => {
                  onOpenChange(false)
                  padre.cerrarPanel()
                }}
              />
            </span>
          }
        />
        {headerExtra}
        <Cuerpo footer={footer} footerClassName={footerClassName} footerRegion={footerRegion}>
          {children}
        </Cuerpo>
      </ContextoPanel.Provider>
    </section>,
    padre.capa,
  )
}

function Visual({ media, ai, icon }: { media?: ReactNode; ai: boolean; icon?: IconSvgElement }) {
  const visual =
    media ??
    (ai ? (
      <Orb className="size-9 shrink-0" />
    ) : icon ? (
      <IconTile variant="soft" size="sm">
        <HugeiconsIcon icon={icon} />
      </IconTile>
    ) : null)
  return visual ? (
    <span data-region="Imagen" className="shrink-0">
      {visual}
    </span>
  ) : null
}

function Cabecera({
  visual,
  kicker,
  titulo,
  badge,
  bajada,
  cerrar,
}: {
  visual: ReactNode
  kicker?: string
  titulo: ReactNode
  badge?: ReactNode
  bajada: ReactNode
  cerrar: ReactNode
}) {
  return (
    <DrawerHeader className="flex-row! items-start gap-3 border-b px-5! pt-4! pb-4! text-left!">
      {visual}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {kicker ? (
          <div data-region="Antetítulo" className={KICKER}>
            {kicker}
          </div>
        ) : null}
        <div className="flex flex-col gap-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {titulo}
            {badge ? <span data-region="Estado">{badge}</span> : null}
          </div>
          {bajada}
        </div>
      </div>
      {cerrar}
    </DrawerHeader>
  )
}

function Cuerpo({
  footer,
  footerClassName,
  footerRegion,
  children,
}: {
  footer?: ReactNode
  footerClassName?: string
  footerRegion: string
  children: ReactNode
}) {
  return (
    <>
      <div ref={scrollFocus} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {children}
      </div>
      {footer ? (
        <DrawerFooter
          data-region={footerRegion}
          className={cn('flex-row! items-center justify-end gap-2 border-t bg-muted/40 px-5! py-3!', footerClassName)}
        >
          {footer}
        </DrawerFooter>
      ) : null}
    </>
  )
}
