import { useRef, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  LayoutDashboardIcon,
  LookTopIcon,
  Tick02Icon,
  UnfoldMoreIcon,
} from '@hugeicons/core-free-icons'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { Badge, Button, Collapsible, CollapsibleContent, CollapsibleTrigger, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, IconTile, Separator, Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, Tabs, TabsList, TabsTrigger, cn, useSidebar } from '@ubits/flux-ui'
import { AccountPopover } from '@/shared/components/AccountPopover'
import { FeedbackDialog } from '@/shared/components/FeedbackDialog'
import { TourDialog } from '@/shared/components/TourDialog'
import type { EstadoTour } from '@/shared/components/tour-pendiente'
import { InviteCard } from '@/shared/components/InviteCard'
import { useCabeTarjeta } from './use-cabe-tarjeta'
import { Orb } from '@/shared/components/Orb'
import { ICONO_IA, getSectionId, isPathActive, sidebarNavs, type NavChild, type NavItem, type NavLeaf } from '@/shared/layouts/nav-config'
import { ChatStatusDot } from '@/shared/components/ChatStatusDot'
import newChat from '@/shared/layouts/new-chat.module.css'


// Fila del menú: un poco más alta y con esquinas más suaves que la base.
// Activa: fondo azul al 10% y texto azul; el gris del tema casi no se veía.
// Tipografía (16 sep): los productos van en medium y en el gris del tema, como los iconos de la barra.
// Estado normal en el color de texto del tema (negro), como «Enviar feedback» (18 sep). Antes iba en gris; se
// cambió porque el gris hacía ver el menú apagado frente al resto de la barra. La fila activa sigue en azul.
const ROW =
  'h-9! gap-3! rounded-lg! px-1.5! font-medium! text-sidebar-foreground! transition-colors data-active:bg-primary/10! data-active:text-primary!'

// Marca del elemento activo pegada al borde de la barra (la barra tiene 14px de margen hasta la fila).
const RAIL = 'before:absolute before:top-2 before:-left-3.5 before:h-5 before:w-0.75 before:rounded-r-full before:bg-primary'

// Título de sección discreto: en minúsculas (solo la inicial en mayúscula) y sin línea al lado.
const GROUP_LABEL = 'h-7! px-1.5! text-xs! font-medium text-muted-foreground!'

// Opción del selector Workspace | Suite AI. La pastilla activa (div de la librería) es blanca con filo y sombra
// mínima, como el switch de REUI; esquinas de 10px (14 de la bandeja − 1 de borde − 3 de aire).
const SUITE_TAB =
  'flex-1 gap-2 text-muted-foreground! not-data-active:hover:text-foreground! data-active:font-medium! data-active:text-foreground! [&>div]:rounded-[10px]! [&>div]:bg-background! [&>div]:shadow-xs! [&>div]:ring-1 [&>div]:ring-border dark:[&>div]:bg-input/50! dark:[&>div]:ring-input'

const SUB_BUTTON =
  'h-8! min-w-0 rounded-lg! px-2.5! text-muted-foreground! transition-colors hover:text-sidebar-foreground! data-active:bg-primary/10! data-active:font-medium! data-active:text-primary!'

// Marca del hijo activo, centrada sobre la línea guía del submenú.
const GUIDE_MARK =
  'before:absolute before:top-1/2 before:-left-[13.5px] before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary'

const PANEL =
  'h-(--collapsible-panel-height) min-w-0 overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0'

// Icono en baldosa: borde fino en reposo, se aviva al pasar el cursor y, activo, se tiñe
// del color primario con un halo suave y el trazo en «duotono».
function NavIcon({ icon, active }: { icon: IconSvgElement; active: boolean }) {
  return (
    // `IconTile` de la librería. Su tamaño base es 40px y aquí la baldosa mide 26, así que se le fuerzan medidas y
    // colores: la apariencia es la misma de antes, pero la pieza ya es la de flux-ui.
    <IconTile
      variant="outline"
      className={cn(
        'size-6.5! rounded-md! transition-all duration-200',
        active
          ? 'border-primary/30! bg-primary/10! text-primary shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_8%,transparent)]'
          : 'border-sidebar-border! bg-background/70! text-sidebar-foreground group-hover/menu-button:border-foreground/20! dark:bg-sidebar-accent/40!',
      )}
    >
      {icon === ICONO_IA ? (
        <Orb className="size-3.75" />
      ) : (
        <HugeiconsIcon icon={icon} strokeWidth={1.6} className={cn('size-3.75!', active && '[&_path]:fill-primary/20')} />
      )}
    </IconTile>
  )
}

