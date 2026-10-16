import { useId, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, CheckmarkCircle02Icon, InformationCircleIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertTitle,
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  FieldLabel,
  IconTile,
  Progress,
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
  cn,
} from '@ubits/flux-ui'
import promoBg from '@/shared/assets/promo-seleccion.jpg'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { CloseButton } from '@/shared/components/CloseButton'
import { Hint } from '@/shared/components/Hint'
import { Orb } from '@/shared/components/Orb'
import { notify } from '@/shared/components/notify'
import { SlotArea } from '../../components/anatomy/anatomy-kit'
import { scrollFocus } from '../../components/scroll-focus'
import { KICKER, PILL, STEP_INDICATOR, STEP_LINE, WS } from '../../drawers/components/drawer-styles'
import { ContenidoTenue } from '../../components/anatomy/pantalla-real'
import { mediaLabel, SIN_EJEMPLO, type ModalConfig, type ModalSample } from './modal-config'

// SE RETIRA (decisión 4 de la auditoría, 5-oct): la ventana del sistema es una sola, ActionDialog
// (src/shared/components/ActionDialog.tsx). La página Modales ya no usa ConfiguredModal (su vista previa y su prueba
// son las de ActionDialog, en ventana-parts.tsx); queda aquí solo mientras las pantallas que todavía lo importan pasan
// a ActionDialog. No lo uses en pantallas nuevas.

type PartProps = { c: ModalConfig; s: ModalSample }

// Uso en pantallas reales (p. ej. los modales de recurso de LMS Creator): el título, las acciones y los botones son los
// de la pantalla y no los del ejemplo. Sin `real`, el modal es el del configurador tal cual.
export type ModalReal = {
  title: ReactNode
  /** Para el lector de pantalla; se ve solo si la configuración lleva descripción. */
  description?: string
  /** Flecha a la izquierda del título («Volver» al paso anterior). */
  onBack?: () => void
  /** Junto a la X (p. ej. la insignia de tokens). */
  actions?: ReactNode
  /** Los botones del pie; van en el mismo pie del sistema. */
  footer?: ReactNode
  /** Por defecto el clic afuera cierra, como en la librería. */
  closeOnOutsidePress?: boolean
}

// Piezas del modal armadas según la configuración. Cada parte lleva su nombre (data-region).

const TITLE = 'text-lg! leading-snug! font-semibold!'
const DESCRIPTION = 'text-sm leading-relaxed text-pretty text-muted-foreground'

// La X estándar (pastilla clara). Va envuelta para poder llevar su nombre; el nombre va arriba sin moverla de su
// esquina (si no, la anatomía la bajaría 22px).
function CloseSlot({ className, onClose }: { className?: string; onClose: () => void }) {
  return (
    <span data-region="Cerrar" data-chip="inline" className={cn('flex', className)}>
      <CloseButton label="Cerrar" onClick={onClose} />
    </span>
  )
}

// Icono de la cabecera: normal, de peligro, de éxito u orbe de IA.
function MediaVisual({ c, s }: PartProps) {
  if (c.media === 'orb') return <Orb className="size-11" />
  const tone = c.media === 'danger' ? 'text-destructive' : c.media === 'success' ? 'text-success' : undefined
  return (
    <IconTile variant="soft" size="lg" className={tone}>
      <HugeiconsIcon icon={c.media === 'success' ? CheckmarkCircle02Icon : s.icon} />
    </IconTile>
  )
}

// Ilustración arriba a lo ancho, con la X encima.
function Illustration({ c, preview, onClose }: PartProps & { preview?: boolean; onClose: () => void }) {
  return (
    <div
      data-region="Ilustración"
      data-chip="inside"
      className={cn('relative h-40 shrink-0 bg-cover bg-center', preview && 'rounded-t-2xl')}
      style={{ backgroundImage: `url(${promoBg})` }}
    >
      {c.close && c.kind === 'dialog' ? <CloseSlot className="absolute top-3 right-3" onClose={onClose} /> : null}
    </div>
  )
}

