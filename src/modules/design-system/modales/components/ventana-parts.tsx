import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Heading,
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  cn,
} from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { CloseButton } from '@/shared/components/CloseButton'
import { Orb } from '@/shared/components/Orb'
import { notify } from '@/shared/components/notify'
import { SlotArea } from '../../components/anatomy/anatomy-kit'
import { ContenidoTenue } from '../../components/anatomy/pantalla-real'
import { STEP_INDICATOR, STEP_LINE } from '../../drawers/components/drawer-styles'
import { mediaVentana, panelVentana, type VentanaConfig, type VentanaMuestra } from './ventana-config'

// Las partes de ActionDialog según la configuración. La vista previa las dibuja sobre la página con su nombre
// (data-region), con las mismas medidas y clases de la pieza; «Probar en pantalla» abre el ActionDialog de verdad.

type Props = { c: VentanaConfig; s: VentanaMuestra }

// Icono arriba del título (diseño del 6-oct): el orbe si propone el agente. Salir y eliminar son de la ventana de
// confirmar.
export function MediaVentana({ c }: { c: VentanaConfig }) {
  if (c.media === 'none') return null
  return <Orb className="size-9" />
}

// La primera línea del cuerpo: el registro del que se habla, por debajo del título (Heading 6 frente al 4 del título).
export function RegistroVentana({ s }: { s: VentanaMuestra }) {
  return (
    <>
      <Heading as="h3" level={6}>
        {s.lead.titulo}
      </Heading>
      <Text as="span" variant="muted" size="sm">
        {s.lead.detalle}
      </Text>
    </>
  )
}

