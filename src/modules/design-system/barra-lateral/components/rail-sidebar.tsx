import { Fragment, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ArrowRight01Icon, BubbleChatIcon, LayoutDashboardIcon, LookTopIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { ICONO_IA } from '@/shared/layouts/nav-config'
import { Button, cn } from '@ubits/flux-ui'
import { ChatStatusDot } from '@/shared/components/ChatStatusDot'
import { Orb } from '@/shared/components/Orb'
import { notify } from '@/shared/components/notify'
import newChat from '@/shared/layouts/new-chat.module.css'
import { sidebarNavs, type NavItem } from '@/shared/layouts/nav-config'
import { CuentaDeMuestra } from './cuenta-de-muestra'
import { SPACE_SECTION, WIDTH_LABEL, isInside, railRegion, rowRoles, type RowRoles, type SidebarPartProps } from './sidebar-config'
import { FLOAT_MENU, RAIL_ACTIVE, RAIL_BUTTON, RAIL_IDLE, RAIL_OPEN } from './sidebar-styles'

// Riel plegado (72px), réplica fija de SidebarRail. El tooltip y el menú flotante, que en la app salen al pasar el
// cursor, aquí quedan abiertos y con nombre para poder verlos. No usa el estado de la barra real.

// Separador corto entre bloques del riel.
function RailDivider() {
  return <span aria-hidden="true" className="w-8 shrink-0 border-t" />
}

// Globo del tooltip a la derecha del icono, con el aspecto del Tooltip de flux-ui.
function RailTooltip({ label }: { label: string }) {
  return (
    <span
      data-region="Tooltip"
      data-flat=""
      data-float=""
      className="absolute top-1/2 left-[calc(100%+10px)] z-10 -translate-y-1/2 rounded-[6px] bg-foreground px-3 py-1.5 whitespace-nowrap text-background"
    >
      <span aria-hidden="true" className="absolute top-1/2 -left-1 size-2.5 -translate-y-1/2 rotate-45 rounded-[2px] bg-foreground" />
      <span className="relative text-sm">{label}</span>
    </span>
  )
}

// Menú flotante del riel, abierto a la derecha del icono con el nombre arriba.
function FloatingMenu({ title, wide, children }: { title: string; wide?: boolean; children: ReactNode }) {
  return (
    <div
      data-region="Menú flotante"
      data-flat=""
      data-float=""
      className={cn('absolute top-0 left-[calc(100%+10px)] z-10 flex flex-col', FLOAT_MENU, wide ? 'w-72' : 'w-60')}
    >
      <div className="px-2 pt-1 pb-1.5 font-medium text-muted-foreground">
        <span className="text-[13px]">{title}</span>
      </div>
      {children}
    </div>
  )
}

// Fila del menú: la de la librería (gap 8, relleno 8 × 6, esquina de 10 px); el real ya no fuerza py-2 (auditoría, 5 oct).
function MenuRow({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <div className={cn('flex items-center gap-2 rounded-[10px] px-2 py-1.5 text-sm', active && 'bg-primary/10 font-medium text-primary')}>
      {children}
    </div>
  )
}

// Páginas de un producto; las secciones con tercer nivel llevan flecha (en la app abren un submenú).
function ItemMenu({ item, roles }: { item: NavItem; roles: RowRoles }) {
  return (
    <FloatingMenu title={item.title}>
      {item.children?.map((child) => {
        const active = isInside(roles.active, child.path)
        return (
          <MenuRow key={child.path} active={active}>
            {child.icon ? (
              child.icon === ICONO_IA ? <Orb className="size-4" /> : <HugeiconsIcon icon={child.icon} size={16} strokeWidth={1.6} className={active ? 'text-primary' : 'text-muted-foreground'} />
            ) : null}
            <span className="min-w-0 flex-1 truncate">{child.title}</span>
            {child.children?.length ? <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="shrink-0 text-muted-foreground" /> : null}
          </MenuRow>
        )
      })}
    </FloatingMenu>
  )
}

// Historial de Suite AI: cada conversación con su punto de estado y la fecha debajo.
function HistoryMenu({ roles }: { roles: RowRoles }) {
  const chats = sidebarNavs['suite-ai'].groups.flatMap((group) => group.items)
  return (
    <FloatingMenu title="Conversaciones recientes" wide>
      {chats.map((chat) => {
        const active = roles.active === chat.path
        return (
          <MenuRow key={chat.path} active={active}>
            {/* Como el menú del riel real (auditoría, 5 oct): 8px del punto al título, fecha sangrada 20px y, en la
                abierta, también en azul pleno. */}
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex min-w-0 items-center gap-2">
                <ChatStatusDot path={chat.path} status={active && chat.status === 'unread' ? 'read' : chat.status} />
                <span className="truncate">{chat.title}</span>
              </span>
              {chat.meta ? (
                <span className={cn('truncate pl-5 text-xs font-normal tabular-nums', active ? 'text-primary' : 'text-muted-foreground')}>{chat.meta}</span>
              ) : null}
            </span>
          </MenuRow>
        )
      })}
    </FloatingMenu>
  )
}

// Icono del riel. Activo: azul con la marca pegada al borde. `float` es lo que sale a su derecha (tooltip o menú).
function RailItem({
  label,
  icon,
  region,
  active = false,
  dot = false,
  open = false,
  float,
}: {
  label: string
  icon: IconSvgElement
  region?: string
  active?: boolean
  dot?: boolean
  open?: boolean
  float?: ReactNode
}) {
  return (
    <span data-region={region} className="relative inline-flex shrink-0">
      {active ? <span aria-hidden="true" className="absolute top-1/2 -left-4 h-5 w-0.75 -translate-y-1/2 rounded-r-full bg-primary" /> : null}
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        onClick={() => notify(`Abre ${label}`, undefined, 'info')}
        className={cn(RAIL_BUTTON, active ? RAIL_ACTIVE : cn(RAIL_IDLE, open && RAIL_OPEN))}
      >
        {icon === ICONO_IA ? <Orb className="size-5" /> : <HugeiconsIcon icon={icon} strokeWidth={1.6} className="size-5!" />}
        {dot ? <span aria-hidden="true" className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" /> : null}
      </Button>
      {float}
    </span>
  )
}

export function RailSidebar({ c, onChange }: SidebarPartProps) {
  const nav = sidebarNavs[SPACE_SECTION[c.space]]
  const ai = c.space === 'ai'
  const roles = rowRoles(c)
  const menuOn = c.hover === 'menu'
  const tipOn = c.hover === 'tooltip'
  const items = nav.groups.flatMap((group) => group.items)
  // Icono que muestra su tooltip: una fila sencilla, o la activa, o el inicio.
  const tipTarget = roles.plain ?? roles.activeItem ?? (c.home ? nav.home.path : items[0]?.path)
  const tip = (path: string, label: string) => (tipOn && tipTarget === path ? <RailTooltip label={label} /> : null)

  return (
    <nav
      data-region={WIDTH_LABEL.rail}
      data-flat=""
      aria-label="Menú plegado de muestra"
      className="flex w-18 shrink-0 flex-col items-center gap-2 rounded-l-2xl border-r bg-sidebar py-3.5"
    >
      {/* Empresa: la baldosa del logo real; al tocarla abre el menú de la cuenta a su derecha, no la barra, como en
          SidebarRail (auditoría, 5 oct). 8px entre los iconos del riel, igual que el real. */}
      {c.account ? (
        <span data-region="Empresa" className="relative inline-flex shrink-0">
          <CuentaDeMuestra ruta={roles.focus} compact />
        </span>
      ) : null}

      {/* Selector Workspace | Suite AI en vertical. */}
      {c.switcher ? (
        <div data-region="Selector de espacio" role="group" aria-label="Espacio" className="flex shrink-0 flex-col gap-0.5 rounded-[14px] border bg-muted p-0.75 dark:border-input">
          {(
            [
              { label: 'Workspace', active: !ai, icon: <HugeiconsIcon icon={LayoutDashboardIcon} className="size-4.25" /> },
              { label: 'Orbit', active: ai, icon: <Orb className="size-4.5" /> },
            ] as const
          ).map((option) => (
            <Button
              key={option.label}
              variant="ghost"
              size="icon-sm"
              aria-label={option.label}
              aria-pressed={option.active}
              onClick={() => !option.active && onChange({ space: option.label === 'Orbit' ? 'ai' : 'workspace' })}
              className={cn(
                'size-8.5! rounded-[10px]! border-0! transition-colors focus-visible:ring-2!',
                option.active
                  ? 'bg-background! text-foreground! shadow-xs ring-1 ring-border hover:bg-background! dark:bg-input/50! dark:ring-input dark:hover:bg-input/50!'
                  : 'text-muted-foreground hover:bg-transparent! hover:text-foreground dark:hover:bg-transparent!',
              )}
            >
              {option.icon}
            </Button>
          ))}
        </div>
      ) : null}

      <RailDivider />

      {ai ? (
        <>
          {c.newChat ? (
            <span data-region="Nueva conversación" className="relative inline-flex shrink-0">
              <span className={cn(newChat.wrap, 'shrink-0')}>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Nueva conversación"
                  onClick={() => notify('Empieza una conversación nueva', undefined, 'info')}
                  className={cn(newChat.button, 'relative z-1 size-10! rounded-full! border-0!')}
                >
                  <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4.5" />
                </Button>
              </span>
              {tipOn ? <RailTooltip label="Nueva conversación" /> : null}
            </span>
          ) : null}
          <RailItem
            label="Conversaciones recientes"
            icon={BubbleChatIcon}
            region="Historial"
            active={c.active}
            open={menuOn}
            float={menuOn ? <HistoryMenu roles={roles} /> : tipOn && !c.newChat ? <RailTooltip label="Conversaciones recientes" /> : null}
          />
        </>
      ) : (
        <>
          {c.home ? <RailItem label={nav.home.title} icon={nav.home.icon} region="Inicio" float={tip(nav.home.path, nav.home.title)} /> : null}
          {nav.groups.map((group) => (
            <Fragment key={group.label || 'lista'}>
              <RailDivider />
              {group.items.map((item) => {
                const host = menuOn && roles.host === item.path
                return (
                  <RailItem
                    key={item.path}
                    label={item.title}
                    icon={item.icon}
                    region={railRegion(item.path, roles)}
                    active={isInside(roles.active, item.path)}
                    dot={roles.badge === item.path}
                    open={host}
                    float={host ? <ItemMenu item={item} roles={roles} /> : tip(item.path, item.title)}
                  />
                )
              })}
            </Fragment>
          ))}
          {c.feedback ? (
            <>
              <div className="mt-auto" />
              <RailItem label="Enviar feedback" icon={LookTopIcon} region="Enviar feedback" />
            </>
          ) : null}
        </>
      )}
    </nav>
  )
}
