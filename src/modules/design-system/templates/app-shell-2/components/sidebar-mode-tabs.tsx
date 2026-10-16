import { Tabs, TabsList, TabsTrigger } from '@ubits/flux-ui'

import type { SidebarMode } from './nav-context'
import { useNavigation } from './use-navigation'

export function SidebarModeTabs() {
  const { mode, changeMode } = useNavigation()

  return (
    <Tabs
      value={mode}
      onValueChange={(next) => changeMode(next as SidebarMode)}
      className="min-w-0 group-data-[collapsible=icon]:hidden"
    >
      <TabsList className="w-full">
        <TabsTrigger value="workspace" className="flex-1">
          Workspace
        </TabsTrigger>
        <TabsTrigger value="agente-ia" className="flex-1">
          Orbit Flow
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
