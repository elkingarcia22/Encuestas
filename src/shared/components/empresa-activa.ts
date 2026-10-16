import { useSyncExternalStore } from 'react'

// Qué empresa está usando la plataforma ahora mismo.
//
// El menú de la cuenta siempre dejó cambiar de empresa, pero se lo guardaba para él: era un cambio de nombre y de
// logo, y ninguna pantalla se enteraba. Desde el 6-oct sí hace falta que se entere, porque hay cosas que dependen de
// la empresa —el primer caso son los catálogos de contenido: UBITS tiene dos y las demás una— y el prototipo no se
// sostiene si el menú dice una empresa y la pantalla muestra lo de otra.
//
// Se queda en memoria a propósito: al recargar se vuelve a Meta Colombia, que es la empresa con la que se enseña
// casi todo. Mismo patrón que los demás estados compartidos de `shared/` (la miga de pan, el panel derecho).

const POR_DEFECTO = 'meta'

let actual = POR_DEFECTO
const oyentes = new Set<() => void>()

const avisar = () => oyentes.forEach((oyente) => oyente())
const suscribir = (oyente: () => void) => {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}
const leer = () => actual

/** Lo llama el menú de la cuenta al cambiar de empresa. */
export function setEmpresaActiva(id: string) {
  if (id === actual) return
  actual = id
  avisar()
}

/** Lo usa cualquier pantalla que muestre algo distinto según la empresa. */
export function useEmpresaActiva(): string {
  return useSyncExternalStore(suscribir, leer, leer)
}