// «Nuevo» en el azul de la marca, con la variante de la librería (revisión ReUI del 16-sep).
function NewBadge({ children }: { children: string }) {
  return (
    <Badge variant="primary-light" size="xs" className="mr-0.5">
      {children}
    </Badge>
  )
}

// Conversación del historial de Suite AI en dos líneas y sin icono, como el historial de Claude: junto al título, un
// punto con su estado (anillo vacío si ya se leyó, punto azul con respuesta sin leer y un cometa con el degradado de la
// IA mientras el agente piensa); título en medium con el negro del tema y la fecha debajo, alineada con el título.
// Activa: fila en azul 10%, texto azul y marca en el borde de la barra, igual que el menú de Workspace.
function ChatRow({ item, active }: { item: NavItem; active: boolean }) {
  return (
    // La fila sobresale 6px a cada lado (-mx-1.5) para que el punto caiga justo en el borde del botón
    // «Nueva conversación» (14px) y el fondo activo/hover respire por fuera. La marca del borde se corre lo mismo.
    <SidebarMenuItem className={cn(active && RAIL, '-mx-1.5 before:top-4! before:-left-2!')}>
      <SidebarMenuButton
        tooltip={item.title}
        isActive={active}
        render={<NavLink to={item.path} end />}
        className={cn('min-w-0', ROW, 'h-13! px-1.5!')}
      >
        {/* Sin recorte en la columna (la librería le pone `truncate` al último span del botón y cortaba 1px del halo del
            punto por la izquierda); el título y la fecha se siguen cortando con «…» por su cuenta. */}
        {/* 8px del punto al título (el espacio de icono y texto en toda la interfaz) y 4px del título a la fecha.
            La sangría de la fecha sigue al punto: 12px del punto + 8px del espacio = 20px. */}
        <span className="flex min-w-0 flex-1 flex-col gap-1 overflow-visible!">
          <span className="flex min-w-0 items-center gap-2">
            <ChatStatusDot path={item.path} status={item.status} active={active} />
            <span className={cn('truncate leading-[18px] font-medium', active ? 'text-primary!' : 'text-foreground!')}>{item.title}</span>
          </span>
          {item.meta ? (
            // Activa, la fecha va en el azul pleno: al 70% no pasaba el contraste AA sobre el fondo azul (2.9 en claro, 2.3 en oscuro).
            <span className={cn('truncate pl-5 text-xs leading-[15px] font-normal tabular-nums', active ? 'text-primary' : 'text-muted-foreground')}>
              {item.meta}
            </span>
          ) : null}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function isChildActive(pathname: string, child: NavChild) {
  return child.children?.length ? isPathActive(pathname, child.path) : isPathActive(pathname, child.path, true)
}

// Fila de primer nivel (o del panel de una sección) que navega a una página.
function NavRow({
  to,
  title,
  icon,
  badge,
  pathname,
  delay,
}: {
  to: string
  title: string
  icon?: IconSvgElement
  badge?: string
  pathname: string
  // Entrada escalonada (ms) para las páginas del panel de una sección.
  delay?: number
}) {
  const active = isPathActive(pathname, to, true)
  return (
    <SidebarMenuItem
      className={cn(active && RAIL, delay !== undefined && 'animate-in duration-300 [animation-fill-mode:both] fade-in slide-in-from-left-1')}
      style={delay !== undefined ? { animationDelay: `${delay}ms` } : undefined}
    >
      <SidebarMenuButton tooltip={title} isActive={active} render={<NavLink to={to} end />} className={cn('min-w-0', ROW)}>
        {icon ? <NavIcon icon={icon} active={active} /> : null}
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {badge ? <NewBadge>{badge}</NewBadge> : null}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function NavLeafItem({ leaf, pathname }: { leaf: NavLeaf; pathname: string }) {
  const active = isPathActive(pathname, leaf.path, true)
  return (
    <SidebarMenuSubItem className={cn(active && GUIDE_MARK)}>
      <SidebarMenuSubButton render={<NavLink to={leaf.path} end />} isActive={active} className={SUB_BUTTON}>
        <span className="min-w-0 truncate">{leaf.title}</span>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}

// Segundo nivel. Una página va directo; una sección con páginas propias (LMS Creator) lleva
// chevron a la derecha y abre su panel en la barra, con «volver».
function NavChildRow({ child, pathname, onDrill }: { child: NavChild; pathname: string; onDrill: () => void }) {
  if (!child.children?.length) return <NavLeafItem leaf={child} pathname={pathname} />

  const active = isChildActive(pathname, child)
  return (
    <SidebarMenuSubItem className={cn(active && GUIDE_MARK)}>
      <SidebarMenuSubButton
        // Botón de flux-ui sin su borde transparente ni su peso medio: la fila se ve igual que las demás del submenú.
        render={<Button variant="ghost" className="justify-start! border-0! font-normal! active:translate-y-0!" />}
        isActive={active}
        onClick={onDrill}
        className={cn(SUB_BUTTON, 'group/sub w-full cursor-pointer')}
      >
        <span className="min-w-0 flex-1 truncate text-left">{child.title}</span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="ml-auto size-3.5! shrink-0 text-muted-foreground/70! transition-transform duration-200 group-hover/sub:translate-x-0.5 group-hover/sub:text-sidebar-foreground!"
        />
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}

// Primer nivel. Un producto con hijos se despliega hacia abajo dentro de la barra (chevron hacia abajo).
function NavItemTree({ item, pathname, onDrill }: { item: NavItem; pathname: string; onDrill: (path: string) => void }) {
  if (!item.children?.length) {
    return <NavRow to={item.path} title={item.title} icon={item.icon} badge={item.badge} pathname={pathname} />
  }

  const childActive = item.children.some((child) => isChildActive(pathname, child))

  return (
    // El Collapsible se dibuja como la propia fila (`li`) de la lista: envuelto en un `div` quedaba un hijo que no es
    // `li` dentro del `ul` del menú y la fila sin lista padre (AA 1.3.1). Se ve igual.
    <Collapsible defaultOpen={childActive} className="group/collapsible min-w-0" render={<SidebarMenuItem />}>
      {/* Con un hijo activo, el padre solo tiñe su icono: el fondo y la marca los lleva el hijo. */}
      <CollapsibleTrigger
        render={
          <SidebarMenuButton
            tooltip={item.title}
            isActive={childActive}
            className={cn(ROW, 'min-w-0 data-active:bg-transparent! data-active:text-sidebar-foreground/75! data-active:hover:bg-sidebar-accent!')}
          />
        }
      >
        <NavIcon icon={item.icon} active={childActive} />
        <span className="min-w-0 flex-1 truncate">{item.title}</span>
        {item.badge ? <NewBadge>{item.badge}</NewBadge> : null}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className="ml-auto size-3.5! shrink-0 text-muted-foreground/70 transition-transform duration-200 group-hover/menu-button:text-sidebar-foreground group-data-[open]/collapsible:rotate-180"
        />
      </CollapsibleTrigger>
      {/* El submenú se despliega con altura animada y cuelga de una guía alineada al centro del icono. */}
      <CollapsibleContent className={PANEL}>
        <SidebarMenuSub className="mr-0! ml-[17.5px]! min-w-0 gap-0.5! overflow-visible! py-1! pl-3!">
          {item.children.map((child) => (
            <NavChildRow key={child.path} child={child} pathname={pathname} onDrill={() => onDrill(child.path)} />
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}

// Tercer nivel en su propio panel. Arriba, una tarjeta en dos partes separadas por una línea: «‹ Aprendizaje»
// para volver y, debajo, el selector de la sección (icono con halo, nombre y para qué sirve), que salta a
// las secciones hermanas. Debajo, sus páginas con icono, entrando escalonadas.
function DrillPanel({
  parent,
  section,
  pathname,
  onBack,
  onSwitch,
}: {
  parent: NavItem
  section: NavChild
  pathname: string
  onBack: () => void
  onSwitch: (section: NavChild) => void
}) {
  const siblings = (parent.children ?? []).filter((child) => child.children?.length)
  const pages = section.children ?? []

  return (
    <div className="flex animate-in flex-col gap-2 duration-200 fade-in slide-in-from-right-3">
      <div className="mx-2 mt-1 overflow-hidden rounded-xl border bg-background shadow-xs">
        <div className="p-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7! w-fit gap-1! rounded-md! px-1.5! font-normal! text-muted-foreground! hover:text-sidebar-foreground!"
            // A la vista solo dice el producto; el lector de pantalla oye que es para volver.
            aria-label={`Volver a ${parent.title}`}
            onClick={onBack}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            <span className="text-[13px]">{parent.title}</span>
          </Button>
        </div>

        <Separator />

        <div className="p-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={siblings.length < 2}
              render={<Button variant="ghost" className="h-auto! w-full justify-start gap-3! rounded-lg! px-1.5! py-1.5! text-left font-normal! disabled:opacity-100!" />}
            >
              <IconTile
                variant="outline"
                className="size-9! rounded-lg! border-primary/25! bg-primary/10! text-primary [--icon-tile-icon-size:18px] shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_8%,transparent)]"
              >
                <HugeiconsIcon icon={section.icon ?? parent.icon} size={18} strokeWidth={1.6} className="[&_path]:fill-primary/20" />
              </IconTile>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-[15px] leading-tight font-semibold text-foreground">{section.title}</span>
                <span className="truncate text-xs text-muted-foreground">{section.description ?? parent.title}</span>
              </span>
              {siblings.length > 1 ? <HugeiconsIcon icon={UnfoldMoreIcon} size={16} className="shrink-0 text-muted-foreground" /> : null}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-(--anchor-width)">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{parent.title}</DropdownMenuLabel>
                {siblings.map((sibling) => (
                  <DropdownMenuItem key={sibling.path} onClick={() => onSwitch(sibling)}>
                    <HugeiconsIcon icon={sibling.icon ?? parent.icon} size={16} />
                    <span className="flex-1">{sibling.title}</span>
                    {sibling.path === section.path ? <HugeiconsIcon icon={Tick02Icon} size={14} className="text-primary" /> : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu className="gap-0.5!">
            {pages.map((leaf, index) => (
              <NavRow key={leaf.path} to={leaf.path} title={leaf.title} icon={leaf.icon} pathname={pathname} delay={60 + index * 40} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
  )
}

// Barra lateral (288px): cuenta con logo, switch Workspace / Suite AI, navegación
// según el mundo activo, y pie con invitación, feedback y marca de agua.
export function AppSidebar() {
  const location = useLocation()
  const { pathname } = location
  const tourPorIngreso = Boolean((location.state as EstadoTour)?.tour)
  const navigate = useNavigate()
  const { open, isMobile } = useSidebar()
  const [invite, setInvite] = useState(true)
  // Si el menú no cabe con la tarjeta del tour, la tarjeta se oculta sola hasta que haya sitio (20-oct).
  const menuRef = useRef<HTMLDivElement>(null)
  const tarjetaRef = useRef<HTMLDivElement>(null)
  const feedbackRef = useRef<HTMLButtonElement>(null)
  const [feedback, setFeedback] = useState(false)
  // Tour del nuevo UBITS (1 oct): siempre desde «Hacer el tour» de la tarjeta y, la primera vez que se entra desde el
  // login, porque el login navega con `{ tour: true }` en el estado de la ruta (ver tour-pendiente.ts).
  const [tour, setTour] = useState(false)
  // Panel de sección abierto a mano (clic en LMS Creator o «volver»). Vale solo mientras no cambie la
  // página; al navegar, el panel sigue a la ruta: dentro de LMS Creator se ve el panel de LMS Creator.
  const [override, setOverride] = useState<{ at: string; path: string | null } | null>(null)

  const section = getSectionId(pathname) ?? 'admin'
  // En el design system, la pestaña Suite AI abre el design system de la IA (su propio menú, con la misma forma
  // que el de Workspace); en el producto abre el chat. `chat` distingue el historial de conversaciones.
  const chat = section === 'suite-ai'
  const cabeTarjeta = useCabeTarjeta(menuRef, tarjetaRef, !chat && invite)
  const enDesignSystem = section === 'design-system' || section === 'design-system-ai'
  const suite = chat || section === 'design-system-ai' ? 'ai' : 'workspace'
  const nav = sidebarNavs[section]

  const drillable =
    !chat
      ? nav.groups
          .flatMap((group) => group.items)
          .flatMap((item) => (item.children ?? []).filter((child) => child.children?.length).map((child) => ({ parent: item, section: child })))
      : []
  const routeDrill = drillable.find((entry) => isPathActive(pathname, entry.section.path))
  const drillPath = override && override.at === pathname ? override.path : (routeDrill?.section.path ?? null)
  const drill = drillable.find((entry) => entry.section.path === drillPath)

  const switchSuite = (value: string) => {
    if (value === 'ai' && suite !== 'ai') navigate(enDesignSystem ? '/design-system/ia' : '/suite-ai')
    if (value === 'workspace' && suite !== 'workspace') navigate(enDesignSystem ? '/design-system' : '/admin')
  }

  return (
    // Plegada, la barra queda escondida detrás del riel pero seguía recibiendo el foco con Tab (15 paradas invisibles
    // antes del riel) y el lector de pantalla leía dos menús. `inert` la saca del teclado y del lector mientras está
    // cerrada. En móvil la librería la muestra en un panel aparte que ya se oculta solo.
    <Sidebar variant="sidebar" collapsible="offcanvas" {...(isMobile ? {} : { inert: !open })}>
      {/* 16px entre la tarjeta de la empresa y el selector (1 oct, Charlie: «no los quiero tan pegados»). Va con «!»: el
          tema de la librería dejaba el `gap-3` en 8px. */}
      <SidebarHeader className="gap-4! p-3.5!">
        {/* El logo de la empresa vive dentro de la tarjeta de cuenta, en baldosa cuadrada. */}
        <AccountPopover />

        <Tabs value={suite} onValueChange={switchSuite}>
          {/* Switch tab como el de REUI: una sola bandeja con gris muy claro (el `bg-muted` del tema, no el gris
              oscuro de antes) y la opción activa como pastilla blanca levantada que se desliza. Se suma un filo fino
              a la bandeja para que se lea sobre el fondo de la barra. Sin línea en medio: la línea lo partía en dos botones. */}
          <TabsList className="h-10! w-full gap-0! border bg-muted! p-0.75! dark:border-input">
            <TabsTrigger value="workspace" className={SUITE_TAB}>
              <HugeiconsIcon icon={LayoutDashboardIcon} size={15} />
              Workspace
            </TabsTrigger>
            <TabsTrigger value="ai" className={SUITE_TAB}>
              <Orb className="size-4" />
              Orbit
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Una línea suave separa la cuenta y el selector (lo que te ubica) del botón (lo que haces): no llega a los
            bordes de la barra y se desvanece en las puntas; mismo aire arriba y abajo. */}
        {chat ? (
          <div className={cn(newChat.divider, 'mt-1 pt-4')}>
            <span className={newChat.wrap}>
              <Button
                size="lg"
                className={cn(newChat.button, 'w-full rounded-full! font-medium')}
                onClick={() => navigate('/suite-ai')}
              >
                Nueva conversación
              </Button>
            </span>
          </div>
        ) : null}
      </SidebarHeader>

      {/* Región de navegación con nombre: la barra de la librería es un `div` y el menú no se anunciaba como navegación. */}
      <SidebarContent ref={menuRef} role="navigation" aria-label="Menú principal" className="gap-1 overflow-x-hidden overflow-y-auto px-1.5">
        {drill ? (
          <DrillPanel
            key={drill.section.path}
            parent={drill.parent}
            section={drill.section}
            pathname={pathname}
            onBack={() => setOverride({ at: pathname, path: null })}
            // Igual que al entrar: el panel de la otra sección se muestra en el mismo clic, sin esperar a la página.
            onSwitch={(next) => {
              setOverride({ at: pathname, path: next.path })
              navigate(next.children?.[0]?.path ?? next.path)
            }}
          />
        ) : (
          <div key="root" className={cn('flex flex-col',override && 'animate-in duration-200 fade-in slide-in-from-left-3')}>
            {!chat ? (
              <SidebarGroup className="pb-1!">
                <SidebarGroupContent>
                  <SidebarMenu>
                    <NavRow to={nav.home.path} title={nav.home.title} icon={nav.home.icon} pathname={pathname} />
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ) : null}

            {nav.groups.map((group) => (
              <SidebarGroup key={group.label || 'lista'} className="py-1!">
                {/* El tamaño va en un span interno: junto al color en el mismo className, la librería lo descarta. */}
                {group.label ? (
                  <SidebarGroupLabel className={GROUP_LABEL}>
                    <span className="text-[13px]">{group.label}</span>
                  </SidebarGroupLabel>
                ) : null}
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5!">
                    {group.items.map((item) =>
                      chat ? (
                        <ChatRow key={item.path} item={item} active={isPathActive(pathname, item.path, true)} />
                      ) : (
                        <NavItemTree
                          key={item.path}
                          item={item}
                          pathname={pathname}
                          // Una sección con páginas propias abre su panel y navega a su primera página, que queda seleccionada.
                          // El panel se abre en el mismo clic (1 oct, «hay un salto»): antes esperaba a que cargara la página
                          // (hasta 1,8 s la primera vez) y entraba de golpe mientras la página se dibujaba, con la animación
                          // trabada. Ahora entra al instante y, al llegar la ruta, es el mismo panel: no se vuelve a animar.
                          onDrill={(path) => {
                            const target = drillable.find((entry) => entry.section.path === path)
                            setOverride({ at: pathname, path })
                            navigate(target?.section.children?.[0]?.path ?? path)
                          }}
                        />
                      ),
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </div>
        )}
      </SidebarContent>

      {/* Pie con el aire del prototipo: 14px a los lados y 10px entre tarjeta y feedback. La marca UBITS
          ya no va aquí: está en el pie de cada pantalla. */}
      <SidebarFooter className="gap-0! px-3.5! pt-1.5! pb-3.5!">
        {/* En Suite AI la barra queda solo con el historial: sin invitación ni feedback. */}
        {/* Al cerrar la invitación su X desaparece: el foco pasa a «Enviar feedback» para no perderse (AA 2.4.3). */}
        {!chat && invite && cabeTarjeta ? (
          <div ref={tarjetaRef}>
            <InviteCard
              onTour={() => setTour(true)}
              onClose={() => {
                setInvite(false)
                feedbackRef.current?.focus()
              }}
            />
          </div>
        ) : null}
        {!chat ? (
          <Button
            ref={feedbackRef}
            variant="outline"
            className="mt-2.5 w-full justify-start gap-2! px-2.5! shadow-xs"
            onClick={() => setFeedback(true)}
          >
            <HugeiconsIcon icon={LookTopIcon} size={16} />
            {/* Sin chevron (1 oct): abre una ventana, no lleva a otra página. */}
            <span className="flex-1 text-left">Enviar feedback</span>
          </Button>
        ) : null}
        {/* «Enviar feedback» abre su ventana (1 oct); antes solo mostraba un aviso de gracias. */}
        <FeedbackDialog open={feedback} onOpenChange={setFeedback} />
        <TourDialog
          open={tour || tourPorIngreso}
          onOpenChange={(abrir) => {
            setTour(abrir)
            // Al cerrarlo se borra el aviso del login, para que no vuelva a abrirse al recargar o al volver atrás.
            if (!abrir && tourPorIngreso) navigate(pathname, { replace: true, state: null })
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
