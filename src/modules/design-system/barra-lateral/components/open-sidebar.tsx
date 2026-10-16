import { useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  LayoutDashboardIcon,
  LookTopIcon,
  UnfoldMoreIcon,
} from '@hugeicons/core-free-icons'
import { ICONO_IA } from '@/shared/layouts/nav-config'
import {
  Badge,
  Button,
  IconTile,
  Separator,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  Tabs,
  TabsList,
  TabsTrigger,
  cn,
} from '@ubits/flux-ui'
import { ChatStatusDot } from '@/shared/components/ChatStatusDot'
import { FeedbackDialog } from '@/shared/components/FeedbackDialog'
import { InviteCard } from '@/shared/components/InviteCard'
import { Orb } from '@/shared/components/Orb'
import { notify } from '@/shared/components/notify'
import { sidebarNavs, type NavChild, type NavItem } from '@/shared/layouts/nav-config'
import newChat from '@/shared/layouts/new-chat.module.css'
import { CuentaDeMuestra } from './cuenta-de-muestra'
import {
  SPACE_SECTION,
  WIDTH_LABEL,
  effectiveLevel,
  isInside,
  rowRoles,
  type RowRoles,
  type SidebarConfig,
  type SidebarPartProps,
} from './sidebar-config'
import { AIR, GROUP_LABEL, GUIDE_MARK, PARENT_ROW, ROW, ROW_MARK, SUB_BUTTON, SUITE_TAB } from './sidebar-styles'

// Barra lateral abierta (288px), réplica fija de AppSidebar con los mismos componentes Sidebar* de flux-ui. No usa el
// estado de la barra real: todo sale de la configuración. Cada parte lleva su nombre (data-region); la tarjeta del pie
// es un slot. Las regiones no llevan overflow-hidden para no recortar su nombre.

// Icono en baldosa: activo se tiñe de azul con halo suave. La misma IconTile de AppSidebar, con su esquina de 12 px
// (auditoría, 5 oct: la réplica seguía con la de 8 px de antes de la revisión ReUI).
function NavIcon({ icon, active }: { icon: IconSvgElement; active: boolean }) {
  return (
    <IconTile
      variant="outline"
      className={cn(
        'size-6.5! rounded-md! transition-all duration-200',
        active
          ? 'border-primary/30! bg-primary/10! text-primary shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_8%,transparent)]'
          : 'border-sidebar-border! bg-background/70! text-sidebar-foreground group-hover/menu-button:border-foreground/20! dark:bg-sidebar-accent/40!',
      )}
    >
      {/* Como AppSidebar: las entradas de IA llevan el orbe (ICONO_IA, 5-oct). */}
      {icon === ICONO_IA ? (
        <Orb className="size-3.75" />
      ) : (
        <HugeiconsIcon icon={icon} strokeWidth={1.6} className={cn('size-3.75!', active && '[&_path]:fill-primary/20')} />
      )}
    </IconTile>
  )
}

// «Nuevo» igual que en AppSidebar: la variante de la librería, sin clases propias (revisión ReUI del 16-sep).
function NewBadge({ children }: { children: string }) {
  return (
    <Badge variant="primary-light" size="xs" className="mr-0.5">
      {children}
    </Badge>
  )
}

type Change = SidebarPartProps['onChange']

