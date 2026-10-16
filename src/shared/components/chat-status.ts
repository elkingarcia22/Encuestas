import { useEffect, useSyncExternalStore } from 'react'
import type { ChatStatus } from '@/shared/layouts/nav-config'

// Conversaciones con respuesta sin leer que ya se abrieron en esta sesión: dejan de mostrar el punto azul aunque se
// salga de ellas. Vive en memoria, así que al recargar vuelven a su estado de ejemplo (el de nav-config).
const opened = new Set<string>()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function markChatRead(path: string) {
  if (opened.has(path)) return
  opened.add(path)
  listeners.forEach((listener) => listener())
}

// Estado que se muestra: «pensando» mientras el agente trabaja; «sin leer» hasta que se abre la conversación (al
// abrirla queda leída); en cualquier otro caso, leída.
export function useChatStatus(path: string, status: ChatStatus, active: boolean): ChatStatus {
  const wasOpened = useSyncExternalStore(subscribe, () => opened.has(path))

  useEffect(() => {
    if (active && status === 'unread') markChatRead(path)
  }, [active, path, status])

  if (status === 'thinking') return 'thinking'
  return status === 'unread' && !wasOpened && !active ? 'unread' : 'read'
}
