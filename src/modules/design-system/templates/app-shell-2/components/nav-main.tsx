import { useEffect } from 'react'

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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from '@ubits/flux-ui'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ChevronRightIcon } from '@hugeicons/core-free-icons'

import type { NavLeaf, NavNode, NavSection } from './data'
import { useNavigation } from './use-navigation'

type NavGroupData = { label?: string; items: (NavLeaf | NavSection)[] }

function groupNavTree(tree: NavNode[]): NavGroupData[] {
  const groups: NavGroupData[] = [{ items: [] }]

  for (const node of tree) {
    if (node.type === 'category') {
      groups.push({ label: node.label, items: [] })
    } else {
      groups[groups.length - 1].items.push(node)
    }
  }

  return groups.filter((group) => group.items.length > 0)
}

function LeafItem({ node }: { node: NavLeaf }) {
  const { activeId, navigate } = useNavigation()
  const isActive = activeId === node.id

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={node.label}
        isActive={isActive}
        aria-current={isActive ? 'page' : undefined}
        render={
          <a
            href={node.href}
            onClick={(event) => {
              event.preventDefault()
              navigate(node.id)
            }}
          />
        }
        className="min-w-0"
      >
        <span className="relative inline-flex shrink-0">
          <HugeiconsIcon icon={node.icon} aria-hidden="true" />
          {node.badge && (
            <span
              className="bg-primary absolute -top-0.5 -right-0.5 hidden size-1.5 rounded-full group-data-[collapsible=icon]:block"
              aria-hidden="true"
            />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate">{node.label}</span>
      </SidebarMenuButton>
      {node.badge && (
        <SidebarMenuBadge>
          {/* success-light y no success: el blanco sobre verde sólido quedaba en 2,5:1. */}
          <Badge variant="success-light" size="xs">
            {node.badge}
          </Badge>
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  )
}

function SectionItem({ node }: { node: NavSection }) {
  const { activeId, navigate, openSectionIds, toggleSection, drillInto } = useNavigation()
  const { state, setOpen } = useSidebar()
  const isOpen = openSectionIds.has(node.id)
  const childActive = node.children.some((child) => child.id === activeId)

  const handleTriggerClick = () => {
    if (state === 'collapsed') {
      setOpen(true)
      drillInto(node.id)
      return
    }
    toggleSection(node.id)
  }

  return (
    // El Collapsible (un <div>) va dentro del <li>: la lista solo admite <li> como hijos directos.
    <SidebarMenuItem>
      <Collapsible open={isOpen} className="group/collapsible min-w-0">
        <CollapsibleTrigger
          render={
            <SidebarMenuButton
              tooltip={node.label}
              isActive={childActive}
              aria-expanded={isOpen}
              onClick={handleTriggerClick}
              className="min-w-0"
            />
          }
        >
          <span className="relative inline-flex shrink-0">
            <HugeiconsIcon icon={node.icon} aria-hidden="true" />
            {node.badge && (
              <span
                className="bg-primary absolute -top-0.5 -right-0.5 hidden size-1.5 rounded-full group-data-[collapsible=icon]:block"
                aria-hidden="true"
              />
            )}
          </span>
          <span className="min-w-0 flex-1 truncate">{node.label}</span>
          {node.badge && (
            <Badge variant="success-light" size="xs" className="mr-1 group-data-[collapsible=icon]:hidden">
              {node.badge}
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
            {node.children.map((child) => {
              const isActive = activeId === child.id
              return (
                <SidebarMenuSubItem key={child.id}>
                  <SidebarMenuSubButton
                    isActive={isActive}
                    aria-current={isActive ? 'page' : undefined}
                    render={
                      <a
                        href={child.href}
                        onClick={(event) => {
                          event.preventDefault()
                          navigate(child.id)
                        }}
                      />
                    }
                    className="min-w-0"
                  >
                    <span className="min-w-0 truncate">{child.label}</span>
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

function NavGroup({ group, index }: { group: NavGroupData; index: number }) {
  return (
    <div className="min-w-0">
      {index > 0 && <SidebarSeparator />}
      <SidebarGroup>
        {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
        <SidebarGroupContent>
          <SidebarMenu>
            {group.items.map((item) =>
              item.type === 'section' ? <SectionItem key={item.id} node={item} /> : <LeafItem key={item.id} node={item} />
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
  )
}

// Colapsado + click en una sección: en vez de un flyout aparte, la lista se
// reemplaza en el sitio por los hijos de esa sección, con un control de vuelta.
function DrillView({ section }: { section: NavSection }) {
  const { activeId, navigate, drillBack } = useNavigation()
  const { setOpen } = useSidebar()

  const goBack = () => {
    drillBack()
    setOpen(false)
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={goBack} aria-label={`Volver, sección ${section.label}`} className="min-w-0">
              <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate font-medium">{section.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>

      <SidebarSeparator className="my-2" />

      <SidebarGroupContent>
        <SidebarMenu>
          {section.children.map((child) => {
            const isActive = activeId === child.id
            return (
              <SidebarMenuItem key={child.id}>
                <SidebarMenuButton
                  isActive={isActive}
                  aria-current={isActive ? 'page' : undefined}
                  render={
                    <a
                      href={child.href}
                      onClick={(event) => {
                        event.preventDefault()
                        navigate(child.id)
                        setOpen(false)
                      }}
                    />
                  }
                  className="min-w-0"
                >
                  <span className="min-w-0 flex-1 truncate">{child.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function NavMain() {
  const { tree, drillSectionId, drillBack } = useNavigation()
  const { state } = useSidebar()

  // Si el sidebar vuelve a colapsarse por otra vía (ej. el trigger de la
  // topbar) mientras había un drill activo, se descarta para no quedar con
  // una vista de hijos dentro de un riel de solo iconos.
  useEffect(() => {
    if (state === 'collapsed' && drillSectionId) {
      drillBack()
    }
  }, [state, drillSectionId, drillBack])

  if (drillSectionId && state !== 'collapsed') {
    const section = tree.find((node): node is NavSection => node.type === 'section' && node.id === drillSectionId)
    if (section) {
      return <DrillView section={section} />
    }
  }

  const groups = groupNavTree(tree)

  return (
    <>
      {groups.map((group, index) => (
        <NavGroup key={group.label ?? `group-${index}`} group={group} index={index} />
      ))}
    </>
  )
}