// Fila de segundo nivel. La primera sección con páginas propias abre el tercer nivel.
function SubRow({ child, roles, firstDrill, onChange }: { child: NavChild; roles: RowRoles; firstDrill: boolean; onChange: Change }) {
  const drill = Boolean(child.children?.length)
  const active = drill ? isInside(roles.active, child.path) : roles.active === child.path
  const region = active ? 'Ítem activo' : firstDrill ? 'Abre tercer nivel' : undefined

  return (
    <SidebarMenuSubItem data-region={region} className={cn(active && GUIDE_MARK)}>
      <SidebarMenuSubButton
        render={<button type="button" />}
        isActive={active}
        onClick={() => (firstDrill ? onChange({ level: 'third' }) : notify(`Abre ${child.title}`))}
        className={cn(SUB_BUTTON, 'group/sub w-full cursor-pointer text-left')}
      >
        <span className="min-w-0 flex-1 truncate">{child.title}</span>
        {drill ? (
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="ml-auto size-3.5! shrink-0 text-muted-foreground/70! transition-transform duration-200 group-hover/sub:translate-x-0.5 group-hover/sub:text-sidebar-foreground!"
          />
        ) : null}
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}

// Fila de primer nivel: página directa o producto que se despliega.
function ItemRow({ item, roles, level, names, onChange }: { item: NavItem; roles: RowRoles; level: SidebarConfig['level']; names: boolean; onChange: Change }) {
  const kids = item.children ?? []
  const isHost = roles.host === item.path
  const open = level === 'sub' && isHost
  const active = kids.length ? isInside(roles.active, item.path) : roles.active === item.path
  const hasBadge = roles.badge === item.path
  const region = roles.active === item.path ? 'Ítem activo' : isHost ? 'Ítem con submenú' : roles.plain === item.path ? 'Ítem' : undefined
  const firstDrill = kids.find((child) => child.children?.length)?.path

  return (
    <SidebarMenuItem data-region={region} className={cn(roles.active === item.path && ROW_MARK, hasBadge && !region && names && AIR)}>
      <SidebarMenuButton
        isActive={active}
        onClick={() => (isHost ? onChange({ level: open ? 'first' : 'sub' }) : notify(`Abre ${item.title}`))}
        className={cn('min-w-0', ROW, kids.length > 0 && PARENT_ROW, hasBadge && 'overflow-visible!')}
      >
        <NavIcon icon={item.icon} active={active} />
        <span className="min-w-0 flex-1 truncate">{item.title}</span>
        {hasBadge ? (
          <span data-region="Insignia" data-flat="" className="inline-flex shrink-0 overflow-visible!">
            <NewBadge>Nuevo</NewBadge>
          </span>
        ) : null}
        {kids.length ? (
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className={cn(
              'ml-auto size-3.5! shrink-0 text-muted-foreground/70 transition-transform duration-200 group-hover/menu-button:text-sidebar-foreground',
              open && 'rotate-180',
            )}
          />
        ) : null}
      </SidebarMenuButton>

      {open ? (
        <SidebarMenuSub data-region="Submenú" className="mr-0! ml-[17.5px]! min-w-0 gap-0.5! overflow-visible! py-1! pl-3!">
          {kids.map((child) => (
            <SubRow key={child.path} child={child} roles={roles} firstDrill={child.path === firstDrill} onChange={onChange} />
          ))}
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  )
}

// Panel de tercer nivel: Volver, selector de la sección y sus páginas.
function ThirdLevel({ c, names, onChange }: SidebarPartProps) {
  const roles = rowRoles(c)
  const items = sidebarNavs[SPACE_SECTION[c.space]].groups.flatMap((group) => group.items)
  const isSection = (child: NavChild) => Boolean(child.children?.length) && isInside(roles.focus, child.path)
  const parent = items.find((item) => item.children?.some(isSection))
  const section = parent?.children?.find(isSection)
  if (!parent || !section) return null
  const pages = section.children ?? []
  const plain = pages.find((page) => page.path !== roles.active)?.path

  return (
    <div className="flex flex-col gap-2">
      <div className={cn('mx-2 mt-1 rounded-xl border bg-background shadow-xs', names && AIR)}>
        <div className="p-1.5">
          <Button
            data-region="Volver"
            data-chip="top"
            variant="ghost"
            size="sm"
            className="h-7! w-fit gap-1! rounded-md! px-1.5! font-normal! text-muted-foreground! hover:text-sidebar-foreground!"
            onClick={() => onChange({ level: 'first' })}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            <span className="text-[13px]">{parent.title}</span>
          </Button>
        </div>

        <Separator />

        <div className="p-1.5">
          <Button
            data-region="Selector de sección"
            variant="ghost"
            className="h-auto! w-full justify-start gap-3! rounded-lg! px-1.5! py-1.5! text-left font-normal!"
            onClick={() => notify('Aquí se salta a Planes de Formación o Certificados')}
          >
            {/* La misma IconTile de 36 px y esquina de 14 px del panel real (DrillPanel de AppSidebar). */}
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
            <HugeiconsIcon icon={UnfoldMoreIcon} size={16} className="shrink-0 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu className="gap-0.5!">
            {pages.map((page) => {
              const active = roles.active === page.path
              return (
                <SidebarMenuItem key={page.path} data-region={active ? 'Ítem activo' : page.path === plain ? 'Ítem' : undefined} className={cn(active && ROW_MARK)}>
                  <SidebarMenuButton isActive={active} onClick={() => notify(`Abre ${page.title}`)} className={cn('min-w-0', ROW)}>
                    {page.icon ? <NavIcon icon={page.icon} active={active} /> : null}
                    <span className="min-w-0 flex-1 truncate">{page.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
  )
}

// Historial de Suite AI: conversación en dos líneas con su punto de estado.
function History({ c, names }: SidebarPartProps) {
  const roles = rowRoles(c)
  const chats = sidebarNavs['suite-ai'].groups.flatMap((group) => group.items)

  return (
    <SidebarGroup data-region="Historial" className="py-1!">
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5!">
          {chats.map((chat, index) => {
            const active = roles.active === chat.path
            const dotRegion = c.statuses && index === 0
            // Al abrir una conversación con respuesta sin leer, queda leída. Se calcula aquí para no marcarla leída en la
            // barra real (el punto recuerda las conversaciones abiertas en la sesión).
            const status = active && chat.status === 'unread' ? 'read' : chat.status
            return (
              <SidebarMenuItem
                key={chat.path}
                data-region={active ? 'Conversación abierta' : undefined}
                className={cn(active && ROW_MARK, '-mx-1.5 before:top-4! before:-left-2!', dotRegion && names && AIR)}
              >
                <SidebarMenuButton
                  isActive={active}
                  onClick={() => notify(`Abre «${chat.title}»`)}
                  className={cn('min-w-0', ROW, 'h-13! px-1.5!', dotRegion && 'overflow-visible!')}
                >
                  {/* Como ChatRow de la barra real (auditoría, 5 oct): 8px del punto al título, fecha sangrada 20px (12 del
                      punto + 8) y, en la abierta, la fecha en azul pleno (al 70% no pasaba el contraste AA). */}
                  <span className="flex min-w-0 flex-1 flex-col gap-1 overflow-visible!">
                    <span className="flex min-w-0 items-center gap-2">
                      {c.statuses ? (
                        <span data-region={dotRegion ? 'Punto de estado' : undefined} data-flat="" className="inline-flex shrink-0">
                          <ChatStatusDot path={chat.path} status={status} />
                        </span>
                      ) : null}
                      <span className={cn('truncate leading-[18px] font-medium', active ? 'text-primary!' : 'text-foreground!')}>{chat.title}</span>
                    </span>
                    {chat.meta ? (
                      <span
                        className={cn(
                          'truncate text-xs leading-[15px] font-normal tabular-nums',
                          c.statuses && 'pl-5',
                          active ? 'text-primary' : 'text-muted-foreground',
                        )}
                      >
                        {chat.meta}
                      </span>
                    ) : null}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function OpenSidebar(props: SidebarPartProps) {
  const { c, names, onChange } = props
  const nav = sidebarNavs[SPACE_SECTION[c.space]]
  const ai = c.space === 'ai'
  const level = effectiveLevel(c)
  const roles = rowRoles(c)
  const [feedback, setFeedback] = useState(false)

  return (
    <aside
      data-region={WIDTH_LABEL.open}
      data-flat=""
      aria-label="Barra lateral de muestra"
      className="flex w-72 shrink-0 flex-col rounded-l-2xl border-r bg-sidebar text-sidebar-foreground"
    >
      <div className="flex flex-col gap-4 p-3.5">
        {c.account ? (
          <div data-region="Empresa">
            <CuentaDeMuestra ruta={roles.focus} />
          </div>
        ) : null}

        {c.switcher ? (
          <div data-region="Selector de espacio">
            <Tabs
              value={ai ? 'ai' : 'workspace'}
              onValueChange={(value) => onChange({ space: String(value) === 'ai' ? 'ai' : ai ? 'workspace' : c.space })}
            >
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
          </div>
        ) : null}

        {ai && c.newChat ? (
          <div className={cn(newChat.divider, 'mt-1 pt-4')}>
            <span className={newChat.wrap}>
              <Button
                data-region="Nueva conversación"
                size="lg"
                className={cn(newChat.button, 'w-full rounded-full! font-medium')}
                onClick={() => notify('Empieza una conversación nueva')}
              >
                Nueva conversación
              </Button>
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 px-1.5">
        {ai ? (
          <History {...props} />
        ) : level === 'third' ? (
          <ThirdLevel {...props} />
        ) : (
          <div className="flex flex-col">
            {c.home ? (
              <SidebarGroup className="pb-1!">
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem data-region="Inicio">
                      <SidebarMenuButton onClick={() => notify(`Abre ${nav.home.title}`)} className={cn('min-w-0', ROW)}>
                        <NavIcon icon={nav.home.icon} active={false} />
                        <span className="min-w-0 flex-1 truncate">{nav.home.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ) : null}

            {nav.groups.map((group, index) => (
              <SidebarGroup key={group.label || 'lista'} className="py-1!">
                {/* El tamaño va en un span interno: junto al color en el mismo className, la librería lo descarta. */}
                {c.groupTitles && group.label ? (
                  <SidebarGroupLabel data-region={index === 0 ? 'Título de grupo' : undefined} className={GROUP_LABEL}>
                    <span className="text-[13px]">{group.label}</span>
                  </SidebarGroupLabel>
                ) : null}
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5!">
                    {group.items.map((item) => (
                      <ItemRow key={item.path} item={item} roles={roles} level={level} names={names} onChange={onChange} />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </div>
        )}
      </div>

      {/* En Suite AI la barra queda solo con el historial: sin tarjeta ni feedback. */}
      {!ai && (c.invite || c.feedback) ? (
        <div className={cn('flex flex-col px-3.5 pt-1.5 pb-3.5', names && 'pb-8')}>
          {c.invite ? (
            <div data-slot-region="Tarjeta del pie">
              <InviteCard onClose={() => onChange({ invite: false })} />
            </div>
          ) : null}
          {c.feedback ? (
            <Button
              data-region="Enviar feedback"
              variant="outline"
              className="mt-2.5 w-full justify-start gap-2! px-2.5! shadow-xs"
              onClick={() => setFeedback(true)}
            >
              <HugeiconsIcon icon={LookTopIcon} size={16} />
              {/* Como en AppSidebar (auditoría, 5 oct): 8px entre icono y texto, sin flecha, y abre la ventana de feedback. */}
              <span className="flex-1 text-left">Enviar feedback</span>
            </Button>
          ) : null}
        </div>
      ) : null}
      <FeedbackDialog open={feedback} onOpenChange={setFeedback} />
    </aside>
  )
}
