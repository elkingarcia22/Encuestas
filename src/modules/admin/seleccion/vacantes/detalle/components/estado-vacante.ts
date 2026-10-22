import { useSyncExternalStore, type SetStateAction } from 'react'
import type { Candidato, Nota, Vacante } from './data'
import { hora } from '@/modules/design-system/patrones/formato'

// Candidatos y descartados de cada vacante, compartidos por el tablero y el expediente del candidato.
// Son dos pantallas: sin esto, mover a alguien de etapa o dejarle una nota en el expediente se perdía al
// volver al tablero. Vive mientras no se recargue la página, como el resto de la maqueta.

type Estado = { candidatos: Candidato[]; descartados: number }

const estados = new Map<string, Estado>()
const oyentes = new Set<() => void>()

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

function leer(vacante: Vacante) {
  let estado = estados.get(vacante.id)
  if (!estado) {
    estado = { candidatos: vacante.candidatos, descartados: vacante.descartados }
    estados.set(vacante.id, estado)
  }
  return estado
}

function cambiar(vacante: Vacante, cambio: (estado: Estado) => Estado) {
  estados.set(vacante.id, cambio(leer(vacante)))
  oyentes.forEach((oyente) => oyente())
}

const resolver = <T,>(valor: SetStateAction<T>, previo: T) => (typeof valor === 'function' ? (valor as (p: T) => T)(previo) : valor)

// Se usa como dos useState: [candidatos, setCandidatos] y [descartados, setDescartados].
export function useEstadoVacante(vacante: Vacante) {
  const estado = useSyncExternalStore(suscribir, () => leer(vacante))
  return {
    candidatos: estado.candidatos,
    descartados: estado.descartados,
    setCandidatos: (valor: SetStateAction<Candidato[]>) => cambiar(vacante, (e) => ({ ...e, candidatos: resolver(valor, e.candidatos) })),
    setDescartados: (valor: SetStateAction<number>) => cambiar(vacante, (e) => ({ ...e, descartados: resolver(valor, e.descartados) })),
  }
}

export const hoy = () => `Hoy, ${hora()}`

// La nota que deja el agente al guardar su resumen del candidato (desde el tablero o desde el expediente).
export function notaDelResumen(candidato: Candidato, id: number): Nota {
  const fortalezas = candidato.fortalezas.map((f) => f.texto.replace(/\.$/, '')).join('; ')
  const riesgos = candidato.riesgos.length ? candidato.riesgos.map((r) => r.texto.replace(/\.$/, '')).join('; ') : 'sin riesgos a la vista'
  return { id, autor: 'Orbit', fecha: hoy(), texto: `Ajuste ${candidato.ajuste} %. Fortalezas: ${fortalezas}. Riesgos: ${riesgos}.`, agente: true }
}
