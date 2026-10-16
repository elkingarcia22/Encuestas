import { useMemo, useState } from 'react'
import { Text, TooltipProvider, type BulkAction, type DataGridListConfig } from '@ubits/flux-ui'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import type { ObjectiveSetKind } from '../../../modelo/constructor/cicloBuilderTypes'
import type { AssignmentRow } from '../../../modelo/constructor/assignmentRows'
import { EstadoAgrupacion, MedidorPeso, OrigenAgrupacion } from './piezas-asignacion'

// La lista de corrido: todos los grupos (o todas las personas) en una tabla, con el mismo armado que la lista de ciclos
// del home: la tabla del sistema (TablaDatos), con el paginador en español, el recuento en la cabecera y las
// acciones de la selección junto al buscador. La agrupación de la que viene cada fila es una columna más, porque sigue
// siendo lo que decide a quién le cambia el objetivo una edición. La selección es la misma que la de la vista de
// agrupaciones (vive en el paso): la tabla la recibe y la devuelve, y lo marcado en otras páginas se conserva.

const sinTildes = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function columnasDe(tipo: ObjectiveSetKind, conErrores: boolean): DataGridListConfig<AssignmentRow>['columns'] {
  const grupal = tipo === 'grupal'
  return [
    {
      id: 'destinatario',
      accessorFn: (fila: AssignmentRow) => fila.label,
      header: grupal ? 'Grupo' : 'Persona',
      size: 240,
      cell: ({ row }) => <CeldaTitulo titulo={row.original.label} detalle={row.original.hint} />,
    },
    { id: 'agrupacion', header: 'Agrupación', size: 200, enableSorting: false, cell: ({ row }) => <OrigenAgrupacion resumen={row.original.summary} /> },
    {
      id: 'objetivos',
      accessorFn: (fila: AssignmentRow) => fila.summary.set.objectives.length,
      header: 'Objetivos',
      size: 110,
      cell: ({ row }) => (
        <Text as="span" size="sm" className="tabular-nums">
          {row.original.summary.set.objectives.length}
        </Text>
      ),
    },
    {
      id: 'peso',
      accessorFn: (fila: AssignmentRow) => fila.summary.weight,
      header: 'Peso repartido',
      size: 180,
      cell: ({ row }) => <MedidorPeso peso={row.original.summary.weight} cupo={row.original.summary.budget} conErrores={conErrores} />,
    },
    { id: 'estado', header: 'Estado', size: 190, enableSorting: false, cell: ({ row }) => <EstadoAgrupacion problema={row.original.summary.issue} conErrores={conErrores} /> },
  ]
}

const VALOR: Record<string, (fila: AssignmentRow) => string | number> = {
  destinatario: (fila) => fila.label,
  objetivos: (fila) => fila.summary.set.objectives.length,
  peso: (fila) => fila.summary.weight,
}

export function VistaLista({
  tipo,
  filas,
  conErrores,
  marcadas,
  onMarcadas,
  acciones,
}: {
  tipo: ObjectiveSetKind
  filas: readonly AssignmentRow[]
  conErrores: boolean
  marcadas: ReadonlySet<string>
  onMarcadas: (marcadas: ReadonlySet<string>) => void
  /** Las acciones sobre lo marcado, ya decididas por el paso según la selección. */
  acciones: BulkAction<AssignmentRow>[]
}) {
  const grupal = tipo === 'grupal'
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  // Cambia para montar la tabla de nuevo con el buscador vacío al limpiar desde «Sin resultados».
  const [versionTabla, setVersionTabla] = useState(0)
  const limpiar = () => {
    setBusqueda('')
    setActual(1)
    setVersionTabla((version) => version + 1)
  }

  const resultado = useMemo(() => {
    const terminos = sinTildes(busqueda).split(/\s+/).filter(Boolean)
    const encontradas = filas.filter((fila) => terminos.every((termino) => sinTildes(`${fila.label} ${fila.hint} Agrupación ${fila.summary.position}`).includes(termino)))
    if (!orden) return encontradas
    const desc = orden.startsWith('-')
    const valor = VALOR[desc ? orden.slice(1) : orden]
    if (!valor) return encontradas
    return [...encontradas].sort((a, b) => {
      const va = valor(a)
      const vb = valor(b)
      const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')
      return desc ? -r : r
    })
  }, [filas, busqueda, orden])
  const pagina = useMemo(() => resultado.slice((actual - 1) * porPagina, actual * porPagina), [resultado, actual, porPagina])

  // La tabla solo reporta lo marcado de la página que tiene: lo de las demás páginas se conserva tal cual.
  const seleccionInicial = useMemo(() => Object.fromEntries([...marcadas].map((id) => [id, true])), [marcadas])
  const columnas = useMemo(() => columnasDe(tipo, conErrores), [tipo, conErrores])

  const config: DataGridListConfig<AssignmentRow> = {
    // El marco y el recuento («8 grupos») los pone TablaDatos; sin título dentro del marco.
    columns: columnas,
    sort: {
      onSortChange: (nuevo) => {
        setOrden(nuevo)
        setActual(1)
      },
    },
    search: {
      placeholder: grupal ? 'Buscar grupos...' : 'Buscar personas...',
      onSearch: (texto) => {
        setBusqueda(texto)
        setActual(1)
      },
    },
    selection: {
      hideToggleSelectedView: true,
      totalSelectedCount: marcadas.size,
      onSelectionChange: (elegidas) => {
        const enPagina = new Set(pagina.map((fila) => fila.id))
        const siguiente = new Set([...marcadas].filter((id) => !enPagina.has(id)))
        elegidas.forEach((fila) => siguiente.add(fila.id))
        const igual = siguiente.size === marcadas.size && [...siguiente].every((id) => marcadas.has(id))
        if (!igual) onMarcadas(siguiente)
      },
    },
    bulkActions: acciones,
    labels: { dragToReorder: 'Arrastrar para reordenar la columna' },
    emptyState: busqueda.trim()
      ? { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} onLimpiar={limpiar} /> }
      : {
          type: 'empty',
          customComponent: (
            <PrimeraVez
              icono="glass-profile"
              titulo={grupal ? 'Todavía no hay grupos asignados' : 'Todavía no hay personas asignadas'}
              descripcion="Elige los destinatarios de una asignación y aparecerán aquí."
            />
          ),
        },
    layout: { reorderable: false, resizable: false },
  }

  return (
    <TooltipProvider delay={200}>
      <TablaDatos
        key={versionTabla}
        config={config}
        data={pagina}
        initialRowSelection={seleccionInicial}
        paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: resultado.length }}
        nombre={grupal ? 'grupos' : 'personas'}
        singular={grupal ? 'grupo' : 'persona'}
        id={`asignaciones-${tipo}`}
      />
    </TooltipProvider>
  )
}
