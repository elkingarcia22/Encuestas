import { COLLABORATORS, type Collaborator } from '../../../encuestas/modelo/collaborators'
import { effectiveIndividualIds, groupMemberIds, resolveImportedRows } from '../../../encuestas/modelo/participants'
import type { ParticipantsSelection, SegmentKey } from '../../../encuestas/modelo/surveyBuilderTypes'
import type { CicloDraft } from './cicloBuilderTypes'
import type { AssignmentLevel } from './cicloSetup'

// Lo que «Objetivos asignados» toma del paso Participantes: qué grupos y qué personas se pueden repartir. Sale de aquí
// para que el paso, el resumen y el panel lean lo mismo.

/** Las personas del directorio que entran al ciclo: toda la empresa, o los grupos (sin excluidos), las elegidas a mano
 * y las filas del archivo que tienen cuenta. Las del archivo sin cuenta no tienen a quién asignarles objetivos. */
export function participantesDelCiclo(participants: ParticipantsSelection): readonly Collaborator[] {
  if (participants.mode === 'company') return COLLABORATORS
  const ids = new Set(effectiveIndividualIds(participants))
  resolveImportedRows(participants.importedUsers, COLLABORATORS).forEach((fila) => {
    if (fila.person) ids.add(fila.person.id)
  })
  return COLLABORATORS.filter((persona) => ids.has(persona.id))
}

/** Por qué categoría se arman los grupos del ciclo: la de Participantes si ahí se eligieron grupos (un líder no es un
 * área), y si no la que tenga la asignación. */
export function segmentoDeGrupos(borrador: Pick<CicloDraft, 'participants' | 'assignment'>): SegmentKey {
  const { participants } = borrador
  return participants.mode !== 'company' && participants.selectedGroups.length > 0 ? participants.groupSegmentBy : borrador.assignment.groupSegmentBy
}

export type GrupoDelCiclo = { id: string; nombre: string; personas: number }

/** Los grupos a los que se les reparte: exactamente los elegidos en Participantes (con sus personas, sin las que se
 * dejaron fuera). Si allí no se eligieron grupos —toda la empresa, solo personas o un archivo—, los grupos que forman
 * los participantes. */
export function gruposDelCiclo(borrador: Pick<CicloDraft, 'participants' | 'assignment'>): readonly GrupoDelCiclo[] {
  const { participants } = borrador
  if (participants.mode !== 'company' && participants.selectedGroups.length > 0) {
    return [...participants.selectedGroups]
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map((grupo) => ({ id: grupo, nombre: grupo, personas: groupMemberIds(participants.groupSegmentBy, [grupo], COLLABORATORS, participants.excludedIds).size }))
  }
  const segmento = borrador.assignment.groupSegmentBy
  const cuentas = new Map<string, number>()
  participantesDelCiclo(participants).forEach((persona) => {
    const grupo = persona[segmento]
    if (grupo) cuentas.set(grupo, (cuentas.get(grupo) ?? 0) + 1)
  })
  return [...cuentas.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es')).map(([grupo, personas]) => ({ id: grupo, nombre: grupo, personas }))
}

/** Las personas a las que se les reparte una a una: las elegidas a mano fuera de los grupos y las del archivo. Si en Participantes no se
 * eligió a nadie así (toda la empresa o solo grupos), todas las que entran al ciclo. */
export function colaboradoresDelCiclo(participants: ParticipantsSelection): readonly Collaborator[] {
  if (participants.mode === 'company') return COLLABORATORS
  // Quien ya entra por un grupo elegido recibe sus objetivos por ese grupo: aquí van solo las personas sueltas.
  const enGrupos = groupMemberIds(participants.groupSegmentBy, participants.selectedGroups, COLLABORATORS, participants.excludedIds)
  const ids = new Set(participants.selectedIds.filter((id) => !enGrupos.has(id)))
  resolveImportedRows(participants.importedUsers, COLLABORATORS).forEach((fila) => {
    if (fila.person) ids.add(fila.person.id)
  })
  if (ids.size === 0) return participantesDelCiclo(participants)
  return COLLABORATORS.filter((persona) => ids.has(persona.id))
}

/** El nivel de reparto que sale de Participantes: grupos y personas sueltas → mixto; solo grupos → por grupos; solo
 * personas (a mano o por archivo) → individual. Con toda la empresa o sin nada elegido no dice nada: se queda el de la
 * parametrización. Las personas elegidas a mano que ya están dentro de un grupo elegido no cuentan como sueltas. */
export function nivelPorParticipantes(participants: ParticipantsSelection): AssignmentLevel | null {
  if (participants.mode === 'company') return null
  const enGrupos = groupMemberIds(participants.groupSegmentBy, participants.selectedGroups, COLLABORATORS, participants.excludedIds)
  const conGrupos = participants.selectedGroups.length > 0
  const conPersonas = participants.selectedIds.some((id) => !enGrupos.has(id)) || participants.importedUsers.length > 0
  if (conGrupos && conPersonas) return 'mixto'
  if (conGrupos) return 'grupos'
  if (conPersonas) return 'individual'
  return null
}
