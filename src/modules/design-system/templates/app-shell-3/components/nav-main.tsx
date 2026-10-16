import { HugeiconsIcon } from '@hugeicons/react'
import { ChevronDownIcon, ChevronRightIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@ubits/flux-ui'

import { PLATAFORMA, PROGRAMAS, type NavLeaf, type Programa } from './data'
import { useNav } from './use-navigation'

function Aro({ programa }: { programa: Programa }) {
  const grados = Math.round((programa.avance / 100) * 360)

  return (
    <span
      className="flex size-4 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(var(--${programa.tono}) ${grados}deg, var(--secondary) 0deg)`,
      }}
      aria-hidden="true"
    >
      <span className="bg-sidebar block size-[7px] rounded-full" />
    </span>
  )
}

function ItemSimple({ item }: { item: NavLeaf }) {
  const { activo, navegar } = useNav()
  const { state } = useSidebar()
  const esActivo = activo === item.id

  // SidebarMenuBadge trae `group-data-[collapsible=icon]:hidden`, pero la clase
  // `.cn-sidebar-menu-badge` del tema le gana y el badge se queda visible,
  // desbordando el carril de iconos. Se resuelve no montándolo al colapsar.
  const mostrarBadge = Boolean(item.badge) && state === 'expanded'

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.label}
        isActive={esActivo}
        aria-current={esActivo ? 'page' : undefined}
        onClick={() => navegar(item.id)}
      >
        <HugeiconsIcon icon={item.icon} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      </SidebarMenuButton>
      {mostrarBadge ? (
        <SidebarMenuBadge>
          <Badge variant="info-light" size="xs">
            {item.badge}
          </Badge>
        </SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  )
}

function ItemConHijos({ item }: { item: NavLeaf }) {
  const { activo, navegar } = useNav()
  const hijoActivo = item.children?.some((hijo) => hijo.id === activo) ?? false

  return (
    <Collapsible defaultOpen={hijoActivo} className="group/collapsible min-w-0">
      <SidebarMenuItem>
        <CollapsibleTrigger
          render={
            <SidebarMenuButton tooltip={item.label} isActive={hijoActivo}>
              <HugeiconsIcon icon={item.icon} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <HugeiconsIcon
                icon={ChevronRightIcon}
                className="ml-auto shrink-0 transition-transform group-data-[panel-open]/collapsible:rotate-90"
                aria-hidden="true"
              />
            </SidebarMenuButton>
          }
        />
        <CollapsibleContent className="min-w-0 overflow-hidden">
          <SidebarMenuSub className="min-w-0">
            {item.children?.map((hijo) => (
              <SidebarMenuSubItem key={hijo.id}>
                <SidebarMenuSubButton
                  isActive={activo === hijo.id}
                  onClick={() => navegar(hijo.id)}
                >
                  <span className="min-w-0 truncate">{hijo.label}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function NavMain() {
  const { activo, navegar } = useNav()

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {PLATAFORMA.map((item) =>
              item.children ? (
                <ItemConHijos key={item.id} item={item} />
              ) : (
                <ItemSimple key={item.id} item={item} />
              ),
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <Collapsible defaultOpen className="group/programas">
        <SidebarGroup>
          <CollapsibleTrigger
            nativeButton={false}
            render={
              <SidebarGroupLabel className="w-full cursor-pointer">
                <span className="min-w-0 flex-1 truncate text-left">Programas activos</span>
                <HugeiconsIcon
                  icon={ChevronDownIcon}
                  size={14}
                  className="shrink-0 transition-transform group-data-[panel-open]/programas:rotate-0 rotate-[-90deg]"
                  aria-hidden="true"
                />
              </SidebarGroupLabel>
            }
          />
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {PROGRAMAS.map((programa) => (
                  <SidebarMenuItem key={programa.id}>
                    <SidebarMenuButton
                      tooltip={`${programa.label} · ${programa.avance}%`}
                      isActive={activo === programa.id}
                      onClick={() => navegar(programa.id)}
                    >
                      <Aro programa={programa} />
                      <span className="min-w-0 flex-1 truncate">{programa.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    </>
  )
}
