import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, File01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  ButtonGroup,
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
import { CloseButton } from '@/shared/components/CloseButton'
import { Orb } from '@/shared/components/Orb'
import { notify } from '@/shared/components/notify'
import { SlotArea } from '../../components/anatomy/anatomy-kit'
import { panelLabel, type DrawerConfig, type DrawerSample } from './drawer-config'
import { DrawerShell } from './drawer-shell'
import { ContenidoTenue } from '../../components/anatomy/pantalla-real'
import { Composer } from '@/modules/admin/suite-ai/shared/composer'
import { KICKER, PILL, STEP_INDICATOR, STEP_LINE, WS } from './drawer-styles'

type PartProps = { c: DrawerConfig; s: DrawerSample }

// Piezas del drawer armadas según la configuración. Las usan tanto la vista previa (dibujada en la página) como el
// drawer real que se abre con «Probar en pantalla», así los dos se ven igual. Cada una lleva su nombre (data-region).

// Navegación sobre la cabecera: volver al drawer anterior o pasar entre registros.
function NavRow({ c, s }: PartProps) {
  const shape = c.ai ? PILL : WS
  if (c.nav === 'back') {
    return (
      <div className="flex items-center border-b px-3 py-1.5">
        <Button data-region="Volver" variant="ghost" size="sm" className={cn(shape, 'text-muted-foreground!')} onClick={() => notify(`Volver a ${s.back}`, undefined, 'info')}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          {s.back}
        </Button>
      </div>
    )
  }
  if (c.nav === 'records') {
    return (
      <div className="flex items-center justify-end border-b px-4 py-1.5">
        <div data-region="Anterior / siguiente" className="flex items-center gap-2.5">
          <span className="text-[13px] text-muted-foreground tabular-nums">3 de 18</span>
          <ButtonGroup>
            <Button variant="outline" size="icon-xs" aria-label="Registro anterior" onClick={() => notify('Registro anterior', undefined, 'info')}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            </Button>
            <Button variant="outline" size="icon-xs" aria-label="Registro siguiente" onClick={() => notify('Registro siguiente', undefined, 'info')}>
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </Button>
          </ButtonGroup>
        </div>
      </div>
    )
  }
  return null
}

// Imagen de la cabecera: icono, avatar u orbe.
function Media({ c, s }: PartProps) {
  if (c.media === 'none') return null
  if (c.media === 'icon') {
    return (
      <IconTile variant="soft" size="sm">
        <HugeiconsIcon icon={s.icon} />
      </IconTile>
    )
  }
  if (c.media === 'avatar') {
    return (
      <Avatar size="lg">
        <AvatarFallback>{s.initials}</AvatarFallback>
      </Avatar>
    )
  }
  return <Orb className="size-9" />
}