// Cabecera: icono, antetítulo, título con estado, descripción y la X.
function Header({
  c,
  s,
  title,
  description,
  onClose,
  onBack,
  actions,
}: PartProps & { title: ReactNode; description: ReactNode; onClose: () => void; onBack?: () => void; actions?: ReactNode }) {
  const center = c.align === 'center'
  const close = c.close && c.kind === 'dialog' && c.media !== 'image'
  const icon = c.media !== 'none' && c.media !== 'image'

  return (
    <div
      className={cn(
        'relative flex flex-col gap-1 px-6 pt-6 pb-5',
        center ? 'items-center text-center' : 'items-start text-left',
        close && (center ? 'px-14' : 'pr-14'),
        actions && 'pr-44',
      )}
    >
      {icon ? (
        <div data-region={mediaLabel(c)} className="mb-2 flex">
          <MediaVisual c={c} s={s} />
        </div>
      ) : null}
      {c.kicker ? (
        // El estilo va adentro: si no, el nombre de la parte también saldría en mayúsculas.
        <div data-region="Antetítulo" className="flex">
          <span className={KICKER}>{s.kicker}</span>
        </div>
      ) : null}
      <div className={cn('flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1', center && 'justify-center')}>
        {onBack ? (
          <Hint label="Volver">
            <BotonIcono aria-label="Volver" onClick={onBack} className="-my-1 -ml-2">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </BotonIcono>
          </Hint>
        ) : null}
        {title}
        {c.badge ? (
          <span data-region="Estado" className="flex">
            <Badge variant="secondary">{s.badge}</Badge>
          </span>
        ) : null}
      </div>
      {c.description ? description : null}
      {actions ? (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {actions}
          {close ? <CloseSlot onClose={onClose} /> : null}
        </div>
      ) : close ? (
        <CloseSlot className="absolute top-4 right-4" onClose={onClose} />
      ) : null}
    </div>
  )
}

