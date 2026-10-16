import { useContext } from 'react'

import { NavigationContext } from './nav-context'

export function useNavigation() {
  const ctx = useContext(NavigationContext)
  if (!ctx) {
    throw new Error('useNavigation debe usarse dentro de NavigationProvider')
  }
  return ctx
}