// Bajo la cabecera: franja de contexto y pestañas, pasos o progreso.
function Under({ c, s }: PartProps) {
  const [tab, setTab] = useState('0')
  const tabValue = Number(tab) < s.tabs.length ? tab : '0'

  return (
    <>
      {c.context ? (
        <div className="border-b bg-muted px-5 py-2.5">
          <div data-region="Contexto" className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <HugeiconsIcon icon={File01Icon} className="size-4 shrink-0" />
            Contexto: <span className="truncate text-foreground">{s.context}</span>
          </div>
        </div>
      ) : null}

      {c.under === 'tabs' ? (
        <div className={cn('px-5', c.tabs === 'line' ? 'pt-1' : 'border-b py-2.5')}>
          <div data-region="Pestañas">
            <Tabs value={tabValue} onValueChange={(value) => setTab(String(value))}>
              <TabsList variant={c.tabs} className={c.tabs === 'default' ? 'w-full' : undefined}>
                {s.tabs.map((label, index) => (
                  <TabsTrigger key={label} value={String(index)} className={c.tabs === 'line' ? 'flex-none px-3' : undefined}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      ) : null}

      {c.under === 'steps' ? (
        <div className="border-b px-5 py-3">
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
      ) : null}

      {c.under === 'progress' ? (
        <div className="border-b px-5 py-3">
          <div data-region="Progreso">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{s.progress.label}</span>
              <span className="tabular-nums">{s.progress.value}%</span>
            </div>
            <Progress value={s.progress.value} aria-label={s.progress.label} className="mt-2 **:data-[slot=progress-track]:h-1!" />
          </div>
        </div>
      ) : null}
    </>
  )
}

// Botones del pie (o la caja para escribirle al agente).
// Caja de conversación del pie: la del chat de Suite AI, la misma del panel del agente contextual (22 sep). Antes era
// una caja propia sin «+» ni voz.
function ComposerPie({ placeholder }: { placeholder: string }) {
  const [draft, setDraft] = useState('')
  return (
    <div className="w-full">
      <Composer
        value={draft}
        onChange={setDraft}
        onSend={() => {
          setDraft('')
          notify('Pregunta enviada', undefined, 'success')
        }}
        placeholder={placeholder}
        onVoice={() => notify('El modo voz se abre desde el chat de Orbit', undefined, 'info')}
        contextNote=""
      />
    </div>
  )
}

function FooterContent({ c, s, onDone }: PartProps & { onDone?: () => void }) {
  const shape = c.ai ? PILL : WS
  const act = (label: string) => () => {
    notify(label, undefined, 'info')
    onDone?.()
  }

  if (c.footer === 'composer') return <ComposerPie placeholder={s.composer} />
  if (c.footer === 'one') {
    return (
      <Button className={shape} onClick={act(s.one)}>
        {s.one}
      </Button>
    )
  }
  if (c.footer === 'split') {
    return (
      <>
        <Button variant="ghost" className={cn('mr-auto', shape)} onClick={act(s.left)}>
          {s.left}
        </Button>
        <Button className={shape} onClick={act(s.primary)}>
          {s.primary}
        </Button>
      </>
    )
  }
  return (
    <>
      <Button variant="outline" className={shape} onClick={act(s.secondary)}>
        {s.secondary}
      </Button>
      <Button className={shape} onClick={act(s.primary)}>
        {s.primary}
      </Button>
    </>
  )
}

const POSITION: Record<DrawerConfig['direction'], string> = {
  right: 'top-3 right-3 bottom-3 rounded-2xl border',
  left: 'top-3 bottom-3 left-3 rounded-2xl border',
  bottom: 'inset-x-0 bottom-0 mx-auto max-h-[85%] w-full max-w-2xl rounded-t-3xl border border-b-0',
  top: 'inset-x-0 top-0 mx-auto max-h-[85%] w-full max-w-2xl rounded-b-3xl border border-t-0',
}

// Ancho real del drawer; si la vista previa es más angosta, el panel se ajusta a ella.
const WIDTH: Record<DrawerConfig['size'], string> = {
  sm: 'w-[24rem] max-w-[calc(100%-1.5rem)]',
  md: 'w-[30rem] max-w-[calc(100%-1.5rem)]',
  lg: 'w-[36rem] max-w-[calc(100%-1.5rem)]',
}

// Esquinas de abajo del pie, para que su fondo no se salga del panel (el panel no recorta: recortaría los nombres).
const FOOTER_CORNERS: Record<DrawerConfig['direction'], string> = {
  right: 'rounded-b-2xl',
  left: 'rounded-b-2xl',
  bottom: '',
  top: '',
}

// La página que queda detrás del drawer: bloques tenues, sin nombres (no es parte del drawer).
function PageBehind() {
  return (
    <div aria-hidden="true" className="absolute inset-0 flex flex-col gap-3 p-8">
      <div className="h-2.5 w-24 rounded-full bg-foreground/10" />
      <div className="h-7 w-64 rounded-md bg-foreground/12" />
      <div className="h-2.5 w-96 max-w-full rounded-full bg-foreground/8" />
      <div className="mt-4 flex flex-1 flex-col gap-2.5 rounded-xl border bg-background/70 p-4">
        {Array.from({ length: 9 }, (_, index) => (
          <div key={index} className="h-7 rounded-md bg-foreground/5" />
        ))}
      </div>
      <span className="absolute bottom-3 left-8 text-xs text-muted-foreground">Página de fondo</span>
    </div>
  )
}

function Handle() {
  return <div data-region="Tirador" className="mx-auto my-2.5 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30" />
}

// Vista previa: el drawer dibujado sobre una página de fondo oscurecida, en su borde y con su ancho.
export function DrawerPreview({ config: c, sample: s }: { config: DrawerConfig; sample: DrawerSample }) {
  const side = c.direction === 'right' || c.direction === 'left'

  return (
    <div className="relative h-[44rem] rounded-2xl border bg-muted/40">
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <PageBehind />
        <div aria-hidden="true" className="absolute inset-0 bg-foreground/15" />
      </div>

      <div data-region={panelLabel(c)} className={cn('absolute flex flex-col bg-background text-foreground shadow-xl', POSITION[c.direction], side && WIDTH[c.size])}>
        {c.direction === 'bottom' ? <Handle /> : null}
        <NavRow c={c} s={s} />
        <div className="flex items-start gap-3 border-b px-5 pt-4 pb-4">
          {c.media !== 'none' ? (
            <span data-region="Imagen" className="shrink-0">
              <Media c={c} s={s} />
            </span>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {c.kicker ? (
              <div data-region="Antetítulo" className={KICKER}>
                {s.kicker}
              </div>
            ) : null}
            <div className="flex flex-col gap-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <div data-region="Título" className="text-base font-semibold">
                  {s.title}
                </div>
                {c.badge ? (
                  <span data-region="Estado">
                    <Badge variant="secondary">{s.badge}</Badge>
                  </span>
                ) : null}
              </div>
              {c.description ? (
                <div data-region="Descripción" className="text-sm text-muted-foreground">
                  {s.description}
                </div>
              ) : null}
            </div>
          </div>
          {/* La misma X estándar del drawer real (CloseButton). */}
          <span data-region="Cerrar" className="flex shrink-0">
            <CloseButton label="Cerrar" onClick={() => notify('El drawer se cierra', undefined, 'info')} />
          </span>
        </div>
        <Under c={c} s={s} />
        <div className="flex min-h-0 flex-1 flex-col px-5 py-4">
          <SlotArea name="Cuerpo" hint={s.slot} className="min-h-28" />
        </div>
        {c.footer !== 'none' ? (
          <div
            data-region={c.footer === 'composer' ? 'Caja de conversación' : 'Pie'}
            className={cn(
              'flex items-center justify-end gap-2 border-t py-3',
              c.footer === 'composer' ? 'bg-background px-4' : 'bg-muted/40 px-5',
              FOOTER_CORNERS[c.direction],
            )}
          >
            <FooterContent c={c} s={s} />
          </div>
        ) : null}
        {c.direction === 'top' ? <Handle /> : null}
      </div>
    </div>
  )
}

// El mismo drawer, de verdad (Drawer de flux-ui), con el cuerpo como slot.
export function ConfiguredDrawer({
  open,
  onOpenChange,
  config: c,
  sample: s,
  bare = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: DrawerConfig
  sample: DrawerSample
  // «Probar en pantalla»: el cuerpo con contenido tenue en vez del slot rayado.
  bare?: boolean
}) {
  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      direction={c.direction}
      size={c.size}
      ai={c.ai}
      title={s.title}
      description={c.description ? s.description : undefined}
      kicker={c.kicker ? s.kicker : undefined}
      badge={c.badge ? <Badge variant="secondary">{s.badge}</Badge> : undefined}
      media={<Media c={c} s={s} />}
      navigation={<NavRow c={c} s={s} />}
      headerExtra={<Under c={c} s={s} />}
      footer={c.footer === 'none' ? undefined : <FooterContent c={c} s={s} onDone={() => onOpenChange(false)} />}
      footerClassName={c.footer === 'composer' ? 'bg-background! px-4!' : undefined}
      footerRegion={c.footer === 'composer' ? 'Caja de conversación' : 'Pie'}
    >
      {bare ? <ContenidoTenue filas={4} className="h-full min-h-60" /> : <SlotArea name="Cuerpo" hint={s.slot} className="h-full min-h-60" />}
    </DrawerShell>
  )
}
