import { useCallback, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'

// `pedido`: el texto que lo originó (solo los de la persona). `cuando`: la hora en milisegundos.
export type AgentMsg = { id: number; role: 'user' | 'agent'; content: ReactNode; pedido?: string; cuando?: number }

// Una conversación guardada al empezar otra (OF-45): sus mensajes y cuándo empezó.
export type ConversacionArchivada = { id: number; cuando: number; msgs: AgentMsg[] }

type Hilo = {
  msgs: AgentMsg[]
  // Pedidos que todavía no tienen respuesta: mientras haya uno, el agente está «Razonando…» (OF-46).
  pendientes: number
  archivadas: ConversacionArchivada[]
  // Lo que cada respuesta recuerda de sí misma (lo que se eligió, si ya se guardó…): sobrevive a cerrar el panel (OF-44).
  estados: Map<string, unknown>
}

// Las conversaciones con clave viven fuera de la pantalla: siguen ahí al cerrar el panel, al cambiar de pestaña o al
// abrir otra ficha, mientras dure la visita (OF-44). Sin clave, cada panel tiene la suya y se pierde al desmontarse.
const hilos = new Map<string, Hilo>()
const oyentes = new Map<string, Set<() => void>>()
const esperas = new Map<string, Set<number>>()
let secuencia = 1000

const vacio = (): Hilo => ({ msgs: [], pendientes: 0, archivadas: [], estados: new Map() })
const leer = (clave: string) => {
  let hilo = hilos.get(clave)
  if (!hilo) {
    hilo = vacio()
    hilos.set(clave, hilo)
  }
  return hilo
}
const escribir = (clave: string, cambio: (hilo: Hilo) => Partial<Hilo>) => {
  const hilo = leer(clave)
  hilos.set(clave, { ...hilo, ...cambio(hilo) })
  oyentes.get(clave)?.forEach((oyente) => oyente())
}
const suscribir = (clave: string) => (oyente: () => void) => {
  if (!oyentes.has(clave)) oyentes.set(clave, new Set())
  oyentes.get(clave)?.add(oyente)
  return () => {
    oyentes.get(clave)?.delete(oyente)
  }
}

// Lo que una respuesta recuerda de sí misma, guardado en su conversación (ver `useEstadoDelMensaje` en agent-kit).
export const estadoDelHilo = {
  leer: <T,>(clave: string, nombre: string): T | undefined => leer(clave).estados.get(nombre) as T | undefined,
  guardar: (clave: string, nombre: string, valor: unknown) =>
    escribir(clave, (hilo) => {
      const estados = new Map(hilo.estados)
      estados.set(nombre, valor)
      return { estados }
    }),
  suscribir: (clave: string) => suscribir(clave),
}

let anonimas = 0

// Conversación del panel: agrega el pedido, muestra «Razonando…» y responde después de un momento (el tiempo
// da para ver los segundos correr, como en el chat).
//
// Con `clave` la conversación se guarda fuera del panel (ver arriba), se puede detener lo que se está respondiendo
// (`detener`), corregir un pedido para que responda de nuevo desde ahí (`rehacerDesde`) y empezar otra (`nueva`).
export function useAgentThread(initial: AgentMsg[] = [], opciones: { clave?: string } = {}) {
  const [propia] = useState(() => `anonima-${(anonimas += 1)}`)
  const clave = opciones.clave ?? propia
  const inicial = useRef(initial)
  if (!hilos.has(clave) && inicial.current.length) hilos.set(clave, { ...vacio(), msgs: inicial.current })
  const suscribirse = useCallback((oyente: () => void) => suscribir(clave)(oyente), [clave])
  const hilo = useSyncExternalStore(suscribirse, () => leer(clave))

  const push = useCallback(
    (role: AgentMsg['role'], content: ReactNode, pedido?: string) => {
      secuencia += 1
      const id = secuencia
      escribir(clave, (actual) => ({ msgs: [...actual.msgs, { id, role, content, pedido, cuando: Date.now() }] }))
      return id
    },
    [clave],
  )

  const ask = useCallback(
    (text: string, reply: ReactNode | (() => ReactNode), delay = 2400) => {
      push('user', text, text)
      escribir(clave, (actual) => ({ pendientes: actual.pendientes + 1 }))
      const espera = window.setTimeout(() => {
        esperas.get(clave)?.delete(espera)
        escribir(clave, (actual) => ({ pendientes: Math.max(0, actual.pendientes - 1) }))
        push('agent', typeof reply === 'function' ? reply() : reply)
      }, delay)
      if (!esperas.has(clave)) esperas.set(clave, new Set())
      esperas.get(clave)?.add(espera)
    },
    [clave, push],
  )

  // «Detener»: lo que estaba en camino no llega y el agente dice que paró.
  const detener = useCallback(
    (aviso: ReactNode = 'Detuve la respuesta. Pídemela de nuevo cuando quieras.') => {
      const enCamino = esperas.get(clave)
      if (!enCamino?.size) return
      enCamino.forEach((id) => window.clearTimeout(id))
      enCamino.clear()
      escribir(clave, () => ({ pendientes: 0 }))
      push('agent', aviso)
    },
    [clave, push],
  )

  // Corregir un pedido: se borra lo que venía después de él y el agente responde al pedido nuevo.
  const rehacerDesde = useCallback(
    (id: number, text: string, reply: ReactNode | (() => ReactNode), delay = 2400) => {
      esperas.get(clave)?.forEach((espera) => window.clearTimeout(espera))
      esperas.get(clave)?.clear()
      escribir(clave, (actual) => ({ msgs: actual.msgs.filter((msg) => msg.id < id), pendientes: 0 }))
      ask(text, reply, delay)
    },
    [clave, ask],
  )

  // Empezar otra conversación: la de ahora se guarda (si tenía algo) y se puede volver a ella. Devuelve cómo deshacerlo.
  const nueva = useCallback(() => {
    const antes = leer(clave)
    if (!antes.msgs.length) return () => {}
    esperas.get(clave)?.forEach((espera) => window.clearTimeout(espera))
    esperas.get(clave)?.clear()
    secuencia += 1
    const archivada: ConversacionArchivada = { id: secuencia, cuando: antes.msgs[0].cuando ?? Date.now(), msgs: antes.msgs }
    escribir(clave, (actual) => ({ msgs: [], pendientes: 0, archivadas: [archivada, ...actual.archivadas] }))
    return () => escribir(clave, (actual) => ({ msgs: archivada.msgs, archivadas: actual.archivadas.filter((una) => una.id !== archivada.id) }))
  }, [clave])

  // Volver a una conversación anterior: la de ahora se archiva en su lugar.
  const retomar = useCallback(
    (id: number) => {
      const actual = leer(clave)
      const elegida = actual.archivadas.find((una) => una.id === id)
      if (!elegida) return
      secuencia += 1
      const archivada = actual.msgs.length ? [{ id: secuencia, cuando: actual.msgs[0].cuando ?? Date.now(), msgs: actual.msgs }] : []
      escribir(clave, (antes) => ({ msgs: elegida.msgs, pendientes: 0, archivadas: [...archivada, ...antes.archivadas.filter((una) => una.id !== id)] }))
    },
    [clave],
  )

  const setThinking = useCallback((valor: boolean) => escribir(clave, () => ({ pendientes: valor ? 1 : 0 })), [clave])

  const reset = useCallback(() => {
    esperas.get(clave)?.forEach((espera) => window.clearTimeout(espera))
    esperas.get(clave)?.clear()
    escribir(clave, () => ({ msgs: inicial.current, pendientes: 0 }))
  }, [clave])

  const thinking = hilo.pendientes > 0
  // Cambia cada vez que llega algo nuevo: el panel lo usa para bajar solo.
  const scrollKey = `${hilo.msgs.length}-${thinking}`

  return {
    clave,
    msgs: hilo.msgs,
    thinking,
    pendientes: hilo.pendientes,
    archivadas: hilo.archivadas,
    setThinking,
    push,
    ask,
    detener,
    rehacerDesde,
    nueva,
    retomar,
    reset,
    scrollKey,
  }
}
