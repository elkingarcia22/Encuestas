import { Fragment, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  BubbleChatIcon,
  LayoutDashboardIcon,
  LookTopIcon,
  PlusSignIcon,
  SidebarLeft01Icon,
} from '@hugeicons/core-free-icons'
import { useLocation, useNavigate } from 'react-router'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  cn,
  useSidebar,
} from '@ubits/flux-ui'
import { AccountPopover } from '@/shared/components/AccountPopover'
import { ChatStatusDot } from '@/shared/components/ChatStatusDot'
import { FeedbackDialog } from '@/shared/components/FeedbackDialog'
import { HintContent } from '@/shared/components/Hint'
import { Orb } from '@/shared/components/Orb'
import newChat from '@/shared/layouts/new-chat.module.css'
import { ICONO_IA, getSectionId, isPathActive, sidebarNavs, type NavItem } from '@/shared/layouts/nav-config'

// Botón del riel con su nombre en un tooltip a la derecha (sin texto visible, el nombre es obligatorio).
// Activo: fondo azul 10% con el icono en primary y la marca azul pegada al borde, igual que el menú completo.
function RailButton({
  label,
  icon,
  children,
  active = false,
  dot = false,
  onClick,
}: {
  label: string
  icon?: IconSvgElement
  children?: ReactNode
  active?: boolean
  dot?: boolean
  onClick: () => void
}) {
  return (
    <div className="relative flex w-full justify-center">
      {active ? (
        <span aria-hidden="true" className="absolute top-1/2 left-0 h-5 w-0.75 -translate-y-1/2 rounded-r-full bg-primary" />
      ) : null}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              // El punto azul es el «Nuevo» del menú completo: se dice también en el nombre, para quien no lo ve.
              aria-label={dot ? `${label}, nuevo` : label}
              aria-current={active ? 'page' : undefined}
              onClick={onClick}
              className={cn(
                'relative size-10! transition-colors',
                active
                  ? 'bg-primary/10! text-primary! hover:bg-primary/15!'
                  : 'text-muted-foreground hover:bg-sidebar-accent! hover:text-foreground',
              )}
            />
          }
        >
          {icon === ICONO_IA ? <Orb className="size-5" /> : icon ? <HugeiconsIcon icon={icon} strokeWidth={1.6} className="size-5!" /> : children}
          {dot ? <span aria-hidden="true" className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" /> : null}
        </TooltipTrigger>
        <HintContent side="right">{label}</HintContent>
      </Tooltip>
    </div>
  )
}

// Fila de un menú contextual del riel. Activa: azul 10% con texto e icono en primary (con **: porque el menú de la
// librería repinta de oscuro lo de adentro al resaltar). Al pasar el cursor, gris suave (el `accent` del tema es azul).
function railItemClass(active: boolean) {
  return cn(
    active
      ? 'bg-primary/10! font-medium **:text-primary! data-highlighted:bg-primary/15!'
      : '[&_svg]:text-muted-foreground',
  )
}

const RAIL_MENU = 'w-60! bg-popover! p-1.5!'
const RAIL_MENU_LABEL = 'px-2! pt-1! pb-1.5! text-[length:13px]! font-medium! text-muted-foreground!'

