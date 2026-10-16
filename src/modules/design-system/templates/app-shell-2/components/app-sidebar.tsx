import { HugeiconsIcon } from '@hugeicons/react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@ubits/flux-ui'

import { CompanySwitcher } from './company-switcher'
import { FEEDBACK_ITEM } from './data'
import { NavMain } from './nav-main'
import { PromoCard } from './promo-card'
import { SidebarModeTabs } from './sidebar-mode-tabs'

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader className="min-w-0 gap-3 overflow-hidden p-3">
        <CompanySwitcher />
        <SidebarModeTabs />
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden overflow-y-auto">
        <NavMain />
      </SidebarContent>

      <SidebarFooter className="min-w-0 gap-3 overflow-hidden p-3">
        <PromoCard />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={FEEDBACK_ITEM.label} className="min-w-0">
              <HugeiconsIcon icon={FEEDBACK_ITEM.icon} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{FEEDBACK_ITEM.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
