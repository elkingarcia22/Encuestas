import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  ArrowDataTransferHorizontalIcon,
  ArrowRight01Icon,
  CircleLock01Icon,
  LifebuoyIcon,
  Notification01Icon,
  PartyIcon,
  Queue02Icon,
  Search01Icon,
  SidebarLeftIcon,
  Sun03Icon,
} from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Kbd,
  KbdGroup,
  Separator,
  TooltipProvider,
  cn,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import avatarPhoto from '@/shared/assets/avatar-carolina.jpg'
import { ChangelogDialog } from '@/shared/components/Announcements'
import { CommandPalette } from '@/shared/components/CommandPalette'
import { Hint } from '@/shared/components/Hint'
import { HEADER_ICON } from '@/shared/components/header-icon'
import { notify } from '@/shared/components/notify'
import { NOTIFICATIONS } from '@/shared/components/shell-data'
import kit from '../../components/anatomy/anatomy.module.css'
import {
  OPEN_NAME,
  PART,
  RIGHT_NAME,
  headerView,
  type HeaderConfig,
  type HeaderOpen,
  type HeaderSample,
  type RightAction,
  type TipTarget,
} from './header-config'
import styles from './header-preview.module.css'

// Vista previa del header, armada con las mismas piezas y clases del header real (AppHeader y la cabecera del
// editor): botones outline de 32px con icono gris (HEADER_ICON), tooltips con Hint, foto de perfil de 34px y orbe. Son
// réplicas para poder marcar cada parte con su nombre (data-region) y mostrar un menú abierto a pedido. El buscador
// abre el ⌘K real y Novedades abre la ventana real.

// Lo que el header real reserva para las acciones al achicar el buscador (AppHeader: 251px con Novedades completo y
// 166px solo con iconos) y 14px entre columnas. Se cuenta como 34px por botón, Novedades de 119px y 10px entre ellos,
// que da esas mismas cifras. Los botones se dibujan como en el real (auditoría, 5 oct): Novedades, campana y lupa de
// 32px, menú de 30px, foto de 34px y 8px entre acciones.
const ICON_W = 34
const NEWS_W = 119
const GAP = 10
// Con los nombres visibles las acciones se separan más para que sus pastillas no se encimen.
const GAP_NAMES = 30
const COLUMN_GAPS = 28

// Umbrales del header real, sobre su ancho interior (sin los 20px de cada lado).
const COMPACT_BELOW = 880
const LUPA_BELOW = 624

const HINT: Record<RightAction, string> = {
  news: 'Lo nuevo en Ubits',
  notifications: 'Notificaciones',
  processes: 'Centro de procesos',
  profile: 'Tu perfil',
}

const FRAME: Record<HeaderConfig['width'], string> = {
  full: 'w-full',
  panel: 'w-full',
  narrow: 'mx-auto w-full max-w-[36rem]',
  phone: 'mx-auto w-full max-w-[24.375rem]',
}

// Lo que ocupan las acciones de la derecha (el buscador nunca las deja salirse de su columna).
function actionsWidth(actions: RightAction[], gap: number, compact: boolean) {
  if (!actions.length) return 0
  const buttons = actions.reduce((total, id) => total + (id === 'news' && !compact ? NEWS_W : ICON_W), 0)
  return buttons + gap * (actions.length - 1)
}

// Tooltip fijo, dibujado como el de Hint (esquinas de 6px y texto de 14px), colgado bajo su botón.
function PinnedTooltip({ label, align, names }: { label: string; align: 'start' | 'end'; names: boolean }) {
  return (
    <span className={cn('absolute top-full z-30', names ? 'mt-7' : 'mt-2.5', align === 'start' ? 'left-0' : 'right-0')}>
      <span data-region={PART.tooltip} className="relative block w-max rounded-[6px] bg-foreground px-3 py-1.5 text-background">
        <span
          aria-hidden="true"
          className={cn('absolute -top-1 size-2.5 rotate-45 rounded-[2px] bg-foreground', align === 'start' ? 'left-2.5' : 'right-3')}
        />
        <span className="relative text-sm">{label}</span>
      </span>
    </span>
  )
}

