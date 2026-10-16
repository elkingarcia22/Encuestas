import { useEffect, useState } from 'react'

// DataGridList no busca, filtra, ordena ni pagina por su cuenta: avisa y espera los datos ya
// resueltos. Aquí se resuelve en memoria lo que en producto haría el servidor.

export type Filtro = { id: string; value: unknown }

export function resolver<T extends object>(filas: T[], busqueda: string, campos: (keyof T)[], filtros: Filtro[], orden?: string) {
  const q = busqueda.trim().toLowerCase()
  let resultado = filas.filter((fila) => {
    if (q && !campos.some((campo) => String(fila[campo] ?? '').toLowerCase().includes(q))) return false
    for (const { id, value } of filtros) {
      if (Array.isArray(value) && value.length > 0 && !value.map(String).includes(String(fila[id as keyof T]))) return false
    }
    return true
  })

  if (orden) {
    const desc = orden.startsWith('-')
    const campo = (desc ? orden.slice(1) : orden) as keyof T
    resultado = [...resultado].sort((a, b) => {
      const va = a[campo] ?? ''
      const vb = b[campo] ?? ''
      const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')
      return desc ? -r : r
    })
  }

  return resultado
}

export const pagina = <T,>(filas: T[], actual: number, porPagina: number) => filas.slice((actual - 1) * porPagina, actual * porPagina)

// Los números de página que muestra el paginador, con un « … » donde se saltan: siempre la
// primera, la última y las vecinas a la actual.
export function paginasVisibles(actual: number, total: number): (number | 'salto')[] {
  const paginas: (number | 'salto')[] = []
  for (let pagina = 1; pagina <= total; pagina++) {
    if (pagina === 1 || pagina === total || Math.abs(pagina - actual) <= 1) {
      paginas.push(pagina)
    } else if (paginas.at(-1) !== 'salto') {
      paginas.push('salto')
    }
  }
  return paginas
}

// La primera carga tarda un momento, como en la plataforma: la tabla muestra su esqueleto.
export function useCargaInicial(ms = 700) {
  const [cargando, setCargando] = useState(true)
  useEffect(() => {
    const id = window.setTimeout(() => setCargando(false), ms)
    return () => window.clearTimeout(id)
  }, [ms])
  return [cargando, setCargando] as const
}

// Scroll infinito: arranca mostrando `paso` filas y suma `paso` cada vez que se llama
// `cargarMas` (un botón o un centinela que entra en pantalla). Vuelve a `paso` cuando el
// total cambia, porque eso significa que se aplicó una búsqueda o un filtro nuevo.
export function useCargaProgresiva(total: number, paso = 10) {
  const [visibles, setVisibles] = useState(paso)
  useEffect(() => setVisibles(paso), [total, paso])
  const cargarMas = () => setVisibles((actual) => Math.min(actual + paso, total))
  return [Math.min(visibles, total), cargarMas] as const
}
