import type { CicloBuilderAssignmentSeed, ObjectiveSetKind, CicloDraft } from '../../modelo/constructor/cicloBuilderTypes'
import { cicloStepIssue, getCicloStepperOrder, isCicloStepReachable, type CicloStepId, type CicloStepperStatusInput } from '../../modelo/constructor/cicloStepper'

// Los pasos del constructor en español, sobre la lógica del prototipo (`cicloStepper`), con los mismos nombres de
// funciones que `encuestas/crear/components/pasos.ts`. La diferencia con Encuestas es que aquí el recorrido no es fijo:
// lo decide la parametrización. RRHH reparte los objetivos y llega hasta la alineación; con líderes, colaboradores u
// otros, el administrador elige a la gente, escribe el norte y lanza el ciclo.

export type PasoId = CicloStepId

export interface Paso {
  id: PasoId
  titulo: string
  /** La bajada del encabezado de la página en este paso. */
  descripcion: string
}

const PASOS: Readonly<Record<PasoId, Paso>> = {
  general: { id: 'general', titulo: 'Parametrización', descripcion: 'Nombre, fechas, metodología y quién redacta los objetivos.' },
  participants: { id: 'participants', titulo: 'Participantes', descripcion: 'Elige quiénes entran al ciclo.' },
  company: { id: 'company', titulo: 'Objetivos de la empresa', descripcion: 'Los resultados de la compañía: el norte de todo lo demás.' },
  objectives: { id: 'objectives', titulo: 'Objetivos asignados', descripcion: 'Reparte los objetivos por grupo o persona, con su peso.' },
  alignment: { id: 'alignment', titulo: 'Alineación', descripcion: 'Conecta lo asignado con los objetivos de la empresa.' },
}

export const pasoDe = (id: PasoId): Paso => PASOS[id]

export interface EstadoDelBorrador extends CicloStepperStatusInput {
  orden: readonly PasoId[]
}

/** Las semillas de plantilla que aún esperan destinatario, por tipo: mientras haya una, su paso no está listo. */
export const semillasPendientes = (semillas: readonly CicloBuilderAssignmentSeed[]): ReadonlySet<ObjectiveSetKind> => new Set(semillas.filter((semilla) => semilla.objectives.length > 0).map((semilla) => semilla.kind))

export function estadoDelBorrador(borrador: CicloDraft, visitados: ReadonlySet<PasoId>, semillas: readonly CicloBuilderAssignmentSeed[] = []): EstadoDelBorrador {
  const entrada: CicloStepperStatusInput = { draft: borrador, visitedSteps: visitados, pendingSeedKinds: semillasPendientes(semillas), flow: 'parametrizado' }
  return { ...entrada, orden: getCicloStepperOrder(borrador, 'parametrizado') }
}

export const indiceDe = (paso: PasoId, estado: EstadoDelBorrador) => estado.orden.indexOf(paso)
export const faltaEn = (paso: PasoId, estado: EstadoDelBorrador) => cicloStepIssue(paso, estado)
export const pasoCompleto = (paso: PasoId, estado: EstadoDelBorrador) => faltaEn(paso, estado) === null
export const pasoAlcanzable = (paso: PasoId, estado: EstadoDelBorrador) => isCicloStepReachable(paso, estado)

/** El primer paso, hasta `hasta` (sin incluirlo), que todavía tiene algo pendiente, con lo que le falta. */
export function primerPendiente(estado: EstadoDelBorrador, hasta: PasoId): { paso: PasoId; mensaje: string } | null {
  for (const paso of estado.orden.slice(0, Math.max(0, estado.orden.indexOf(hasta)))) {
    const falta = faltaEn(paso, estado)
    if (falta) return { paso, mensaje: `${falta}.` }
  }
  return null
}

/** Al finalizar se revisan todos los pasos del recorrido: cuáles fallan y el aviso que lo dice. */
export function resumenFinalizar(estado: EstadoDelBorrador): { fallidos: PasoId[]; mensaje: string } {
  const fallidos = estado.orden.filter((paso) => !pasoCompleto(paso, estado))
  if (fallidos.length === 0) return { fallidos, mensaje: '' }
  const primero = faltaEn(fallidos[0], estado)
  const resto = fallidos.length - 1
  return { fallidos, mensaje: resto === 0 ? `${primero}.` : `${primero} y ${resto} ${resto === 1 ? 'paso más' : 'pasos más'} por completar.` }
}

/** La etiqueta del botón del último paso, el verbo del flujo como «Crear encuesta» (21-oct): RRHH termina con «Crear
 *  ciclo»; con líderes, colaboradores u otros, el administrador «Lanza el ciclo» y los demás escriben lo suyo. «Finalizar»
 *  queda solo para cerrar un ciclo en curso, desde la lista. */
// 21-oct: el último paso de toda creación dice «Publicar», escriba quien escriba los objetivos.
export const etiquetaFinal = (_borrador: CicloDraft) => 'Publicar'