// Pestañas subrayadas o pasos, al empezar el cuerpo.
function Arriba({ c, s }: Props) {
  const [tab, setTab] = useState('0')
  if (c.under === 'tabs') {
    return (
      <div data-region="Pestañas">
        <Tabs value={Number(tab) < s.tabs.length ? tab : '0'} onValueChange={(valor) => setTab(String(valor))}>
          <TabsList variant="line">
            {s.tabs.map((etiqueta, indice) => (
              <TabsTrigger key={etiqueta} value={String(indice)} className="flex-none px-3">
                {etiqueta}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    )
  }
  if (c.under === 'steps') {
    return (
      <div data-region="Pasos">
        <Stepper value={2} indicators={{ completed: <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> }}>
          <StepperNav className="w-full">
            {s.steps.map((etiqueta, indice) => (
              <StepperItem key={etiqueta} step={indice + 1} completed={indice + 1 < 2} className="flex-1 last:flex-none">
                {/* De muestra: sin panel asociado, así que sin el aria-controls que apunta a un panel que no existe. */}
                <StepperTrigger className="gap-2" tabIndex={-1} aria-controls={undefined}>
                  <StepperIndicator className={STEP_INDICATOR}>{indice + 1}</StepperIndicator>
                  <StepperTitle className="text-sm whitespace-nowrap">{etiqueta}</StepperTitle>
                </StepperTrigger>
                {indice < s.steps.length - 1 ? <StepperSeparator className={`mx-3 flex-1 ${STEP_LINE}`} /> : null}
              </StepperItem>
            ))}
          </StepperNav>
        </Stepper>
      </div>
    )
  }
  return null
}

// Los botones de un pie propio: los de en medio con contorno y el último, el principal (o rojo si borra).
function BotonesPropios({ s, onDone }: { s: VentanaMuestra; onDone: () => void }) {
  return (
    <>
      {s.propio.map((etiqueta, indice) => {
        const ultimo = indice === s.propio.length - 1
        return (
          <Button
            key={etiqueta}
            variant={ultimo ? (s.destructiva ? 'destructive' : 'default') : 'outline'}
            onClick={() => {
              // El primero es la salida segura: solo cierra.
              if (indice > 0) notify(etiqueta, undefined, 'info')
              onDone()
            }}
          >
            {etiqueta}
          </Button>
        )
      })}
    </>
  )
}

// Ancho real de cada tamaño (los de ActionDialog); si la vista previa es más angosta, el panel se ajusta a ella.
const ANCHO: Record<VentanaConfig['size'], string> = {
  sm: 'w-md',
  default: 'w-155',
  wide: 'w-184',
  full: 'w-full flex-1',
}

// La página que queda detrás: bloques tenues, sin nombres (no es parte de la ventana).
function PaginaDetras() {
  return (
    <div aria-hidden="true" className="absolute inset-0 flex flex-col gap-3 p-8">
      <div className="h-2.5 w-24 rounded-full bg-foreground/10" />
      <div className="h-7 w-64 rounded-md bg-foreground/12" />
      <div className="h-2.5 w-96 max-w-full rounded-full bg-foreground/8" />
      <div className="mt-4 flex flex-1 flex-col gap-2.5 rounded-xl border bg-background/70 p-4">
        {Array.from({ length: 12 }, (_, indice) => (
          <div key={indice} className="h-7 rounded-md bg-foreground/5" />
        ))}
      </div>
      <span className="absolute bottom-3 left-8 text-xs text-muted-foreground">Página de fondo</span>
    </div>
  )
}

// Vista previa: ActionDialog dibujado sobre la página oscurecida, a 120 px del borde de arriba (o a pantalla completa).
// Mismas clases que la pieza: cabecera `px-6 pt-5.5 pb-4`, registro, cuerpo `px-6 pb-2` y pie gris `px-6 py-4`.
export function VentanaPreview({ config: c, sample: s }: { config: VentanaConfig; sample: VentanaMuestra }) {
  const full = c.size === 'full'
  const pie = c.footer !== 'ninguno'

  return (
    <div
      data-region="Fondo oscurecido"
      className={cn('relative flex min-h-176 flex-col items-center rounded-2xl border bg-muted/40', full ? 'p-4' : 'px-6 pt-30 pb-10')}
    >
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-2xl">
        <PaginaDetras />
        {/* Oscurece en los dos temas: en oscuro, con el fondo del tema (el color de texto aclararía). */}
        <div className="absolute inset-0 bg-foreground/25 dark:bg-background/60" />
      </div>

      <div
        data-region={panelVentana(c)}
        className={cn('relative z-10 flex max-w-full flex-col overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10', ANCHO[c.size])}
      >
        <div className="flex items-start gap-4 px-6 pt-5.5 pb-4">
          {c.back ? (
            <span data-region="Volver" className="-ml-2 flex shrink-0">
              <BotonIcono className="text-muted-foreground!" aria-label="Volver" onClick={() => notify('Vuelve al paso anterior', undefined, 'info')}>
                <HugeiconsIcon icon={ArrowLeft01Icon} size={18} aria-hidden="true" />
              </BotonIcono>
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            {c.media !== 'none' ? (
              <div data-region={mediaVentana(c)} className="mb-3.5 flex">
                <MediaVentana c={c} />
              </div>
            ) : null}
            <div data-region="Título">
              <Heading as="h2" level={4}>
                {s.title}
              </Heading>
            </div>
            {c.sub ? (
              <div data-region="Bajada" className="mt-2">
                <Text as="p" variant="muted" size="sm" className="leading-relaxed">
                  {s.sub}
                </Text>
              </div>
            ) : null}
          </div>
          {c.headerActions ? (
            <div data-region="Junto a la X" className="flex shrink-0 items-center gap-2">
              <Badge variant="secondary">{s.headerAction}</Badge>
            </div>
          ) : null}
          <span data-region="Cerrar" className="flex shrink-0">
            <CloseButton label="Cerrar" onClick={() => notify('La ventana se cierra', undefined, 'info')} />
          </span>
        </div>

        {c.lead ? (
          <div data-region="Registro" className="mx-6 mb-4 flex flex-col gap-0.5">
            <RegistroVentana s={s} />
          </div>
        ) : null}

        {c.under !== 'none' || c.body ? (
          <div className={cn('flex min-h-0 flex-1 flex-col gap-4 px-6 pb-2', full && 'min-h-96')}>
            <Arriba c={c} s={s} />
            {c.body ? <SlotArea name="Cuerpo" hint={s.slot} className={c.size === 'sm' ? 'min-h-28' : 'min-h-40'} /> : null}
          </div>
        ) : null}

        {pie ? (
          <div data-region="Pie" className="mt-auto flex items-center gap-2 border-t bg-muted px-6 py-4">
            <span className="min-w-0 flex-1 text-sm text-muted-foreground">
              {c.note && s.note ? <span data-region="Nota">{s.note}</span> : null}
            </span>
            {c.footer === 'propio' ? (
              <span data-region="Acción" className="flex flex-wrap justify-end gap-2">
                <BotonesPropios s={s} onDone={() => undefined} />
              </span>
            ) : (
              <>
                <Button variant="outline">{s.cancel}</Button>
                <span data-region="Acción" className="flex">
                  <Button onClick={() => notify(s.confirm, undefined, 'success')}>{s.confirm}</Button>
                </span>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// «Probar en pantalla»: el ActionDialog de verdad, armado con la configuración. `children` reemplaza el cuerpo.
export function VentanaDePrueba({
  open,
  onOpenChange,
  config: c,
  sample: s,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: VentanaConfig
  sample: VentanaMuestra
  children?: ReactNode
}) {
  const cerrar = () => onOpenChange(false)
  const cuerpo =
    c.under !== 'none' || c.body ? (
      <>
        <Arriba c={c} s={s} />
        {c.body ? (children ?? <ContenidoTenue filas={c.size === 'sm' ? 2 : 4} className={c.size === 'full' ? 'min-h-96' : undefined} />) : null}
      </>
    ) : undefined

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      size={c.size}
      title={s.title}
      sub={c.sub ? s.sub : undefined}
      media={c.media !== 'none' ? <MediaVentana c={c} /> : undefined}
      onBack={c.back ? () => notify('Vuelve al paso anterior', undefined, 'info') : undefined}
      headerActions={c.headerActions ? <Badge variant="secondary">{s.headerAction}</Badge> : undefined}
      lead={c.lead ? <RegistroVentana s={s} /> : undefined}
      note={c.note ? s.note : undefined}
      cancelLabel={s.cancel}
      confirmLabel={s.confirm}
      pendingLabel={c.pending ? s.pending : undefined}
      onConfirm={() => notify(s.confirm, undefined, 'success')}
      dismissible={c.dismissible}
      hideFooter={c.footer === 'ninguno'}
      footer={c.footer === 'propio' ? <BotonesPropios s={s} onDone={cerrar} /> : undefined}
    >
      {cuerpo}
    </ActionDialog>
  )
}
