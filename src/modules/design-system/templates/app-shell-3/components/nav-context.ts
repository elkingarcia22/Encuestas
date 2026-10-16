import { createContext } from 'react'

export type NavState = {
  activo: string
  navegar: (id: string) => void
  etiqueta: string
  seccion?: string
}

export const NavContext = createContext<NavState | null>(null)