// Bajo la cabecera: pasos, progreso o pestañas.
function Under({ c, s }: PartProps) {
  const [tab, setTab] = useState('0')
  const tabValue = Number(tab) < s.tabs.length ? tab : '0'

  if (c.under === 'steps') {
    return (
      <div className="px-6 pb-5">
        <div data-region="Pasos">
          <Stepper value={2} indicators={{ completed: <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> }}>
            <StepperNav className="w-full">
              {s.steps.map((label, index) => (
                <StepperItem key={label} step={index + 1} completed={index + 1 < 2} className="flex-1 last:flex-none">
                  {/* De muestra: sin panel asociado, así que sin el aria-controls que apunta a un panel que no existe. */}
                  <StepperTrigger className="gap-2" tabIndex={-1} aria-controls={undefined}>
                    <StepperIndicator className={STEP_INDICATOR}>{index + 1}</StepperIndicator>
                    <StepperTitle className="text-sm whitespace-nowrap">{label}</StepperTitle>
                  </StepperTrigger>
                  {index < s.steps.length - 1 ? <StepperSeparator className={`mx-3 flex-1 ${STEP_LINE}`} /> : null}
                </StepperItem>
              ))}
            </StepperNav>
          </Stepper>
        </div>
      </div>
    )
  }
  if (c.under === 'progress') {
    return (
      <div className="px-6 pb-5">
        <div data-region="Progreso">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{s.progress.label}</span>
            <span className="tabular-nums">{s.progress.right ?? `${s.progress.value}%`}</span>
          </div>
          <Progress value={s.progress.value} aria-label={s.progress.label} className="mt-2 **:data-[slot=progress-track]:h-1!" />
        </div>
      </div>
    )
  }
  if (c.under === 'tabs') {
    return (
      <div className="border-b px-6">
        <div data-region="Pestañas">
          <Tabs value={tabValue} onValueChange={(value) => setTab(String(value))}>
            <TabsList variant="line">
              {s.tabs.map((label, index) => (
                <TabsTrigger key={label} value={String(index)} className="flex-none px-3">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
    )
  }
  return null
}

const NOTICE_ICON = {
  warning: Alert02Icon,
  destructive: Alert02Icon,
  info: InformationCircleIcon,
  success: CheckmarkCircle02Icon,
}

// Aviso dentro de la ventana (Alert de flux-ui).
function Notice({ s }: { s: ModalSample }) {
  return (
    <div data-region="Aviso" className="text-left">
      <Alert variant={s.notice.tone}>
        <HugeiconsIcon icon={NOTICE_ICON[s.notice.tone]} />
        <AlertTitle>{s.notice.title}</AlertTitle>
        <AlertDescription>{s.notice.text}</AlertDescription>
      </Alert>
    </div>
  )
}

// Casilla «No volver a mostrar».
function DontShow() {
  const id = useId()
  const [checked, setChecked] = useState(false)
  return (
    <div data-region="No volver a mostrar" className="flex">
      <Field orientation="horizontal" className="w-auto">
        <Checkbox id={id} checked={checked} onCheckedChange={(value) => setChecked(Boolean(value))} />
        <FieldLabel htmlFor={id}>No volver a mostrar</FieldLabel>
      </Field>
    </div>
  )
}

// Botones del pie. La casilla va a la izquierda cuando cabe en la misma fila.
function Footer({
  c,
  s,
  preview,
  withCheckbox,
  onDone,
  children,
}: PartProps & { preview?: boolean; withCheckbox: boolean; onDone: () => void; children?: ReactNode }) {
  const shape = c.ai ? PILL : WS
  const act = (label: string) => () => {
    notify(label)
    onDone()
  }
  const stacked = c.footer === 'stacked'
  const centered = c.align === 'center' && !withCheckbox && c.footer !== 'split'

  return (
    <div
      data-region="Pie"
      className={cn(
        'flex gap-2 border-t bg-muted/40 px-6 py-3.5',
        stacked ? 'flex-col' : 'items-center',
        centered ? 'justify-center' : 'justify-end',
        preview && 'rounded-b-2xl',
      )}
    >
      {withCheckbox ? (
        <div className="mr-auto">
          <DontShow />
        </div>
      ) : null}
      {children}
      {children ? null : c.footer === 'one' ? (
        <Button className={shape} onClick={act(s.one)}>
          {s.one}
        </Button>
      ) : null}
      {c.footer === 'two' ? (
        <>
          <Button variant="outline" className={shape} onClick={act(s.secondary)}>
            {s.secondary}
          </Button>
          <Button className={shape} onClick={act(s.primary)}>
            {s.primary}
          </Button>
        </>
      ) : null}
      {c.footer === 'destructive' ? (
        <>
          <Button variant="outline" className={shape} onClick={act(s.secondary)}>
            {s.secondary}
          </Button>
          <Button variant="destructive" className={shape} onClick={act(s.danger)}>
            {s.danger}
          </Button>
        </>
      ) : null}
      {c.footer === 'split' ? (
        <>
          <Button variant="ghost" className={cn('mr-auto', shape)} onClick={act(s.left)}>
            {s.left}
          </Button>
          <Button className={shape} onClick={act(s.primary)}>
            {s.primary}
          </Button>
        </>
      ) : null}
      {stacked ? (
        <>
          <Button className={cn('w-full', shape)} onClick={act(s.primary)}>
            {s.primary}
          </Button>
          <Button variant="outline" className={cn('w-full', shape)} onClick={act(s.secondary)}>
            {s.secondary}
          </Button>
        </>
      ) : null}
    </div>
  )
}

type LayoutProps = PartProps & {
  title: ReactNode
  description: ReactNode
  body: ReactNode
  preview?: boolean
  onClose: () => void
  onDone: () => void
  real?: ModalReal
}

// El modal completo de arriba abajo: ilustración, cabecera, pasos, aviso y cuerpo, casilla y pie.
function ModalLayout({ c, s, title, description, body, preview, onClose, onDone, real }: LayoutProps) {
  const inFooter = c.dontShow && (c.footer === 'one' || c.footer === 'two' || c.footer === 'destructive')
  const ownRow = c.dontShow && !inFooter

  return (
    <>
      {c.media === 'image' ? <Illustration c={c} s={s} preview={preview} onClose={onClose} /> : null}
      <Header c={c} s={s} title={title} description={description} onClose={onClose} onBack={real?.onBack} actions={real?.actions} />
      <Under c={c} s={s} />
      {c.notice || c.body ? (
        <div
          ref={preview ? undefined : scrollFocus}
          className={cn('flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6', c.under === 'tabs' && 'pt-5', !preview && 'overflow-y-auto')}
        >
          {c.notice ? <Notice s={s} /> : null}
          {c.body ? body : null}
        </div>
      ) : null}
      {ownRow ? (
        <div className={cn('flex px-6 pb-4', c.align === 'center' && 'justify-center')}>
          <DontShow />
        </div>
      ) : null}
      {real?.footer ? (
        <Footer c={c} s={s} preview={preview} withCheckbox={inFooter} onDone={onDone}>
          {real.footer}
        </Footer>
      ) : c.footer !== 'none' ? (
        <Footer c={c} s={s} preview={preview} withCheckbox={inFooter} onDone={onDone} />
      ) : null}
    </>
  )
}

// Tamaños del modal real (flux-ui). Pantalla completa deja 16px de aire alrededor.
const REAL_WIDTH: Record<ModalConfig['size'], string> = {
  sm: 'sm:max-w-sm!',
  md: 'sm:max-w-md!',
  lg: 'sm:max-w-xl!',
  xl: 'sm:max-w-3xl!',
  full: 'h-[calc(100svh-2rem)] sm:max-w-[calc(100%-2rem)]!',
}

const REAL_BODY: Record<ModalConfig['size'], string> = {
  sm: 'min-h-32',
  md: 'min-h-40',
  lg: 'min-h-52',
  xl: 'min-h-96',
  full: 'h-full min-h-60',
}

const PANEL = 'flex! max-h-[calc(100svh-2rem)] flex-col gap-0! overflow-hidden rounded-2xl! p-0!'

// Arriba: a 96px del borde, como el buscador.
const TOP = 'top-24! translate-y-0!'

// El mismo modal, de verdad: Dialog o AlertDialog de flux-ui. `children` reemplaza el slot del cuerpo.
export function ConfiguredModal({
  open,
  onOpenChange,
  config: c,
  sample,
  children,
  bare = false,
  real,
  panelClassName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: ModalConfig
  sample?: ModalSample
  children?: ReactNode
  // «Probar en pantalla»: el cuerpo con contenido tenue en vez del slot rayado.
  bare?: boolean
  // En una pantalla real: título, acciones y botones propios (ver ModalReal).
  real?: ModalReal
  // Clases de layout para el panel, cuando la pantalla necesita algo que la configuración no cubre. Hoy solo se usa
  // para fijarle un alto (`h-[70svh]`): el panel ya es una columna flex con el cuerpo scrolleable y el pie pegado
  // abajo, así que darle alto hace que el modal mida siempre lo mismo. No sirve para cambiarle la apariencia.
  panelClassName?: string
}) {
  const s = sample ?? SIN_EJEMPLO
  const close = () => onOpenChange(false)
  const className = cn(PANEL, REAL_WIDTH[c.size], c.position === 'top' && c.size !== 'full' && TOP, panelClassName)
  const body =
    children ?? (bare ? <ContenidoTenue filas={3} className={REAL_BODY[c.size]} /> : <SlotArea name="Cuerpo" hint={s.slot} className={REAL_BODY[c.size]} />)

  if (c.kind === 'alert') {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className={className}>
          <ModalLayout
            c={c}
            s={s}
            title={
              <AlertDialogTitle data-region="Título" className={TITLE}>
                {s.title}
              </AlertDialogTitle>
            }
            description={
              <AlertDialogDescription data-region="Descripción" className={DESCRIPTION}>
                {s.description}
              </AlertDialogDescription>
            }
            body={body}
            onClose={close}
            onDone={close}
          />
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(abrir, detalle) => {
        if (!abrir && real?.closeOnOutsidePress === false && detalle?.reason === 'outside-press') return
        onOpenChange(abrir)
      }}
    >
      <DialogContent showCloseButton={false} className={className}>
        <ModalLayout
          c={c}
          s={s}
          title={
            <DialogTitle data-region="Título" className={TITLE}>
              {real ? real.title : s.title}
            </DialogTitle>
          }
          description={
            <DialogDescription data-region="Descripción" className={DESCRIPTION}>
              {real ? real.description : s.description}
            </DialogDescription>
          }
          body={body}
          onClose={close}
          onDone={close}
          real={real}
        />
        {real?.description && !c.description ? <DialogDescription className="sr-only">{real.description}</DialogDescription> : null}
      </DialogContent>
    </Dialog>
  )
}
