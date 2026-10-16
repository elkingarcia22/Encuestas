import { useSyncExternalStore } from 'react'
import { CICLOS, type Ciclo } from '../modelo/ciclos'

// La lista de ciclos del módulo, compartida por el home y el constructor, con el mismo molde que la de Encuestas. Vive
// fuera de React para que un ciclo creado, duplicado o editado siga así al ir al constructor y volver. Se reinicia al
// recargar la página, como el resto de los datos de ejemplo.

let ciclos: readonly Ciclo[] = CICLOS
const oyentes = new Set<() => void>()

const suscribir = (oyente: () => void) => {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

const leer = () => ciclos

function reemplazar(siguientes: readonly Ciclo[]) {
  ciclos = siguientes
  oyentes.forEach((oyente) => oyente())
}

export function useCiclos(): readonly Ciclo[] {
  return useSyncExternalStore(suscribir, leer)
}

export const cicloPorId = (id: string): Ciclo | undefined => ciclos.find((ciclo) => ciclo.id === id)

/** Cambia un ciclo sin tocar los demás. */
export function actualizarCiclo(id: string, cambios: Partial<Ciclo>) {
  reemplazar(ciclos.map((ciclo) => (ciclo.id === id ? { ...ciclo, ...cambios } : ciclo)))
}

/** Guarda un ciclo: reemplaza el que tenga su id o, si es nuevo, lo pone arriba de la lista. */
export function guardarCiclo(ciclo: Ciclo) {
  reemplazar(ciclos.some((otro) => otro.id === ciclo.id) ? ciclos.map((otro) => (otro.id === ciclo.id ? ciclo : otro)) : [ciclo, ...ciclos])
}

export function eliminarCiclos(ids: readonly string[]) {
  reemplazar(ciclos.filter((ciclo) => !ids.includes(ciclo.id)))
}

/**
 * La copia entra justo debajo del original, como borrador y sin avance. Lleva su propio id y su propio borrador, con
 * ese id: en el prototipo la copia compartía el del original y editarla pisaba la fila de la que salió.
 */
export function duplicarCiclos(ids: readonly string[]) {
  const siguientes: Ciclo[] = []
  for (const ciclo of ciclos) {
    siguientes.push(ciclo)
    if (!ids.includes(ciclo.id)) continue
    const id = `${ciclo.id}-copia-${Date.now()}`
    const nombre = `${ciclo.nombre} (copia)`
    siguientes.push({
      ...ciclo,
      id,
      nombre,
      estado: 'Borrador',
      personas: 0,
      avance: 0,
      cumplidos: 0,
      reportando: 0,
      anterior: null,
      draft: ciclo.draft ? { ...ciclo.draft, _id: id, name: nombre, status: 'draft' } : undefined,
    })
  }
  reemplazar(siguientes)
}
