import { useSyncExternalStore } from 'react'

// Lo que se cambia de un ciclo desde sus Resultados (21-oct, del prototipo): a quién se sacó del ciclo y qué objetivos
// se inactivaron. Vive fuera de React, como la lista de ciclos, para que siga así al cambiar de pestaña o volver a la
// lista; se reinicia al recargar la página, como el resto de los datos de ejemplo.
//
// - Sacar a alguien: «conservar» lo deja contando en el progreso del ciclo (con lo que ya avanzó); «descartar» lo quita
//   de todas las cuentas y se pierde el avance de sus objetivos.
// - Inactivar un objetivo: deja de contar para la persona y sale del ponderado; su avance se conserva.

export type DestinoAvance = 'conservar' | 'descartar'

export interface AjustesCiclo {
  retirados: Readonly<Record<string, DestinoAvance>>
  inactivos: readonly string[]
}

export const SIN_AJUSTES: AjustesCiclo = { retirados: {}, inactivos: [] }

let porCiclo: Readonly<Record<string, AjustesCiclo>> = {}
const oyentes = new Set<() => void>()

const suscribir = (oyente: () => void) => {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

function cambiar(cicloId: string, cambio: (actual: AjustesCiclo) => AjustesCiclo) {
  porCiclo = { ...porCiclo, [cicloId]: cambio(porCiclo[cicloId] ?? SIN_AJUSTES) }
  oyentes.forEach((oyente) => oyente())
}

export function useAjustesCiclo(cicloId: string): AjustesCiclo {
  return useSyncExternalStore(suscribir, () => porCiclo[cicloId] ?? SIN_AJUSTES)
}

export function sacarDelCiclo(cicloId: string, personas: readonly string[], destino: DestinoAvance) {
  cambiar(cicloId, (actual) => ({ ...actual, retirados: { ...actual.retirados, ...Object.fromEntries(personas.map((id) => [id, destino])) } }))
}

export function activarObjetivos(cicloId: string, objetivos: readonly string[], activo: boolean) {
  cambiar(cicloId, (actual) => ({
    ...actual,
    inactivos: activo ? actual.inactivos.filter((id) => !objetivos.includes(id)) : [...new Set([...actual.inactivos, ...objetivos])],
  }))
}
