import { useMemo, useState } from 'react'
import type { AmbitionLevel } from './aiObjectiveGenerator'
import { distributeWeights, type MeasureType, type Objective } from './cicloBuilderTypes'
import { useObjectiveBankLibrary } from './objectiveBankLibrary'
import { bankItemToObjective, type ObjectiveBankArea, type ObjectiveBankItem, type ObjectiveBankTheme, type ObjectiveScope } from './objectiveBankTypes'

/**
 * Recorrer el banco de objetivos: el estado de los filtros, la búsqueda y lo marcado.
 *
 * Es el `useObjectiveBank` de `ObjectiveBankPanel.tsx` del prototipo, sacado del componente para que lo usen igual el
 * drawer del banco y el panel incrustado en el drawer de asignación. Dos cambios frente al original:
 *
 * - El tema deja de ser un filtro obligatorio: la lista se agrupa por tema (acordeón, como el banco de preguntas de
 *   encuestas), así que el tema es «todos» por defecto y elegir uno solo lo deja a él.
 * - Al convertir lo marcado en objetivos, el peso libre se reparte con `distributeWeights` (34/33/33), no con un
 *   piso que perdía puntos por redondeo.
 *
 * El reinicio al abrir lo hace quien monta el hook (con una `key` por apertura), no un efecto.
 */

export const ANY = 'todos'

export interface BankGroup {
  area: ObjectiveBankArea
  theme: ObjectiveBankTheme
  items: readonly ObjectiveBankItem[]
}

export function useObjectiveBank(scope: ObjectiveScope) {
  const areas = useObjectiveBankLibrary()
  const [areaId, setAreaIdState] = useState(areas[0]?.id ?? '')
  const [themeId, setThemeId] = useState<string>(ANY)
  const [measure, setMeasure] = useState<MeasureType | typeof ANY>(ANY)
  const [ambition, setAmbition] = useState<AmbitionLevel>('conservador')
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())
  const [isShowingSelection, setIsShowingSelection] = useState(false)

  const area = areas.find((entry) => entry.id === areaId) ?? areas[0]
  // Solo los temas que tienen algo para este alcance: un tema sin objetivos de empresa no se ofrece en el paso empresa.
  const themes = useMemo(() => (area?.themes ?? []).filter((theme) => theme.items.some((entry) => entry.scope === scope)), [area, scope])

  const setAreaId = (id: string) => {
    setAreaIdState(id)
    setThemeId(ANY)
  }

  const term = query.trim().toLowerCase()
  const isSearching = term !== ''

  // Buscando, se busca en todo el banco del alcance (todas las áreas); si no, en el área y el tema elegidos.
  const groups = useMemo<readonly BankGroup[]>(() => {
    const pool = isSearching ? areas : area ? [area] : []
    return pool.flatMap((entry) =>
      entry.themes
        .filter((theme) => isSearching || themeId === ANY || theme.id === themeId)
        .map((theme) => ({
          area: entry,
          theme,
          items: theme.items.filter(
            (item) =>
              item.scope === scope &&
              (measure === ANY || item.measure === measure) &&
              (!isSearching || `${item.title} ${item.description} ${theme.name}`.toLowerCase().includes(term)),
          ),
        }))
        .filter((group) => group.items.length > 0),
    )
  }, [areas, area, themeId, measure, scope, term, isSearching])

  const visible = useMemo(() => groups.flatMap((group) => group.items), [groups])

  const locationById = useMemo(() => {
    const map = new Map<string, string>()
    areas.forEach((entry) => entry.themes.forEach((theme) => theme.items.forEach((item) => map.set(item.id, `${entry.name} · ${theme.name}`))))
    return map
  }, [areas])

  const selectedEntries = useMemo(
    () => areas.flatMap((entry) => entry.themes.flatMap((theme) => theme.items)).filter((item) => selectedIds.has(item.id)),
    [areas, selectedIds],
  )

  const total = useMemo(
    () => areas.reduce((sum, entry) => sum + entry.themes.reduce((themeSum, theme) => themeSum + theme.items.filter((item) => item.scope === scope).length, 0), 0),
    [areas, scope],
  )

  const toggle = (id: string) =>
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const setMany = (items: readonly ObjectiveBankItem[], select: boolean) =>
    setSelectedIds((current) => {
      const next = new Set(current)
      items.forEach((item) => (select ? next.add(item.id) : next.delete(item.id)))
      return next
    })

  const clearSelection = () => {
    setSelectedIds(new Set())
    setIsShowingSelection(false)
  }

  /** Lo marcado, como objetivos reales, con el peso libre repartido entre ellos (0 en los de empresa). */
  const buildObjectives = (availableWeight: number): Objective[] => {
    const shares = distributeWeights(selectedEntries.length, Math.max(0, availableWeight))
    return selectedEntries.map((entry, index) => bankItemToObjective(entry, ambition, shares[index] ?? 0))
  }

  return {
    scope,
    areas,
    area,
    areaId: area?.id ?? '',
    setAreaId,
    themes,
    themeId,
    setThemeId,
    measure,
    setMeasure,
    ambition,
    setAmbition,
    query,
    setQuery,
    isSearching,
    groups,
    visible,
    locationById,
    selectedIds,
    selectedEntries,
    selectedCount: selectedIds.size,
    toggle,
    setMany,
    clearSelection,
    isShowingSelection,
    setIsShowingSelection,
    total,
    buildObjectives,
  }
}

export type ObjectiveBankController = ReturnType<typeof useObjectiveBank>
