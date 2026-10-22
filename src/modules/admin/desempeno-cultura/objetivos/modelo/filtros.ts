import type { Ciclo } from './ciclos'
import { parseSurveyDate } from '../../encuestas/modelo/surveyListDates'

// Los filtros de la lista de ciclos, en el mismo molde que los de Encuestas: cada columna filtrable es una lista de
// valores elegidos, y `soloIds` es el atajo del panel «Para atender» (ver solo los ciclos con alertas).

export const TRAMOS_AVANCE = ['Menos de 25 %', 'De 25 % a 75 %', 'Más de 75 %'] as const

export interface FiltrosCiclos {
  periodo: string[]
  estado: string[]
  avance: string[]
  /** El rango de la columna Cierre, [desde, hasta] en «aaaa-mm-dd» (vacío un extremo: abierto); sin filtro, vacío. */
  cierre: string[]
  soloIds: readonly string[] | null
}

export const SIN_FILTROS: FiltrosCiclos = { periodo: [], estado: [], avance: [], cierre: [], soloIds: null }

export const hayFiltros = (filtros: FiltrosCiclos) => filtros.periodo.length > 0 || filtros.estado.length > 0 || filtros.avance.length > 0 || filtros.cierre.length > 0 || filtros.soloIds !== null

const tramoDe = (avance: number): string => (avance < 25 ? TRAMOS_AVANCE[0] : avance <= 75 ? TRAMOS_AVANCE[1] : TRAMOS_AVANCE[2])

export function cumpleFiltros(ciclo: Ciclo, filtros: FiltrosCiclos): boolean {
  if (filtros.soloIds && !filtros.soloIds.includes(ciclo.id)) return false
  if (filtros.periodo.length > 0 && !filtros.periodo.includes(ciclo.periodo)) return false
  if (filtros.estado.length > 0 && !filtros.estado.includes(ciclo.estado)) return false
  if (filtros.avance.length > 0 && !filtros.avance.includes(tramoDe(ciclo.avance))) return false
  if (filtros.cierre.length > 0) {
    const cierre = parseSurveyDate(ciclo.cierre)?.getTime()
    if (cierre === undefined) return false
    const [desde, hasta] = filtros.cierre.map((iso) => (iso ? new Date(`${iso}T00:00:00`).getTime() : null))
    if (desde !== null && desde !== undefined && cierre < desde) return false
    if (hasta !== null && hasta !== undefined && cierre > hasta) return false
  }
  return true
}
