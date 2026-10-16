import { useMemo, useState } from 'react'
import type { DataGridListConfig } from '@ubits/flux-ui'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { SinResultados } from '@/shared/components/SinResultados'
import { plural } from '@/modules/design-system/patrones/formato'
import { FILAS_CLICABLES, marcarAlTocarFila } from './filas'
import { ordenarPor } from './planes-datos'

// La tabla de elegir de «Agregar asignación» y «Gestionar contenidos»: la del design system con casillas, buscador,
// filtros por columna y «Seleccionados (N)» para ver solo lo elegido, como en UBITS (Lista de usuarios, Lista de
// contenidos). Lo elegido vive en quien la usa y no se pierde al cambiar de página, buscar o filtrar.
//
// DataGridList guarda la selección por id y solo avisa de las filas que tiene delante; aquí se junta eso con lo que ya
// estaba elegido en las demás páginas.

export type Filtro = { id: string; value: unknown }

const aMapa = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, true]))

export function TablaSeleccion<T extends { id: string }>({
  id,
  titulo,
  sustantivo,
  femenino = false,
  filas,
  columnas,
  filtros: definicion,
  layout,
  coincide,
  buscar,
  marcados,
  onCambio,
}: {
  id: string
  titulo: string
  // Lo que se elige, en singular y plural: ['usuario', 'usuarios']. Con `femenino`, «competencias elegidas».
  sustantivo: [string, string]
  femenino?: boolean
  filas: T[]
  // Fuera del componente que la usa: si no, el filtro se cierra al marcar (trampa de DataGridList).
  columnas: DataGridListConfig<T>['columns']
  filtros?: DataGridListConfig<T>['columnFilters']
  /** Para apagar lo que una tabla concreta no necesita, como el asidero que reordena columnas. */
  layout?: DataGridListConfig<T>['layout']
  coincide: (fila: T, busqueda: string, filtros: Filtro[]) => boolean
  buscar: string
  marcados: string[]
  onCambio: (marcados: string[]) => void
}) {
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [soloMarcados, setSoloMarcados] = useState(false)
  // Al limpiar se vuelve a montar la tabla (su buscador es suyo); arranca con lo que ya estaba elegido.
  const [version, setVersion] = useState(0)
  const [inicial, setInicial] = useState(() => aMapa(marcados))

  const [singular, plurales] = sustantivo
  const elegido = femenino ? 'elegida' : 'elegido'
  const q = busqueda.trim().toLowerCase()
  const resultado = useMemo(
    () => ordenarPor(filas.filter((f) => (!soloMarcados || marcados.includes(f.id)) && coincide(f, q, filtros)), orden),
    [filas, soloMarcados, marcados, coincide, q, filtros, orden],
  )
  const visibles = useMemo(() => resultado.slice((pagina - 1) * porPagina, pagina * porPagina), [resultado, pagina, porPagina])
  const filtrando = Boolean(q) || filtros.some((f) => Array.isArray(f.value) && f.value.length > 0)

  const limpiar = () => {
    setBusqueda('')
    setFiltros([])
    setPagina(1)
    setSoloMarcados(false)
    setInicial(aMapa(marcados))
    setVersion((v) => v + 1)
  }

  // Lo de esta página según la tabla, más lo elegido en las otras. Si no cambió nada, no se avisa (la tabla llama en
  // cada vuelta).
  const alElegir = (enPagina: T[]) => {
    const aqui = new Set(visibles.map((f) => f.id))
    const elegidos = new Set(enPagina.map((f) => f.id))
    const siguen = marcados.filter((m) => !aqui.has(m) || elegidos.has(m))
    const nuevos = [...elegidos].filter((m) => !marcados.includes(m))
    if (nuevos.length || siguen.length !== marcados.length) onCambio([...siguen, ...nuevos])
  }

  const config: DataGridListConfig<T> = {
    columns: columnas,
    columnFilters: definicion,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setPagina(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: buscar,
      onSearch: (texto) => {
        setBusqueda(texto)
        setPagina(1)
      },
    },
    selection: { onSelectionChange: alElegir },
    actions: {
      secondary: [
        {
          id: 'ver-seleccionados',
          label: soloMarcados ? `Ver todos (${filas.length.toLocaleString('es-CO')})` : `Seleccionados (${marcados.length.toLocaleString('es-CO')})`,
          disabled: !soloMarcados && !marcados.length,
          onClick: () => {
            setSoloMarcados(!soloMarcados)
            setPagina(1)
          },
        },
      ],
    },
    emptyState: soloMarcados
      ? { type: 'empty', title: `Sin ${plurales} ${elegido}s`, description: `Vuelve a la lista completa y marca los que quieras sumar.` }
      : filtrando
        ? {
            type: 'no-results',
            customComponent: (
              <SinResultados busqueda={busqueda} filtrosActivos={filtros.filter((f) => Array.isArray(f.value) && f.value.length > 0).length} onLimpiar={limpiar} />
            ),
          }
        : { type: 'empty', title: `No hay ${plurales} para elegir` },
    frame: { title: titulo, toolbar: 'header' },
    layout,
    labels: {
      resultCount: (_visibles, total) =>
        `${total.toLocaleString('es-CO')} ${plural(total, 'resultado', 'resultados')}${marcados.length ? ` · ${marcados.length.toLocaleString('es-CO')} ${plural(marcados.length, `${singular} ${elegido}`, `${plurales} ${elegido}s`)}` : ''}`,
    },
  }

  return (
    <div onClick={marcarAlTocarFila} className={FILAS_CLICABLES}>
      <TablaDatos
        key={version}
        config={config}
        data={visibles}
        initialRowSelection={inicial}
        paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: resultado.length }}
        nombre={plurales}
        id={id}
      />
    </div>
  )
}