// Panel abierto de notificaciones, resumido del real: cabecera, filtros y dos avisos.
function NotificationsPanel({ unread }: { unread: boolean }) {
  return (
    <div
      data-region={OPEN_NAME.notifications}
      className="w-[min(20rem,calc(100cqw-5.5rem))] rounded-md border bg-popover text-left text-popover-foreground shadow-2xl"
    >
      <div className="flex items-center gap-2 px-4 pt-3.75 pb-3">
        <span className="text-[15px] font-medium">Notificaciones</span>
        {unread ? (
          <Badge radius="full" className="h-5! min-w-5! border-0! px-1.5! font-normal!">
            <span className="text-[11px] tabular-nums">3</span>
          </Badge>
        ) : null}
        <span className="ml-auto text-sm text-muted-foreground">Marcar todas</span>
      </div>
      <div className="flex gap-1.5 border-b px-4 pb-3">
        <span className="flex h-7 items-center rounded-full bg-primary px-3 text-[13px] font-medium text-primary-foreground">Todas</span>
        <span className="flex h-7 items-center rounded-full px-3 text-[13px] text-muted-foreground">Sin leer · {unread ? 3 : 0}</span>
      </div>
      {NOTIFICATIONS.slice(0, 2).map((item) => (
        <div key={item.id} className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
            <HugeiconsIcon icon={item.icon} size={16} strokeWidth={1.6} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{item.title}</span>
              {unread ? <span className="size-1.5 shrink-0 rounded-full bg-primary" /> : null}
            </span>
            <span className="truncate text-[13px] text-muted-foreground">{item.text}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

// Menú de perfil abierto, resumido del real: cabecera con foto y las primeras opciones.
function ProfilePanel() {
  const rows = [
    { icon: LifebuoyIcon, label: 'Centro de ayuda' },
    { icon: CircleLock01Icon, label: 'Cambiar contraseña' },
    { icon: Sun03Icon, label: 'Tema' },
  ]
  return (
    <div data-region={OPEN_NAME.profile} className="w-62 rounded-md border bg-popover p-1 text-left text-popover-foreground shadow-lg">
      {/* Igual que el menú real (1 oct): dos tarjetas arriba —quién eres y la vista actual con su cambio al Portal
          colaborador— y las opciones en lista debajo. */}
      <div className="flex flex-col gap-1 p-0.5">
        <div className="flex items-start gap-3 rounded-sm border bg-muted/30 p-2.5">
          <Avatar className="size-10!">
            <AvatarImage src={avatarPhoto} alt="" className="object-cover" />
            <AvatarFallback className="bg-foreground/8! font-medium text-foreground!">
              <span className="text-sm">CV</span>
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 pt-0.5">
            <span className="w-full truncate text-sm leading-tight font-medium">Carolina Vargas</span>
            <span className="w-full truncate text-xs text-muted-foreground">carolina.vargas@meta.com</span>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-sm border bg-muted/30 p-2.5">
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Vista actual</span>
            <span className="truncate text-sm font-medium">Administrador</span>
            <span className="truncate text-xs text-muted-foreground">Meta Colombia</span>
          </span>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-sm border bg-background shadow-xs">
            <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} size={16} />
          </span>
        </div>
      </div>
      <Separator className="my-1" />
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
          <HugeiconsIcon icon={row.icon} size={16} strokeWidth={1.6} className="text-muted-foreground" />
          {row.label}
        </div>
      ))}
    </div>
  )
}

// Envoltorio del panel abierto: cuelga bajo su botón, alineado a la derecha.
function OpenPanel({ id, unread, names }: { id: Exclude<HeaderOpen, 'none'>; unread: boolean; names: boolean }) {
  return (
    <span className={cn('absolute top-full right-0 z-30', names ? 'mt-7' : 'mt-2')}>
      {id === 'notifications' ? <NotificationsPanel unread={unread} /> : <ProfilePanel />}
    </span>
  )
}

// Botón de icono del header con las clases del real: outline de 32px, icono gris y azul con su panel abierto.
function IconAction({
  region,
  label,
  icon,
  large,
  chip,
  open,
  pressed,
  dot,
  onClick,
  below,
}: {
  region: string
  label: string
  icon: IconSvgElement
  large?: boolean
  chip?: 'top'
  open?: boolean
  pressed?: boolean
  dot?: boolean
  onClick: () => void
  below?: ReactNode
}) {
  return (
    <span className="relative inline-flex">
      <Hint label={label}>
        <Button
          data-region={region}
          data-chip={chip}
          variant="outline"
          size="icon-sm"
          aria-label={label}
          aria-expanded={pressed ? undefined : open}
          aria-pressed={pressed ? open : undefined}
          className={cn('relative', HEADER_ICON)}
          onClick={onClick}
        >
          <HugeiconsIcon icon={icon} size={large ? 18 : 17} className={large ? 'size-4.5' : 'size-4.25'} />
          {dot ? <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" /> : null}
        </Button>
      </Hint>
      {below}
    </span>
  )
}

// Perfil: foto circular; con su menú abierto la rodea un anillo azul.
function ProfileAction({ chip, open, onClick, below }: { chip?: 'top'; open: boolean; onClick: () => void; below?: ReactNode }) {
  return (
    <span className="relative inline-flex">
      <Hint label={HINT.profile}>
        <BotonIcono
          data-region={RIGHT_NAME.profile}
          data-chip={chip}
          aria-label="Perfil"
          aria-expanded={open}
          className="size-8.5! border-0! p-0! ring-offset-2 ring-offset-background transition-shadow hover:bg-transparent! hover:ring-2 hover:ring-foreground/10 aria-expanded:ring-2 aria-expanded:ring-primary dark:hover:bg-transparent!"
          onClick={onClick}
        >
          <Avatar className="size-full!">
            <AvatarImage src={avatarPhoto} alt="" className="object-cover" />
            <AvatarFallback className="bg-foreground/8! font-medium text-foreground!">
              <span className="text-[11px]">CV</span>
            </AvatarFallback>
          </Avatar>
        </BotonIcono>
      </Hint>
      {below}
    </span>
  )
}

// La pantalla que queda debajo del header: bloques tenues, sin nombres (no es parte del header).
function PageBehind({ className }: { className: string }) {
  return (
    <div aria-hidden="true" className={cn('flex flex-col gap-2.5 overflow-hidden px-6 pt-5', className)}>
      <div className="h-2.5 w-20 shrink-0 rounded-full bg-foreground/10" />
      <div className="h-6 w-52 max-w-full shrink-0 rounded-md bg-foreground/12" />
      <div className="h-2.5 w-80 max-w-full shrink-0 rounded-full bg-foreground/8" />
      <div className="mt-2 grid min-h-0 flex-1 grid-cols-3 gap-2.5 pb-5">
        {[0, 1, 2].map((item) => (
          <div key={item} className="rounded-xl border bg-foreground/4" />
        ))}
      </div>
    </div>
  )
}

const px = new Intl.NumberFormat('es-CO')

export function HeaderPreview({
  config: c,
  sample: s,
  names,
  onOpen,
  bare,
}: {
  config: HeaderConfig
  sample: HeaderSample
  names: boolean
  onOpen: (open: HeaderOpen) => void
  // «Probar en pantalla»: sin rayado en los slots ni la nota de medidas, y la pantalla de fondo a toda la altura.
  bare?: boolean
}) {
  const v = headerView(c)
  const headerRef = useRef<HTMLElement>(null)
  const [size, setSize] = useState({ outer: 0, inner: 0 })
  const [palette, setPalette] = useState(false)
  const [changelog, setChangelog] = useState(false)

  // Se mide el header para contar qué pasó con el buscador y Novedades a este ancho.
  useEffect(() => {
    const node = headerRef.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      setSize({ outer: Math.round(node.getBoundingClientRect().width), inner: Math.round(entry.contentRect.width) })
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const gap = names ? GAP_NAMES : GAP
  const reserve = 2 * actionsWidth(v.right, gap, false) + COLUMN_GAPS
  const reserveCompact = 2 * actionsWidth(v.right, gap, true) + COLUMN_GAPS
  const vars = { '--hdr-reserve': `${reserve}px`, '--hdr-reserve-compact': `${reserveCompact}px` } as CSSProperties
  // Con los nombres visibles las acciones ocupan más: si al buscador ancho le quedarían menos de 160px, pasa a lupa.
  const room = size.inner - (size.inner < COMPACT_BELOW ? reserveCompact : reserve)
  const squeezed = names && v.search === 'wide' && size.inner >= LUPA_BELOW && room < 160

  const toggle = (id: Exclude<HeaderOpen, 'none'>) => () => onOpen(v.open === id ? 'none' : id)
  // Nombres de botones seguidos alternados arriba y abajo, desde la derecha, para que no se encimen.
  const chip = (id: RightAction) => ((v.right.length - 1 - v.right.indexOf(id)) % 2 === 1 ? 'top' : undefined)
  const tipLabel = (id: TipTarget) => (id === 'menu' ? 'Cerrar menú' : HINT[id])
  const below = (id: TipTarget, panel?: Exclude<HeaderOpen, 'none'>) => (
    <>
      {v.tip === id ? <PinnedTooltip label={tipLabel(id)} align={id === 'menu' ? 'start' : 'end'} names={names} /> : null}
      {panel && v.open === panel ? <OpenPanel id={panel} unread={v.unread} names={names} /> : null}
    </>
  )

  const menuButton = c.menu ? (
    <span className={cn('relative inline-flex shrink-0', !v.general && 'mr-1.5')}>
      <Hint label="Cerrar menú">
        <Button
          data-region={PART.menu}
          variant="outline"
          size="icon-sm"
          aria-label="Cerrar menú"
          className={cn('size-7.5!', HEADER_ICON)}
          onClick={() => notify('Abre o cierra la barra lateral', undefined, 'info')}
        >
          <HugeiconsIcon icon={SidebarLeftIcon} size={16} />
        </Button>
      </Hint>
      {below('menu')}
    </span>
  ) : null

  const left = (
    <div className={cn('flex min-w-0 items-center gap-2')}>
      {menuButton}
      {c.left === 'back' ? (
        <>
          <Button
            data-region={PART.back}
            data-chip="top"
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground!"
            onClick={() => notify(`Volver a ${s.back}`, undefined, 'info')}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            {s.back}
          </Button>
          <span className="flex h-5 items-center">
            <Separator orientation="vertical" />
          </span>
        </>
      ) : null}
      {c.left === 'crumbs' ? (
        <div data-region={PART.crumbs} data-balance="" className="flex min-w-0 items-center gap-2">
          {s.crumbs.slice(0, -1).map((label) => (
            <Fragment key={label}>
              <Button
                variant="link"
                className="h-auto! shrink-0 p-0! font-normal text-muted-foreground! no-underline! hover:text-foreground!"
                onClick={() => notify(`Ir a ${label}`, undefined, 'info')}
              >
                {label}
              </Button>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} className="shrink-0 text-muted-foreground/50" />
            </Fragment>
          ))}
          <span className="min-w-0 truncate font-medium">{s.crumbs.at(-1)}</span>
        </div>
      ) : (
        <div data-region={PART.title} data-balance="" className="min-w-0">
          <div className="truncate">{s.title}</div>
        </div>
      )}
    </div>
  )

  const search =
    v.search === 'none' ? null : (
      <div className="flex justify-center">
        {v.search === 'wide' ? (
          <Button
            data-region={PART.search}
            data-chip="top"
            variant="outline"
            size="sm"
            className={cn(
              'h-9 w-[min(21.25rem,calc(100cqw_-_var(--hdr-reserve)))] justify-start gap-2 px-3 font-normal text-muted-foreground @max-[55rem]:w-[min(21.25rem,calc(100cqw_-_var(--hdr-reserve-compact)))] @max-[39rem]:hidden',
              squeezed && 'hidden!',
            )}
            onClick={() => setPalette(true)}
          >
            <HugeiconsIcon icon={Search01Icon} size={16} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate text-left">Buscar o ir a…</span>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </Button>
        ) : null}
        <Button
          data-region={PART.search}
          data-chip="top"
          variant="outline"
          size="icon-sm"
          className={cn(v.search === 'wide' && !squeezed && 'hidden @max-[39rem]:inline-flex')}
          aria-label="Buscar o ir a"
          onClick={() => setPalette(true)}
        >
          <HugeiconsIcon icon={Search01Icon} size={17} />
        </Button>
      </div>
    )

  const rightActions = (
    <div className={cn('flex items-center justify-end', names ? 'gap-7.5' : 'gap-2')}>
      {v.right.includes('news') ? (
        <span className="relative inline-flex">
          <Hint label={HINT.news}>
            {/* Novedades en azul suave, como en el header real; con poco espacio queda solo el icono. */}
            <Button
              data-region={RIGHT_NAME.news}
              data-chip={chip('news')}
              variant="outline"
              size="sm"
              aria-label="Novedades"
              className="relative text-primary [--background:color-mix(in_oklch,var(--primary)_10%,transparent)] [--border:color-mix(in_oklch,var(--primary)_28%,transparent)] hover:bg-primary/15! hover:text-primary! @max-[55rem]:w-8! @max-[55rem]:px-0!"
              onClick={() => setChangelog(true)}
            >
              <HugeiconsIcon icon={PartyIcon} size={17} className="size-4.25" />
              <span className="@max-[55rem]:hidden">Novedades</span>
            </Button>
          </Hint>
          {below('news')}
        </span>
      ) : null}
      {v.right.includes('notifications') ? (
        <IconAction
          region={RIGHT_NAME.notifications}
          label={HINT.notifications}
          icon={Notification01Icon}
          large
          chip={chip('notifications')}
          open={v.open === 'notifications'}
          dot={v.unread}
          onClick={toggle('notifications')}
          below={below('notifications', 'notifications')}
        />
      ) : null}
      {v.right.includes('processes') ? (
        <IconAction
          region={RIGHT_NAME.processes}
          label={HINT.processes}
          icon={Queue02Icon}
          chip={chip('processes')}
          pressed
          open={false}
          onClick={() => notify('Aquí se abre el Centro de procesos')}
          below={below('processes')}
        />
      ) : null}
      {v.right.includes('profile') ? (
        <ProfileAction chip={chip('profile')} open={v.open === 'profile'} onClick={toggle('profile')} below={below('profile', 'profile')} />
      ) : null}
    </div>
  )

  // Pantalla enfocada: a la derecha, las mismas acciones del header general, como el editor real (HeaderActions), y sin
  // sello de estado (auditoría, 5 oct).
  const focusedActions = (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      {v.own ? (
        <div
          data-slot-region={PART.own}
          data-slot-area={bare ? undefined : ''}
          data-balance=""
          className={cn(
            'flex h-8 w-44 items-center justify-center px-3 text-[13px] text-muted-foreground',
            !bare && cn('rounded-lg border border-dashed border-muted-foreground/35 bg-muted/30', kit.hatch),
          )}
        >
          Guardado, deshacer…
        </div>
      ) : null}
      {rightActions}
    </div>
  )

  // Alto de la pantalla de fondo: lo justo para que quepa lo que cuelga del header.
  const pageHeight = v.open !== 'none' ? 'h-72' : v.tip ? (names ? 'h-32' : 'h-24') : 'h-24'

  return (
    <TooltipProvider delay={200}>
      <div className={cn(styles.preview, bare && 'flex min-w-0 flex-1 flex-col')} data-names={names ? '' : undefined}>
        <div className={cn('flex rounded-2xl border bg-background text-foreground shadow-xs', bare && 'min-h-0 flex-1', FRAME[c.width])}>
          <div className="flex min-w-0 flex-1 flex-col">
            <header
              ref={headerRef}
              data-region={PART.header}
              style={vars}
              className={cn(
                '@container relative z-20 h-15 shrink-0 border-b text-sm',
                // Enfocada: 20 px a los dos lados, como la cabecera del editor real (auditoría, 5 oct; antes 32 a la derecha).
                v.general ? 'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3.5 px-5' : 'flex items-center gap-2 px-5',
              )}
            >
              {left}
              {v.general ? (
                <>
                  {search ?? <div />}
                  {rightActions}
                </>
              ) : (
                focusedActions
              )}
            </header>
            <PageBehind className={bare ? 'min-h-0 flex-1' : pageHeight} />
          </div>

          {c.width === 'panel' ? (
            <aside
              data-slot-region={PART.panel}
              className={cn(
                'flex w-90 shrink-0 flex-col items-center justify-center gap-1 rounded-r-2xl border-l bg-muted/30 px-6 text-center',
                !bare && kit.hatch,
              )}
            >
              <span className="text-sm font-medium">Actividad del agente</span>
              {bare ? null : <span className="text-[13px] text-muted-foreground">Panel de 360px a toda la altura</span>}
            </aside>
          ) : null}
        </div>

        {size.outer && !bare ? (
          <p className="mt-4 text-center text-[13px] leading-relaxed text-muted-foreground">
            {describe(size, v, reserve, reserveCompact, squeezed)}
            {names ? (
              <>
                <br />
                Con los nombres visibles hay más aire entre botones; apágalos para ver las medidas reales.
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      <CommandPalette open={palette} onOpenChange={setPalette} />
      <ChangelogDialog open={changelog} onOpenChange={setChangelog} />
    </TooltipProvider>
  )
}

// Qué pasó con el header a este ancho, en palabras.
function describe(
  size: { outer: number; inner: number },
  v: ReturnType<typeof headerView>,
  reserve: number,
  reserveCompact: number,
  squeezed: boolean,
) {
  const bits = [`Header de ${px.format(size.outer)} px`]
  if (!v.general) {
    bits.push('todo en una fila, con las acciones pegadas a la derecha')
    return bits.join(' · ')
  }
  const compact = size.inner < COMPACT_BELOW
  if (v.search === 'wide') {
    if (size.inner < LUPA_BELOW) bits.push('el buscador pasó a lupa (header de menos de 664 px)')
    else if (squeezed) bits.push('el buscador pasó a lupa porque con los nombres visibles no cabe ancho')
    else {
      const width = Math.max(0, Math.min(340, size.inner - (compact ? reserveCompact : reserve)))
      bits.push(width < 340 ? `buscador achicado a ${px.format(width)} px para que quepan las acciones` : 'buscador de 340 px al centro')
    }
  } else bits.push(v.search === 'icon' ? 'buscador como lupa' : 'sin buscador')
  if (v.right.includes('news')) bits.push(compact ? 'Novedades solo con icono (header de menos de 920 px)' : 'Novedades con texto')
  return bits.join(' · ')
}
