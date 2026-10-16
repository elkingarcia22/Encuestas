import { useSyncExternalStore } from 'react'
import { SURVEYS_LIST } from '../modelo/surveyList'
import { formatSurveyDate, parseSurveyDate } from '../modelo/surveyListDates'
import type { SurveyListItem } from '../modelo/types'

// La lista de encuestas del módulo, compartida por todas sus pantallas. Vive fuera de React para
// que una encuesta creada, duplicada o eliminada siga así al ir al constructor o a los resultados
// y volver. Se reinicia al recargar la página, como el resto de los datos de ejemplo.

// Las fechas de ejemplo («05 abr 2025») se pasan al formato único del sistema («5 abr 2025», fechaCorta; decisión 19
// de la auditoría), el mismo con que la lista escribe las que se crean o se editan: así no conviven dos formas.
const normalizar = (fecha: string) => {
  const leida = parseSurveyDate(fecha)
  return leida ? formatSurveyDate(leida) : fecha
}

let encuestas: readonly SurveyListItem[] = SURVEYS_LIST.map((encuesta) => ({ ...encuesta, startDate: normalizar(encuesta.startDate), endDate: normalizar(encuesta.endDate) }))
const oyentes = new Set<() => void>()

const suscribir = (oyente: () => void) => {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

const leer = () => encuestas

function reemplazar(siguientes: readonly SurveyListItem[]) {
  encuestas = siguientes
  oyentes.forEach((oyente) => oyente())
}

export function useEncuestas(): readonly SurveyListItem[] {
  return useSyncExternalStore(suscribir, leer)
}

export const encuestaPorId = (id: string): SurveyListItem | undefined => encuestas.find((encuesta) => encuesta.id === id)

/** Cambia una encuesta sin tocar las demás. */
export function actualizarEncuesta(id: string, cambios: Partial<SurveyListItem>) {
  reemplazar(encuestas.map((encuesta) => (encuesta.id === id ? { ...encuesta, ...cambios } : encuesta)))
}

export function eliminarEncuestas(ids: readonly string[]) {
  reemplazar(encuestas.filter((encuesta) => !ids.includes(encuesta.id)))
}

/**
 * La copia entra justo debajo del original, como borrador y sin respuestas: una copia no hereda
 * lo que contestó la gente.
 */
export function duplicarEncuestas(ids: readonly string[]) {
  const siguientes: SurveyListItem[] = []
  for (const encuesta of encuestas) {
    siguientes.push(encuesta)
    if (!ids.includes(encuesta.id)) continue
    siguientes.push({
      ...encuesta,
      id: `${encuesta.id}-copia-${Date.now()}`,
      name: `${encuesta.name} (copia)`,
      status: 'Borrador',
      statusVariant: 'neutral',
      participants: '0',
      progress: 0,
    })
  }
  reemplazar(siguientes)
}

/** Una encuesta nueva (del constructor o de una carga) entra arriba de la lista. */
export function agregarEncuesta(encuesta: SurveyListItem) {
  reemplazar([encuesta, ...encuestas.filter((actual) => actual.id !== encuesta.id)])
}
