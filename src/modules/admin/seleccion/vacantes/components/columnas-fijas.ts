import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

// Columnas fijas de la tabla de vacantes: se quedan quietas cuando la tabla se desplaza de lado.
// Las fijadas al inicio pasan a la izquierda (en su orden original) y las fijadas al final, a la
// derecha. Cada una se pega con `position: sticky` y un desplazamiento igual a la suma de los
// anchos de las fijas que tiene delante, medidos en pantalla. Mismo aspecto que las columnas
// fijas del DataGrid de la librería: fondo propio y una línea de borde en la última fija.

export type LadoFijo = 'start' | 'end'

type ColumnaFijable = { id: string; ladoFijo?: LadoFijo }

type AtributosCelda = {
  'data-pinned'?: LadoFijo
  'data-last-col'?: LadoFijo
  style?: CSSProperties
}

const mismosAnchos = (a: Record<string, number>, b: Record<string, number>) => {
  const claves = Object.keys(b)
  return claves.length === Object.keys(a).length && claves.every((clave) => a[clave] === b[clave])
}

export function useColumnasFijas<T extends ColumnaFijable>(columnas: T[], fijas: Partial<Record<T['id'], boolean>>) {
  const encabezados = useRef(new Map<string, HTMLTableCellElement>())
  const [anchos, setAnchos] = useState<Record<string, number>>({})

  const esFija = (columna: T) => fijas[columna.id as T['id']] === true
  const lado = (columna: T): LadoFijo => columna.ladoFijo ?? 'start'
  const inicio = columnas.filter((columna) => esFija(columna) && lado(columna) === 'start')
  const fin = columnas.filter((columna) => esFija(columna) && lado(columna) === 'end')
  const ordenadas = [...inicio, ...columnas.filter((columna) => !esFija(columna)), ...fin]
  const clave = ordenadas.map((columna) => `${columna.id}${esFija(columna) ? '*' : ''}`).join(',')

  useLayoutEffect(() => {
    const medir = () => {
      const siguientes: Record<string, number> = {}
      encabezados.current.forEach((celda, id) => {
        siguientes[id] = celda.offsetWidth
      })
      setAnchos((actuales) => (mismosAnchos(actuales, siguientes) ? actuales : siguientes))
    }
    medir()
    const observador = new ResizeObserver(medir)
    encabezados.current.forEach((celda) => observador.observe(celda))
    return () => observador.disconnect()
  }, [clave])

  const registrar = useCallback(
    (id: string) => (celda: HTMLTableCellElement | null) => {
      if (celda) encabezados.current.set(id, celda)
      else encabezados.current.delete(id)
    },
    [],
  )

  const sumaAnchos = (lista: T[]) => lista.reduce((total, columna) => total + (anchos[columna.id] ?? 0), 0)

  const atributos = (columna: T): AtributosCelda => {
    if (!esFija(columna)) return {}
    if (lado(columna) === 'start') {
      const indice = inicio.indexOf(columna)
      return {
        'data-pinned': 'start',
        'data-last-col': indice === inicio.length - 1 ? 'start' : undefined,
        style: { left: sumaAnchos(inicio.slice(0, indice)) },
      }
    }
    const indice = fin.indexOf(columna)
    return {
      'data-pinned': 'end',
      'data-last-col': indice === 0 ? 'end' : undefined,
      style: { right: sumaAnchos(fin.slice(indice + 1)) },
    }
  }

  return { ordenadas, atributos, registrar }
}

// Clase de las celdas fijas (encabezado y cuerpo). Llevan el fondo de la tabla para que lo que
// pasa por debajo al desplazarse no se transparente.
export const CLASE_COLUMNA_FIJA =
  'data-pinned:sticky data-pinned:z-10 data-pinned:isolate data-pinned:bg-card [&[data-last-col=start]]:shadow-[inset_-1px_0_0_0_var(--border)] [&[data-last-col=end]]:shadow-[inset_1px_0_0_0_var(--border)]'