// Producto con niveles (Selección, Aprendizaje, Desempeño) con la barra cerrada: al pasar el cursor abre un menú
// contextual a la derecha con sus páginas; las secciones con tercer nivel (p. ej. LMS Creator) abren un submenú.
// Reemplaza al tooltip, porque el menú ya muestra el nombre del producto arriba.
function RailMenu({
  item,
  pathname,
  onNavigate,
  menuClassName,
}: {
  item: NavItem
  pathname: string
  onNavigate: (path: string) => void
  // Ancho propio del menú (p. ej. el historial de Suite AI, con títulos largos).
  menuClassName?: string
}) {
  const active = isPathActive(pathname, item.path)

  return (
    <div className="relative flex w-full justify-center">
      {active ? (
        <span aria-hidden="true" className="absolute top-1/2 left-0 h-5 w-0.75 -translate-y-1/2 rounded-r-full bg-primary" />
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger
          openOnHover
          delay={60}
          closeDelay={220}
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={item.badge ? `${item.title}, nuevo` : item.title}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative size-10! transition-colors',
                active
                  ? 'bg-primary/10! text-primary! hover:bg-primary/15!'
                  : 'text-muted-foreground hover:bg-sidebar-accent! hover:text-foreground data-popup-open:bg-sidebar-accent! data-popup-open:text-foreground',
              )}
            />
          }
        >
          {item.icon === ICONO_IA ? <Orb className="size-5" /> : <HugeiconsIcon icon={item.icon} strokeWidth={1.6} className="size-5!" />}
          {item.badge ? <span aria-hidden="true" className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" /> : null}
        </DropdownMenuTrigger>

        <DropdownMenuContent side="right" align="start" sideOffset={10} className={cn(RAIL_MENU, menuClassName)}>
          <DropdownMenuGroup>
            <DropdownMenuLabel className={RAIL_MENU_LABEL}>{item.title}</DropdownMenuLabel>
            {item.children?.map((child) =>
              child.children?.length ? (
                <DropdownMenuSub key={child.path}>
                  <DropdownMenuSubTrigger className={railItemClass(isPathActive(pathname, child.path))}>
                    {child.icon === ICONO_IA ? <Orb className="size-4" /> : child.icon ? <HugeiconsIcon icon={child.icon} size={16} strokeWidth={1.6} /> : null}
                    <span className="flex-1">{child.title}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent sideOffset={8} className={RAIL_MENU}>
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className={RAIL_MENU_LABEL}>{child.title}</DropdownMenuLabel>
                      {child.children.map((leaf) => (
                        <DropdownMenuItem
                          key={leaf.path}
                          className={railItemClass(isPathActive(pathname, leaf.path, true))}
                          onClick={() => onNavigate(leaf.path)}
                        >
                          {leaf.icon === ICONO_IA ? <Orb className="size-4" /> : leaf.icon ? <HugeiconsIcon icon={leaf.icon} size={16} strokeWidth={1.6} /> : null}
                          <span className="flex-1">{leaf.title}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : (
                <DropdownMenuItem
                  key={child.path}
                  className={railItemClass(isPathActive(pathname, child.path, true))}
                  onClick={() => onNavigate(child.path)}
                >
                  {child.icon === ICONO_IA ? <Orb className="size-4" /> : child.icon && !child.status ? <HugeiconsIcon icon={child.icon} size={16} strokeWidth={1.6} /> : null}
                  {/* Conversación: sin icono, con su punto de estado junto al título y la fecha debajo alineada con el
                      título, igual que el historial abierto. Otras filas con bajada van en dos líneas. */}
                  {child.status ? (
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex min-w-0 items-center gap-2">
                        <ChatStatusDot path={child.path} status={child.status} active={isPathActive(pathname, child.path, true)} />
                        <span className="truncate">{child.title}</span>
                      </span>
                      {child.description ? (
                        <span className="truncate pl-5 text-xs text-muted-foreground tabular-nums">{child.description}</span>
                      ) : null}
                    </span>
                  ) : child.description ? (
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{child.title}</span>
                      <span className="truncate text-xs text-muted-foreground tabular-nums">{child.description}</span>
                    </span>
                  ) : (
                    <span className="flex-1">{child.title}</span>
                  )}
                </DropdownMenuItem>
              ),
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Separador corto entre bloques del riel (inicio, productos, herramientas). Borde y no fondo: no se ve doble con zoom.
function RailDivider() {
  return <span aria-hidden="true" className="w-8 shrink-0 border-t" />
}

// Barra lateral plegada a iconos (72px). Muestra lo mismo que el menú completo, tomado de nav-config: botón para
// abrir, empresa, selector Workspace | Suite AI, y en Workspace inicio + productos + herramientas y feedback abajo;
// en Suite AI, nueva conversación (con el degradado IA) y acceso al historial.
// `showExpand`: en el marco general el botón de abrir ya está en el header (junto al título), así que el riel no lo
// repite; en el editor, que no tiene ese header, sí va arriba del riel.
export function SidebarRail({
  onExpand,
  expandLabel = 'Abrir menú',
  showExpand = true,
}: {
  onExpand: () => void
  expandLabel?: string
  showExpand?: boolean
}) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const section = getSectionId(pathname) ?? 'admin'
  // Como en la barra completa: en el design system, Suite AI es el design system de la IA (menú normal).
  const isAi = section === 'suite-ai'
  const enDesignSystem = section === 'design-system' || section === 'design-system-ai'
  const suiteAi = isAi || section === 'design-system-ai'
  const nav = sidebarNavs[section]
  const [feedback, setFeedback] = useState(false)

  return (
    <TooltipProvider delay={200}>
      <FeedbackDialog open={feedback} onOpenChange={setFeedback} />
      <nav aria-label="Menú plegado" className="flex h-svh w-18 shrink-0 flex-col items-center gap-2 overflow-y-auto border-r bg-sidebar py-3.5">
        {showExpand ? <RailButton label={expandLabel} icon={SidebarLeft01Icon} onClick={onExpand} /> : null}

        {/* Empresa: la misma baldosa de antes, pero abre el menú de la cuenta (18 sep, Nicolás: «al dar clic aquí
            por qué abre la sidebar? debe es de mostrar el menú de la cuenta»). Es el mismo menú de la barra abierta. */}
        <AccountPopover compact />

        {/* Selector Workspace | Suite AI en vertical, con el mismo estilo del switch del menú completo. */}
        <div role="group" aria-label="Espacio" className="flex shrink-0 flex-col gap-0.5 rounded-lg border bg-muted p-0.75 dark:border-input">
          {(
            [
              { label: 'Workspace', active: !suiteAi, to: enDesignSystem ? '/design-system' : '/admin', icon: <HugeiconsIcon icon={LayoutDashboardIcon} className="size-4.25" /> },
              { label: 'Orbit', active: suiteAi, to: enDesignSystem ? '/design-system/ia' : '/suite-ai', icon: <Orb className="size-4.5" /> },
            ] as const
          ).map((option) => (
            <Tooltip key={option.label}>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={option.label}
                    aria-pressed={option.active}
                    onClick={() => !option.active && navigate(option.to)}
                    className={cn(
                      // Sin borde ni fondo gris al pasar el cursor (los de la librería); con teclado se ve el anillo de foco.
                      'size-8.5! border-0! transition-colors focus-visible:ring-2!',
                      option.active
                        ? 'bg-background! text-foreground! shadow-xs ring-1 ring-border hover:bg-background! dark:bg-input/50! dark:ring-input dark:hover:bg-input/50!'
                        : 'text-muted-foreground hover:bg-transparent! hover:text-foreground dark:hover:bg-transparent!',
                    )}
                  />
                }
              >
                {option.icon}
              </TooltipTrigger>
              <HintContent side="right">{option.label}</HintContent>
            </Tooltip>
          ))}
        </div>

        <RailDivider />

        {isAi ? (
          <>
            {/* Nueva conversación con el degradado IA, igual que el botón del menú completo (sin filo). */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className={cn(newChat.wrap, 'shrink-0')}>
                    {/* El degradado lo pinta la clase del módulo CSS, que se impone al fondo del botón de flux-ui. */}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Nueva conversación"
                      onClick={() => navigate('/suite-ai')}
                      className={cn(newChat.button, 'relative z-1 size-10! rounded-full! border-0!')}
                    >
                      <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4.5" />
                    </Button>
                  </span>
                }
              />
              <HintContent side="right">Nueva conversación</HintContent>
            </Tooltip>
            {/* Historial: al pasar el cursor abre el menú flotante con cada conversación y su fecha, como los productos. */}
            <RailMenu
              item={{
                title: 'Conversaciones recientes',
                path: '/suite-ai/chat',
                icon: BubbleChatIcon,
                children: nav.groups
                  .flatMap((group) => group.items)
                  .map((chat) => ({ title: chat.title, path: chat.path, status: chat.status ?? 'read', description: chat.meta })),
              }}
              pathname={pathname}
              onNavigate={(path) => navigate(path)}
              menuClassName="w-72!"
            />
          </>
        ) : (
          <>
            <RailButton
              label={nav.home.title}
              icon={nav.home.icon}
              active={isPathActive(pathname, nav.home.path, true)}
              onClick={() => navigate(nav.home.path)}
            />
            {nav.groups.map((group) => (
              <Fragment key={group.label || 'lista'}>
                <RailDivider />
                {group.items.map((item) =>
                  item.children?.length ? (
                    <RailMenu key={item.path} item={item} pathname={pathname} onNavigate={(path) => navigate(path)} />
                  ) : (
                    <RailButton
                      key={item.path}
                      label={item.title}
                      icon={item.icon}
                      dot={Boolean(item.badge)}
                      active={isPathActive(pathname, item.path, true)}
                      onClick={() => navigate(item.path)}
                    />
                  ),
                )}
              </Fragment>
            ))}
            <div className="mt-auto" />
            <RailButton
              label="Enviar feedback"
              icon={LookTopIcon}
              onClick={() => setFeedback(true)}
            />
          </>
        )}
      </nav>
    </TooltipProvider>
  )
}

// En el marco general: cuando se cierra la barra lateral, en vez de desaparecer queda el riel de iconos.
// Siempre montado y fijo sobre la barra: al abrir se desvanece mientras la barra sale desde su borde; al cerrar
// reaparece cuando la barra ya se replegó detrás de él (el hueco de 72px lo reserva RootLayout). Abierta, queda inerte.
export function CollapsedSidebarRail() {
  const { open, setOpen, isMobile } = useSidebar()
  if (isMobile) return null
  return (
    <div
      inert={open}
      className={cn(
        'fixed inset-y-0 left-0 z-20 transition-opacity ease-out',
        // Al cerrar aparece de inmediato (opaco) y la barra se esconde debajo; con fundido se transparentaba su contenido.
        open ? 'pointer-events-none opacity-0 duration-200' : 'opacity-100 duration-0',
      )}
    >
      <SidebarRail onExpand={() => setOpen(true)} showExpand={false} />
    </div>
  )
}
