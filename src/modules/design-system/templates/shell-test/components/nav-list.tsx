import { useState } from 'react'

import {
  Badge,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@ubits/flux-ui'
import { HugeiconsIcon } from '@hugeicons/react'
import { ChevronRightIcon } from '@hugeicons/core-free-icons'

import { sidebarNavs, type NavChild, type NavItem } from '@/shared/layouts/nav-config'

const nav = sidebarNavs.admin

// Para este template, "Inicio" se muestra como "Dashboard" sin tocar
// la etiqueta compartida en nav-config.ts (usada en el resto de la app).
const HOME_LABEL = 'Dashboard'

export function NavList() {
  const [activePath, setActivePath] = useState<string>(nav.home.path)
  const [openPaths, setOpenPaths] = useState<Set<string>>(new Set())

  const toggle = (path: string) => {
    setOpenPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activePath === nav.home.path}
                aria-current={activePath === nav.home.path ? 'page' : undefined}
                tooltip={HOME_LABEL}
                onClick={() => setActivePath(nav.home.path)}
                className="min-w-0"
              >
                <HugeiconsIcon icon={nav.home.icon} aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">{HOME_LABEL}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {nav.groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <NavListItem
                  key={item.path}
                  item={item}
                  activePath={activePath}
                  onSelect={setActivePath}
                  isOpen={openPaths.has(item.path)}
                  onToggle={() => toggle(item.path)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}

function NavListItem({
  item,
  activePath,
  onSelect,
  isOpen,
  onToggle,
}: {
  item: NavItem
  activePath: string
  onSelect: (path: string) => void
  isOpen: boolean
  onToggle: () => void
}) {
  if (!item.children?.length) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={activePath === item.path}
          aria-current={activePath === item.path ? 'page' : undefined}
          tooltip={item.title}
          onClick={() => onSelect(item.path)}
          className="min-w-0"
        >
          <HugeiconsIcon icon={item.icon} aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  const children: NavChild[] = item.children
  const childActive = children.some((child) => child.path === activePath)

  return (
    // El Collapsible (un <div>) va dentro del <li>: la lista solo admite <li> como hijos directos.
    <SidebarMenuItem>
      <Collapsible open={isOpen} className="group/collapsible min-w-0">
        <CollapsibleTrigger
          render={
            <SidebarMenuButton
              tooltip={item.title}
              isActive={childActive}
              aria-expanded={isOpen}
              onClick={onToggle}
              className="min-w-0"
            />
          }
        >
          <HugeiconsIcon icon={item.icon} aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{item.title}</span>
          {item.badge && (
            <Badge
              variant="primary-light"
              size="sm"
              radius="full"
              className="mr-1 shrink-0 group-data-[collapsible=icon]:hidden"
            >
              {item.badge}
            </Badge>
          )}
          <HugeiconsIcon
            icon={ChevronRightIcon}
            aria-hidden="true"
            className={cn(
              'ml-auto size-4 shrink-0 transition-transform group-data-[collapsible=icon]:hidden',
              isOpen && 'rotate-90'
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="min-w-0 overflow-hidden">
          <SidebarMenuSub className="min-w-0 overflow-hidden">
            {children.map((child) => {
              const isActive = activePath === child.path
              return (
                <SidebarMenuSubItem key={child.path}>
                  <SidebarMenuSubButton
                    isActive={isActive}
                    aria-current={isActive ? 'page' : undefined}
                    render={
                      <a
                        href="#"
                        onClick={(event) => {
                          event.preventDefault()
                          onSelect(child.path)
                        }}
                      />
                    }
                    className="min-w-0"
                  >
                    <span className="min-w-0 truncate">{child.title}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}
