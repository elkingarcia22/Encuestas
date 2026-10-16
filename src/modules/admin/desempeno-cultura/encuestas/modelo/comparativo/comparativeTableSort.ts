/**
 * El orden de las tablas del comparativo, gobernado desde sus cabeceras.
 *
 * Las tres tablas —dimensiones, preguntas, comentarios— ordenan como la lista
 * de encuestas del home y la de participación del informe: una cabecera por
 * columna, un click ordena por ella y el siguiente invierte la dirección. Antes
 * el orden vivía en un menú "Ordenar por" de la barra, con criterios que no
 * eran ninguna columna en particular ("mayor mejora", "más respuestas"); ahora
 * el lector ordena por la columna que está leyendo, que es donde ya buscaba el
 * control en las otras dos tablas del producto.
 *
 * Con `key: null` la tabla vuelve a su orden propio —mayor variación primero—,
 * que es con el que entra: quien no toca nada sigue viendo lo que más se movió
 * arriba.
 */
export interface ComparativeSort {
  /** `null` = el orden natural de la pestaña, sin columna al mando. */
  key: string | null
  ascending: boolean
}

export const DEFAULT_SORT: ComparativeSort = { key: null, ascending: false }

/** La clave de la primera columna, la que nombra la fila en las tres tablas. */
export const LABEL_SORT_KEY = 'label'

/**
 * Qué orden sigue al click en una cabecera: misma columna invierte, columna
 * nueva arranca por su extremo más útil —A–Z en el texto, mayor primero en los
 * números—, igual que `toggleSort` en la lista de encuestas.
 */
export function nextSort(current: ComparativeSort, key: string, ascendingFirst = false): ComparativeSort {
  if (current.key === key) return { key, ascending: !current.ascending }
  return { key, ascending: ascendingFirst }
}

export function compareText(a: string, b: string, ascending: boolean): number {
  return a.localeCompare(b, 'es') * (ascending ? 1 : -1)
}

/**
 * Compara números dejando siempre al final las celdas sin número —privadas,
 * vacías o no medidas—: una celda sin valor no es un cero, así que no debe
 * colarse ni entre las peores ni entre las mejores al invertir el orden.
 */
export function compareNumbers(a: number | null | undefined, b: number | null | undefined, ascending: boolean): number {
  const aMissing = a === null || a === undefined
  const bMissing = b === null || b === undefined
  if (aMissing || bMissing) {
    if (aMissing && bMissing) return 0
    return aMissing ? 1 : -1
  }
  return (a - b) * (ascending ? 1 : -1)
}
