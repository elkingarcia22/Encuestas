import { useSyncExternalStore } from 'react'

// Estado del banner global (GlobalBanner.tsx): uno a la vez, vive mientras dure la sesión en la pestaña.
export type Banner = {
  tipo: 'warning' | 'invert' | 'info' | 'destructive'
  titulo: string
  descripcion?: string
  accion?: { texto: string; onClick?: () => void }
}

let actual: Banner | null = null
const oyentes = new Set<() => void>()
const avisar = () => oyentes.forEach((oyente) => oyente())

export function mostrarBanner(banner: Banner) {
  actual = banner
  avisar()
}

export function cerrarBanner() {
  actual = null
  avisar()
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

export function useBanner() {
  return useSyncExternalStore(suscribir, () => actual)
}
