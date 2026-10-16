import { useState } from 'react'

import { HugeiconsIcon } from '@hugeicons/react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@ubits/flux-ui'

import { feedbackItem } from '@/shared/layouts/nav-config'

import { NavList } from './nav-list'
import { SidebarBrand } from './sidebar-brand'
import { SidebarModeTabs, type SidebarMode } from './sidebar-mode-tabs'

export function AppSidebar() {
  const [mode, setMode] = useState<SidebarMode>('workspace')

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader className="min-w-0 gap-3 overflow-hidden p-3">
        <SidebarBrand />
        <SidebarModeTabs mode={mode} onModeChange={setMode} />
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden overflow-y-auto">
        {mode === 'workspace' ? (
          <NavList />
        ) : (
          <p className="text-muted-foreground px-4 py-6 text-sm">
            Los agentes de IA para HR estarán disponibles próximamente.
          </p>
        )}
      </SidebarContent>

      <SidebarFooter className="min-w-0 gap-3 overflow-hidden p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={feedbackItem.title} className="min-w-0">
              <HugeiconsIcon icon={feedbackItem.icon} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{feedbackItem.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
