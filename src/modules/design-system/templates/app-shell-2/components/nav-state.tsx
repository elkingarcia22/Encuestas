import { useMemo, useState, type ReactNode } from 'react'

import { AGENT_TREE, NAV_TREE, type NavNode } from './data'
import { NavigationContext, type ActivePath, type SidebarMode } from './nav-context'

function treeFor(mode: SidebarMode): NavNode[] {
  return mode === 'workspace' ? NAV_TREE : AGENT_TREE
}

function findParentSectionId(tree: NavNode[], id: string): string | null {
  for (const node of tree) {
    if (node.type === 'section' && node.children.some((child) => child.id === id)) {
      return node.id
    }
  }
  return null
}

function findActivePath(tree: NavNode[], id: string): ActivePath {
  for (const node of tree) {
    if (node.type === 'leaf' && node.id === id) {
      return { label: node.label }
    }
    if (node.type === 'section') {
      const child = node.children.find((c) => c.id === id)
      if (child) return { sectionLabel: node.label, label: child.label }
    }
  }
  return { label: '' }
}

function firstLeafId(tree: NavNode[]): string {
  const leaf = tree.find((node): node is Extract<NavNode, { type: 'leaf' }> => node.type === 'leaf')
  return leaf?.id ?? ''
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<SidebarMode>('workspace')
  const [activeId, setActiveId] = useState('lms-creator')
  const [openSectionIds, setOpenSectionIds] = useState<Set<string>>(() => {
    const parent = findParentSectionId(NAV_TREE, 'lms-creator')
    return new Set(parent ? [parent] : [])
  })
  const [drillSectionId, setDrillSectionId] = useState<string | null>(null)

  const tree = treeFor(mode)

  const navigate = (id: string) => {
    setActiveId(id)
    setDrillSectionId(null)
    const parent = findParentSectionId(tree, id)
    if (parent) {
      setOpenSectionIds((prev) => new Set(prev).add(parent))
    }
  }

  const toggleSection = (id: string) => {
    setOpenSectionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const changeMode = (nextMode: SidebarMode) => {
    const nextTree = treeFor(nextMode)
    const nextActiveId = firstLeafId(nextTree)
    setMode(nextMode)
    setDrillSectionId(null)
    setActiveId(nextActiveId)
    const parent = findParentSectionId(nextTree, nextActiveId)
    setOpenSectionIds(new Set(parent ? [parent] : []))
  }

  const drillInto = (id: string) => setDrillSectionId(id)
  const drillBack = () => setDrillSectionId(null)

  const activePath = useMemo(() => findActivePath(tree, activeId), [tree, activeId])

  return (
    <NavigationContext.Provider
      value={{
        mode,
        changeMode,
        tree,
        activeId,
        navigate,
        openSectionIds,
        toggleSection,
        drillSectionId,
        drillInto,
        drillBack,
        activePath,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}
