import type { ReactNode } from 'react'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { Tabs, TabsList, TabsTrigger } from '@ubits/flux-ui'

export type SidebarMode = 'workspace' | 'agente-ia'

// Pestañas que cambian de ambiente: Workspace y el ambiente de IA, que hoy se llama «Orbit» (el agente
// contextual de cada pantalla es «Orbit Flow»). El ícono de IA marca la pestaña del ambiente de IA.
// Un template puede cambiar los íconos (p. ej. la bolita de IA del concepto de Suite AI).
export function SidebarModeTabs({
  mode,
  onModeChange,
  iconos,
}: {
  mode: SidebarMode
  onModeChange: (mode: SidebarMode) => void
  iconos?: { workspace?: ReactNode; agente?: ReactNode }
}) {
  return (
    <Tabs
      value={mode}
      onValueChange={(next) => onModeChange(next as SidebarMode)}
      className="min-w-0 group-data-[collapsible=icon]:hidden"
    >
      <TabsList className="h-10 w-full">
        <TabsTrigger value="workspace" className="flex-1 py-2">
          {iconos?.workspace}
          Workspace
        </TabsTrigger>
        <TabsTrigger value="agente-ia" className="flex-1 py-2">
          {iconos?.agente ?? <IconoIA />}
          Orbit
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
