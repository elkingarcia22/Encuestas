import { useEffect, useMemo, useState } from 'react'
import { TOTAL_WEIGHT } from './cicloBuilderTypes'
import { groupLoadsBySources, splitAcrossSources, type ConflictGroup, type LoadSource, type PersonLoad } from './weightConflicts'

/**
 * El reparto del peso entre asignaciones que alcanzan a una misma persona, sin la pantalla que lo muestra. Portado de
 * `useWeightShares` (`WeightConflictView.tsx` del prototipo): vive aparte porque quien enseña las tarjetas no es quien
 * ofrece las acciones —«Repartir por mí» y «Aplicar pesos» van en el pie del panel o del paso—, y los dos tienen que
 * leer el mismo estado.
 */

export interface WeightSharesStatus {
  text: string
  isDone: boolean
}

export interface WeightSharesController {
  groups: readonly ConflictGroup[]
  shareOf: (source: LoadSource) => number
  setShare: (setId: string, value: number) => void
  /** Reparte el ciclo de cada quien entre sus asignaciones, proporcionalmente. */
  autoAdjust: () => void
  canApply: boolean
  status: WeightSharesStatus
  /** Lo tecleado, listo para aplicarse de una sola vez. */
  shareMap: () => ReadonlyMap<string, number>
  isBalanced: (group: ConflictGroup) => boolean
  isResolved: (group: ConflictGroup) => boolean
}

export function useWeightShares(loads: readonly PersonLoad[], active: boolean): WeightSharesController {
  const [shares, setShares] = useState<Record<string, number>>({})

  // Arranca del reparto real cada vez que se entra; `loads` se recalcula en cada render y eso no reinicia lo tecleado.
  useEffect(() => {
    if (!active) return
    const initial: Record<string, number> = {}
    loads.forEach((load) => load.sources.forEach((source) => (initial[source.setId] = source.weight)))
    setShares(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const groups = useMemo(() => groupLoadsBySources(loads), [loads])
  const shareOf = (source: LoadSource) => shares[source.setId] ?? source.weight
  const groupTotal = (group: ConflictGroup) => group.sources.reduce((sum, source) => sum + shareOf(source), 0)

  // Dos problemas distintos que se cuentan por separado: sumar 100 con una asignación en 0 % tampoco sirve.
  const isBalanced = (group: ConflictGroup) => groupTotal(group) === TOTAL_WEIGHT
  const hasEmpty = (group: ConflictGroup) => group.sources.some((source) => shareOf(source) === 0)
  const isResolved = (group: ConflictGroup) => isBalanced(group) && !hasEmpty(group)

  const peopleOff = groups.filter((group) => !isBalanced(group)).reduce((sum, group) => sum + group.people.length, 0)
  const emptyCount = new Set(groups.flatMap((group) => group.sources.filter((source) => shareOf(source) === 0).map((source) => source.setId))).size
  const canApply = groups.length > 0 && groups.every(isResolved)
  const affected = loads.length

  const status: WeightSharesStatus = canApply
    ? { isDone: true, text: affected === 1 ? `Su ciclo cierra en ${TOTAL_WEIGHT} %` : `Los ${affected} ciclos cierran en ${TOTAL_WEIGHT} %` }
    : {
        isDone: false,
        text:
          peopleOff > 0
            ? peopleOff === 1
              ? `A 1 persona no le suma ${TOTAL_WEIGHT} %`
              : `A ${peopleOff} personas no les suma ${TOTAL_WEIGHT} %`
            : emptyCount === 1
              ? 'Una asignación se quedaría en 0 % y no contaría'
              : `${emptyCount} asignaciones se quedarían en 0 % y no contarían`,
      }

  // La propuesta se arma en limpio y después se mezcla: si una asignación toca a varias personas, gana la más estricta.
  const autoAdjust = () => {
    const proposal = new Map<string, number>()
    loads.forEach((load) =>
      splitAcrossSources(load.sources).forEach((share, setId) => {
        const previous = proposal.get(setId)
        proposal.set(setId, previous === undefined ? share : Math.min(previous, share))
      }),
    )
    setShares((current) => ({ ...current, ...Object.fromEntries(proposal) }))
  }

  return {
    groups,
    shareOf,
    setShare: (setId, value) => setShares((current) => ({ ...current, [setId]: value })),
    autoAdjust,
    canApply,
    status,
    shareMap: () => new Map(Object.entries(shares)),
    isBalanced,
    isResolved,
  }
}
