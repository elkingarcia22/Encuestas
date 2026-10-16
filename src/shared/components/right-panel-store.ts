import { useSyncExternalStore } from 'react'

// Aviso compartido de «hay un panel ocupando toda la derecha» (p. ej., actividad del agente en el chat).
// La pantalla que lo abre lo enciende y el header lo lee para compactar el buscador.
let open = false
const listeners = new Set<() => void>()

export function setRightPanelOpen(value: boolean) {
  if (open === value) return
  open = value
  listeners.forEach((listener) => listener())
}

export function useRightPanelOpen() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => open,
  )
}
