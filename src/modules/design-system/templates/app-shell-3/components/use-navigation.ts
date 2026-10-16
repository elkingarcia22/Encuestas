import { useContext } from 'react'

import { NavContext } from './nav-context'

export function useNav() {
  const valor = useContext(NavContext)

  if (!valor) {
    throw new Error('useNav debe usarse dentro de NavProvider')
  }

  return valor
}
