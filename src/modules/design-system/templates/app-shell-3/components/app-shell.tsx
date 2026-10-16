import type { CSSProperties } from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  SidebarInset,
  SidebarProvider,
} from '@ubits/flux-ui'
import { SlotArea } from '@/shared/components/SlotArea'

import { AppSidebar } from './app-sidebar'
import { HomeView } from './home-view'
import { NavProvider } from './nav-state'
import { useNav } from './use-navigation'

function Migas() {
  const { etiqueta, seccion } = useNav()

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Inicio</BreadcrumbLink>
          </BreadcrumbItem>
          {seccion ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">{seccion}</BreadcrumbLink>
              </BreadcrumbItem>
            </>
          ) : null}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{etiqueta}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}

function Contenido() {
  const { activo, etiqueta } = useNav()

  return (
    <SidebarInset>
      <Migas />
      <div className="flex min-h-0 flex-1 flex-col overflow-auto px-6 pb-6">
        {activo === 'inicio' ? (
          <HomeView />
        ) : (
          <SlotArea name={etiqueta} hint="Pantalla por maquetar" className="min-h-80" />
        )}
      </div>
    </SidebarInset>
  )
}

export function AppShell() {
  return (
    <NavProvider>
      {/* El ancho va por `style`: SidebarProvider pone --sidebar-width como estilo
          en línea, así que una clase tipo [--sidebar-width:...] nunca le gana. */}
      <SidebarProvider style={{ '--sidebar-width': '272px' } as CSSProperties}>
        <AppSidebar />
        <Contenido />
      </SidebarProvider>
    </NavProvider>
  )
}
