import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon } from '@hugeicons/core-free-icons'
import { Text, cn, type DataGridListConfig } from '@ubits/flux-ui'
import { FILAS_CLICABLES, marcarAlTocarFila } from '@/modules/admin/aprendizaje/planes-de-formacion/components/filas'
import { Badge } from '@/shared/components/Badge'
import { SinResultados } from '@/shared/components/SinResultados'
import { Persona } from '../../../data-grid/casos/seguimiento'
import { TablaDatos } from '../../../data-grid/tabla-datos'
import styles from '../../components/agent.module.css'
import { PEOPLE, type Person } from './data'

// La lista de evaluaciones vencidas con la tabla única del sistema (auditoría 5-oct, decisión 1): conteo a la
// izquierda, buscador, orden y filtro por columna, y su paginador. Antes era una Table armada a mano.
//
// Lo elegido vive en la pantalla del caso, porque el agente también lo cambia («Seleccionar a los 24»). DataGridList
// guarda la selección por su cuenta y solo avisa de las filas que tiene delante: aquí se junta eso con lo elegido en
// las demás páginas, y cuando la selección cambia desde afuera se le vuelve a pasar (`initialRowSelection`).

// Cada fila sabe si ya se le recordó hoy y en qué envío, para que «Recordado hoy» vuelva a destellar con cada uno.
type Fila = Person & { recordado: boolean; envio: number }

type Filtro = { id: string; value: unknown }

const AREAS = [...new Set(PEOPLE.map((person) => person.area))].sort((a, b) => a.localeCompare(b, 'es'))

// Columnas y filtros fuera del componente: si no, el filtro se cierra al marcar (trampa de DataGridList).
const COLUMNAS: DataGridListConfig<Fila>['columns'] = [
  {
    accessorKey: 'name',
    header: 'Colaborador',
    size: 220,
    cell: ({ row }) => <Persona nombre={row.original.name} detalle={row.original.role} />,
  },
  {
    accessorKey: 'area',
    header: 'Área',
    size: 140,
    cell: ({ row }) => (
      <Text as="span" size="sm">
        {row.original.area}
      </Text>
    ),
  },
  {
    accessorKey: 'days',
    header: 'Retraso',
    size: 100,
    cell: ({ row }) => (
      <Text as="span" size="sm" variant={row.original.days > 14 ? 'destructive' : 'default'} className="tabular-nums">
        {row.original.days} días
      </Text>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Correo',
    size: 220,
    cell: ({ row }) =>
      row.original.email ? (
        <Text as="span" size="sm" variant="muted" className="block truncate">
          {row.original.email}
        </Text>
      ) : (
        <Text as="span" size="sm" variant="destructive" className="inline-flex items-center gap-1.5">
          <HugeiconsIcon icon={AlertCircleIcon} size={14} aria-hidden="true" />
          Sin correo válido
        </Text>
      ),
  },
  {
    accessorKey: 'recordado',
    header: 'Estado',
    size: 130,
    cell: ({ row }) =>
      row.original.recordado ? (
        <Badge key={row.original.envio} variant="secondary" className={cn('font-normal', styles.flash)}>
          Recordado hoy
        </Badge>
      ) : (
        <Text as="span" size="sm" variant="muted">
          Pendiente
        </Text>
      ),
  },
]

const FILTROS: DataGridListConfig<Fila>['columnFilters'] = [
  { id: 'area', label: 'Área', type: 'select', multiple: true, options: AREAS.map((area) => ({ label: area, value: area })) },
]

const aMapa = (ids: Iterable<string>) => Object.fromEntries([...ids].map((id) => [id, true]))

const mismos = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((id) => b.has(id))

type PeopleTableProps = {
  people: Person[]
  selected: Set<string>
  sent: Set<string>
  // Mientras se envía no se puede cambiar la selección.
  locked: boolean
  // Cambia en cada envío para que «Recordado hoy» vuelva a destellar.
  flashKey: number
  onChange: (next: Set<string>) => void
}

export function PeopleTable({ people, selected, sent, locked, flashKey, onChange }: PeopleTableProps) {
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  // Al limpiar se vuelve a montar la tabla (su buscador es suyo); arranca con lo que ya estaba elegido.
  const [version, setVersion] = useState(0)

  const filas = useMemo<Fila[]>(() => people.map((person) => ({ ...person, recordado: sent.has(person.id), envio: flashKey })), [people, sent, flashKey])

  const q = busqueda.trim().toLowerCase()
  const resultado = useMemo(() => {
    const lista = filas.filter(
      (fila) =>
        (!q || `${fila.name} ${fila.role} ${fila.area}`.toLowerCase().includes(q)) &&
        filtros.every(({ id, value }) => !Array.isArray(value) || !value.length || value.map(String).includes(String(fila[id as keyof Fila]))),
    )
    if (!orden) return lista
    const desc = orden.startsWith('-')
    const campo = (desc ? orden.slice(1) : orden) as keyof Fila
    return [...lista].sort((a, b) => {
      const va = a[campo] ?? ''
      const vb = b[campo] ?? ''
      const r = typeof va === 'number' || typeof va === 'boolean' ? Number(va) - Number(vb) : String(va).localeCompare(String(vb), 'es')
      return desc ? -r : r
    })
  }, [filas, q, filtros, orden])
  const visibles = useMemo(() => resultado.slice((pagina - 1) * porPagina, pagina * porPagina), [resultado, pagina, porPagina])
  const filtrosActivos = filtros.filter((filtro) => Array.isArray(filtro.value) && filtro.value.length > 0).length

  // Lo elegido, como lo espera la tabla. Cambia solo cuando cambia la selección (desde la tabla o desde el agente).
  const marcados = useMemo(() => aMapa(selected), [selected])

  // Lo de esta página según la tabla, más lo elegido en las otras. Si no cambió nada no se avisa (la tabla llama en
  // cada vuelta) y mientras se envía no se toca.
  const alElegir = (enPagina: Fila[]) => {
    if (locked) return
    const aqui = new Set(visibles.map((fila) => fila.id))
    const siguiente = new Set([...selected].filter((id) => !aqui.has(id)))
    for (const fila of enPagina) siguiente.add(fila.id)
    if (!mismos(siguiente, selected)) onChange(siguiente)
  }

  const limpiar = () => {
    setBusqueda('')
    setFiltros([])
    setPagina(1)
    setVersion((v) => v + 1)
  }

  const config: DataGridListConfig<Fila> = {
    columns: COLUMNAS,
    columnFilters: FILTROS,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setPagina(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar colaborador o área',
      onSearch: (texto) => {
        setBusqueda(texto)
        setPagina(1)
      },
    },
    selection: { onSelectionChange: alElegir },
    emptyState:
      q || filtrosActivos
        ? { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={filtrosActivos} onLimpiar={limpiar} /> }
        : { type: 'empty', title: 'No hay evaluaciones vencidas' },
  }

  return (
    // Toda la fila marca su casilla, como en UBITS. Mientras se envía la tabla queda quieta: no se puede cambiar a quién le llega.
    <div inert={locked} aria-busy={locked || undefined} onClick={marcarAlTocarFila} className={locked ? undefined : FILAS_CLICABLES}>
      <TablaDatos
        key={version}
        config={config}
        data={visibles}
        initialRowSelection={marcados}
        paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: resultado.length }}
        nombre="personas"
        singular="persona"
        id="evaluaciones-vencidas"
      />
    </div>
  )
}
