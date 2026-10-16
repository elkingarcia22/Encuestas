import type { Objective, ObjectiveSet } from './cicloBuilderTypes'
import { targetLabel } from './objectiveSets'

/**
 * Lo que el diálogo «Ajustar pesos» necesita de cada asignación, sin saber de grupos ni de personas: su nombre, su
 * cupo y su reparto. Portado de `WeightBalanceDialog.tsx` del prototipo, donde vivía junto al componente.
 */
export interface WeightBalanceGroup {
  setId: string
  label: string
  budget: number
  objectives: readonly Objective[]
}

/** `setId -> objectiveId -> peso`, aplicado de una sola vez. */
export type WeightBalanceResult = Readonly<Record<string, Readonly<Record<string, number>>>>

/** Cómo se llama una asignación dentro del diálogo: «Asignación sin destinatarios», «A y B» o «A y 3 más». */
export function objectiveSetLabel(set: ObjectiveSet): string {
  if (set.targetIds.length === 0) return 'Asignación sin destinatarios'
  const names = set.targetIds.map((id) => targetLabel(set, id))
  return names.length <= 2 ? names.join(' y ') : `${names[0]} y ${names.length - 1} más`
}

export const weightBalanceGroup = (set: ObjectiveSet, budget: number): WeightBalanceGroup => ({
  setId: set.id,
  label: objectiveSetLabel(set),
  budget,
  objectives: set.objectives,
})
