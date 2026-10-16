import { useSyncExternalStore } from 'react'
import type { IconSvgElement } from '@hugeicons/react'

// Procesos en vivo del Centro de procesos: los publica una pantalla mientras trabaja (p. ej., leer hojas de vida) y el
// centro los muestra arriba de los de ejemplo, con la misma fila. La pantalla los actualiza a su ritmo y los quita al irse.
export type LiveProcess = {
  id: string
  title: string
  meta: string
  // De 0 a 100 mientras corre; sin número cuando se detuvo o terminó.
  progress?: number
  // Ya terminó: el resumen lo cuenta aparte, no como «en espera».
  done?: boolean
  icon?: IconSvgElement
  cta?: string
  onClick?: () => void
}

let processes: LiveProcess[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

// Lo que se ve en la fila. Si no cambió, no se avisa: la pantalla puede publicar en cada render sin repintar el header.
const same = (a: LiveProcess, b: LiveProcess) =>
  a.title === b.title && a.meta === b.meta && a.progress === b.progress && a.done === b.done && a.icon === b.icon && a.cta === b.cta

// Agrega el proceso o, si ya estaba, lo reemplaza en su lugar. Los nuevos van arriba.
export function publishProcess(process: LiveProcess) {
  const current = processes.find((item) => item.id === process.id)
  if (current && same(current, process)) {
    current.onClick = process.onClick
    return
  }
  processes = current ? processes.map((item) => (item.id === process.id ? process : item)) : [process, ...processes]
  emit()
}

export function updateProcess(id: string, change: Partial<Omit<LiveProcess, 'id'>>) {
  const current = processes.find((item) => item.id === id)
  if (current) publishProcess({ ...current, ...change })
}

export function removeProcess(id: string) {
  if (!processes.some((item) => item.id === id)) return
  processes = processes.filter((item) => item.id !== id)
  emit()
}

export function useLiveProcesses() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => processes,
  )
}

// «Historial» del centro: la pantalla en la que se está puede decir qué abre (p. ej., el panel de descargas de una
// encuesta). Sin ella, el botón solo avisa. La pantalla lo registra al montarse y lo quita al irse.
let history: (() => void) | null = null
const historyListeners = new Set<() => void>()

export function setProcessHistory(open: (() => void) | null) {
  history = open
  historyListeners.forEach((listener) => listener())
}

export function useProcessHistory() {
  return useSyncExternalStore(
    (listener) => {
      historyListeners.add(listener)
      return () => historyListeners.delete(listener)
    },
    () => history,
  )
}
