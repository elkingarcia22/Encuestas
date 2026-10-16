import type { Corte } from './lecturas'
import { nivelDe, riesgoDe, type NivelId, type PersonaSeguida, type ResultadosCiclo, type Riesgo } from './seguimiento'

// El ranking de un ciclo (portado del prototipo «configuración objetivos», 9-oct): por persona o por el grupo de «Ver
// por», de mayor a menor avance. Trae los dos cuidados del prototipo:
// - Un grupo de menos de tres personas no se compara: su promedio sería el resultado de una persona con el nombre de un
//   grupo encima. Se muestra bloqueado, no se borra, para que nadie crea que faltan datos.
// - Quien no ha reportado no compite: no tiene avance que ordenar.

export const MINIMO_GRUPO = 3

export type ModoRanking = 'grupo' | 'persona'

export interface FilaRanking {
  id: string
  etiqueta: string
  detalle: string
  avance: number
  nivel: NivelId
  riesgo: Riesgo
  bloqueada: boolean
  /** La persona, cuando la fila es de una sola (para abrir su ficha). */
  persona: PersonaSeguida | null
}

export function ranking(r: ResultadosCiclo, modo: ModoRanking, corte: Corte): FilaRanking[] {
  const conAvance = r.personas.filter((persona) => persona.avance !== null)
  if (modo === 'persona') {
    return conAvance.map((persona) => ({
      id: persona.id,
      etiqueta: persona.colaborador.name,
      detalle: `${persona.colaborador.area} · ${persona.colaborador.leader ?? 'Sin líder'}`,
      avance: persona.avance ?? 0,
      nivel: persona.nivel,
      riesgo: persona.riesgo,
      bloqueada: false,
      persona,
    }))
  }
  const grupos = new Map<string, PersonaSeguida[]>()
  for (const persona of conAvance) {
    const clave = persona.colaborador[corte] ?? 'Sin líder'
    grupos.set(clave, [...(grupos.get(clave) ?? []), persona])
  }
  return [...grupos.entries()].map(([grupo, personas]) => {
    const avance = Math.round((personas.reduce((s, persona) => s + (persona.avance ?? 0), 0) / personas.length) * 10) / 10
    return {
      id: grupo,
      etiqueta: grupo,
      detalle: `${personas.length} ${personas.length === 1 ? 'persona' : 'personas'}`,
      avance,
      nivel: nivelDe(avance),
      riesgo: riesgoDe(avance, r.calendario, r.abierto),
      bloqueada: personas.length < MINIMO_GRUPO,
      persona: null,
    }
  })
}
