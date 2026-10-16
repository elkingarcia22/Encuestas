import { createContext } from 'react'

import type { NavNode } from './data'

export type SidebarMode = 'workspace' | 'agente-ia'

export type ActivePath = { sectionLabel?: string; label: string }

export type NavigationContextValue = {
  mode: SidebarMode
  changeMode: (mode: SidebarMode) => void
  tree: NavNode[]
  activeId: string
  navigate: (id: string) => void
  openSectionIds: Set<string>
  toggleSection: (id: string) => void
  drillSectionId: string | null
  drillInto: (id: string) => void
  drillBack: () => void
  activePath: ActivePath
}

export const NavigationContext = createContext<NavigationContextValue | null>(null)
