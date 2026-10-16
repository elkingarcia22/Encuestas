import { cn, SidebarInset, SidebarProvider } from '@ubits/flux-ui'

import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'
import { NavigationProvider } from './nav-state'
import { PageFooter } from './page-footer'

export function AppShell() {
  return (
    <NavigationProvider>
      <SidebarProvider
        className={cn(
          '[--sidebar-width:260px]',
          '[--sidebar-border:transparent]',
          '[&_[data-slot=sidebar-inner]]:border-border/80 [&_[data-slot=sidebar-inner]]:border',
          '[&_[data-slot=sidebar-inner]]:shadow-xs [&_[data-slot=sidebar-inner]]:shadow-black/5',
          '[&_[data-slot=sidebar-menu-button][data-active]]:border-border/60! [&_[data-slot=sidebar-menu-button][data-active]]:border',
          '[&_[data-slot=sidebar-menu-button][data-active]]:shadow-xs! [&_[data-slot=sidebar-menu-button][data-active]]:shadow-black/5!',
          '[&_[data-slot=sidebar-menu-button][data-active]]:bg-background! [&_[data-slot=sidebar-menu-button][data-active]]:hover:bg-background! **:data-[slot=sidebar-menu-button]:hover:bg-transparent!',
          '[&_[data-slot=sidebar-menu-button][data-active]]:text-foreground [&_[data-slot=sidebar-menu-button][data-active]_svg]:text-primary [&_[data-slot=sidebar-menu-button][data-active]_svg]:opacity-100',
          '**:data-[slot=sidebar-menu-button]:text-foreground',
          '[&_[data-collapsible=icon]_[data-slot=sidebar-menu-button][data-active]_svg]:-ml-px',
          '[&_[data-slot=sidebar-menu-button]:hover_svg]:opacity-100 [&_[data-slot=sidebar-menu-button]_svg]:opacity-60',
          '[&_[data-slot=sidebar-menu-sub-button][data-active]]:border-border/60! [&_[data-slot=sidebar-menu-sub-button][data-active]]:border',
          '[&_[data-slot=sidebar-menu-sub-button][data-active]]:shadow-xs! [&_[data-slot=sidebar-menu-sub-button][data-active]]:shadow-black/5!',
          '[&_[data-slot=sidebar-menu-sub-button][data-active]]:bg-background! [&_[data-slot=sidebar-menu-sub-button][data-active]]:hover:bg-background! **:data-[slot=sidebar-menu-sub-button]:hover:bg-transparent!',
          '[&_[data-slot=sidebar-menu-sub-button][data-active]]:text-foreground',
          '**:data-[slot=sidebar-menu-sub-button]:text-foreground'
        )}
      >
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <div className="mx-auto flex w-full max-w-[1140px] flex-1 flex-col gap-4 py-2 pr-4 pl-2">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              <div className="bg-muted/40 border-border/40 aspect-video rounded-lg border border-dashed" />
              <div className="bg-muted/40 border-border/40 aspect-video rounded-lg border border-dashed" />
              <div className="bg-muted/40 border-border/40 aspect-video rounded-lg border border-dashed" />
            </div>
            <div className="bg-muted/40 border-border/40 min-h-screen flex-1 rounded-lg border border-dashed md:min-h-min" />
            <PageFooter />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NavigationProvider>
  )
}
