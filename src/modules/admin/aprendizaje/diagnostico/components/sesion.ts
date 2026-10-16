import { useSyncExternalStore } from 'react'
import { ASSESSMENTS, type Assessment } from './datos'

// Los assessments de la sesión: los de la base más los que se crean en «Crear assessment». Viven fuera de las
// pantallas para que lo creado aparezca de primero al volver a Diagnóstico. Duran mientras no se recargue la página,
// como el resto de la maqueta (igual que los planes de Planes de formación).

let assessments: Assessment[] = ASSESSMENTS
const oyentes = new Set<() => void>()

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

export function useAssessments() {
  return useSyncExternalStore(suscribir, () => assessments)
}

export function cambiarAssessments(cambio: (todos: Assessment[]) => Assessment[]) {
  assessments = cambio(assessments)
  oyentes.forEach((oyente) => oyente())
}

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()

/** Ya hay un assessment con ese nombre (sin distinguir mayúsculas ni tildes, como en producción). */
export const nombreOcupado = (nombre: string) => assessments.some((a) => normalizar(a.nombre) === normalizar(nombre))

/** Los planes que ya tienen un assessment creado aquí: no se les crea otro. */
export const planesConAssessment = () => new Set(assessments.filter((a) => a.competencias).map((a) => a.planId))
