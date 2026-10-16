import type { CellReading, ComparativeColumn } from './comparativeHelpers'
import type { ComparativeTreeNode } from './comparativeSectionTree'
import { compareNumbers, compareText, LABEL_SORT_KEY, type ComparativeSort } from './comparativeTableSort'

/**
 * Orden y apertura de las tablas de árbol del comparativo, compartidos por las
 * tres pestañas para que ordenar o desplegar se comporte igual en todas.
 */

type ReadingFor = (node: ComparativeTreeNode, columnId: string) => CellReading

/**
 * Ordena hermanos, nivel por nivel. Una rama nunca sale de su sección: lo que
 * el orden cambia es en qué posición quedan las subsecciones dentro de la
 * suya, igual que el informe ordena preguntas dentro de su sección.
 */
export function sortTree(nodes: readonly ComparativeTreeNode[], sort: ComparativeSort, columns: readonly ComparativeColumn[], readingFor: ReadingFor): ComparativeTreeNode[] {
  const sortLevel = (level: readonly ComparativeTreeNode[]): ComparativeTreeNode[] => {
    const withSortedChildren = level.map((node) => ({ ...node, children: sortLevel(node.children) }))

    if (sort.key === null) return withSortedChildren
    if (sort.key === LABEL_SORT_KEY) {
      return withSortedChildren.sort((a, b) => compareText(a.label, b.label, sort.ascending))
    }
    const column = columns.find((candidate) => candidate.id === sort.key)
    if (!column) return withSortedChildren
    return withSortedChildren.sort((a, b) => compareNumbers(readingFor(a, column.id).value, readingFor(b, column.id).value, sort.ascending))
  }

  return sortLevel(nodes)
}

/**
 * Qué ramas están abiertas. Entra con la primera sección desplegada —para que
 * la tabla no se lea como una lista de títulos cerrados— y se reinicia cuando
 * cambia el árbol, que es cuando cambia el comparativo. La pantalla guarda el
 * conjunto en su estado y lo reinicia con este mismo valor.
 */
export function initialExpansion(nodes: readonly ComparativeTreeNode[]): ReadonlySet<string> {
  const firstKey = nodes[0]?.key
  return firstKey ? new Set([firstKey]) : new Set()
}

/** Abre o cierra una rama, devolviendo un conjunto nuevo sin tocar el anterior. */
export function toggleExpansion(expanded: ReadonlySet<string>, key: string): ReadonlySet<string> {
  const next = new Set(expanded)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next
}
