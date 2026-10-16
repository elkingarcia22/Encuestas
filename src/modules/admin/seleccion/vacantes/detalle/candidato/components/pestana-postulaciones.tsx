import { useMemo, useState } from 'react'
import { Badge, FramePanel, Text, type DataGridListConfig } from '@ubits/flux-ui'
import { FilaCifras } from '@/modules/admin/inicio/components/bloques'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { fechaCorta } from '@/modules/design-system/patrones/formato'
import { pagina, resolver, type Filtro } from '@/modules/design-system/templates/admin-compartido/lista'
import type { Candidato, Vacante } from '../../components/data'
import { postulacionesDe, type EstadoPostulacion, type Postulacion } from './expediente-data'
import { Marco } from './piezas'

const BADGE_ESTADO: Record<EstadoPostulacion, 'secondary' | 'destructive-outline' | 'outline' | 'success-outline'> = {
  'En proceso': 'secondary',
  Descartado: 'destructive-outline',
  'Retiró su postulación': 'outline',
  Contratado: 'success-outline',
}

// La tabla del sistema (decisión 1 de la auditoría): TablaDatos con buscador, orden y filtro por columna. Columnas y
// filtros van fuera del componente: si no, el filtro se cierra al marcar.
const COLUMNAS: DataGridListConfig<Postulacion>['columns'] = [
  {
    accessorKey: 'vacante',
    header: 'Vacante',
    size: 260,
    cell: ({ row }) => (
      <span className="inline-flex min-w-0 items-center gap-2">
        <Text as="span" size="sm" className="truncate">
          {row.original.vacante}
        </Text>
        {row.original.actual ? (
          <Badge variant="outline">
            Esta vacante
          </Badge>
        ) : null}
      </span>
    ),
  },
  {
    accessorKey: 'fecha',
    header: 'Se postuló',
    size: 130,
    cell: ({ row }) => (
      <Text as="span" size="sm" className="tabular-nums">
        {fechaCorta(row.original.fecha)}
      </Text>
    ),
  },
  {
    accessorKey: 'etapa',
    header: 'Etapa a la que llegó',
    size: 180,
    cell: ({ row }) => (
      <Text as="span" size="sm">
        {row.original.etapa}
      </Text>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    size: 180,
    cell: ({ row }) => (
      <Badge variant={BADGE_ESTADO[row.original.estado]}>
        {row.original.estado}
      </Badge>
    ),
  },
  {
    accessorKey: 'motivo',
    header: 'Motivo',
    size: 240,
    enableSorting: false,
    cell: ({ row }) =>
      row.original.motivo ? (
        <Text as="span" size="sm" className="truncate">
          {row.original.motivo}
        </Text>
      ) : (
        <Text as="span" variant="muted" size="sm">
          —
        </Text>
      ),
  },
]

const FILTROS: DataGridListConfig<Postulacion>['columnFilters'] = [
  {
    id: 'estado',
    label: 'Estado',
    type: 'select',
    multiple: true,
    options: (['En proceso', 'Descartado', 'Retiró su postulación', 'Contratado'] as EstadoPostulacion[]).map((e) => ({ label: e, value: e })),
  },
]

// Punto 2 · Historial de vacantes: todas las veces que la persona se postuló a la empresa.
export function PestanaPostulaciones({ candidato, vacante, etapaActual }: { candidato: Candidato; vacante: Vacante; etapaActual: string }) {
  const postulaciones = useMemo(() => postulacionesDe(candidato, vacante, etapaActual), [candidato, vacante, etapaActual])
  const activas = postulaciones.filter((p) => p.estado === 'En proceso').length
  const rechazos = postulaciones.filter((p) => p.estado === 'Descartado').length

  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const resultado = useMemo(
    () => resolver(postulaciones, busqueda, ['vacante', 'etapa', 'motivo'], filtros, orden),
    [postulaciones, busqueda, filtros, orden],
  )
  const visibles = useMemo(() => pagina(resultado, actual, porPagina), [resultado, actual, porPagina])

  const config: DataGridListConfig<Postulacion> = {
    columns: COLUMNAS,
    columnFilters: FILTROS,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setActual(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar vacante, etapa o motivo',
      onSearch: (q) => {
        setBusqueda(q)
        setActual(1)
      },
    },
    emptyState: {
      type: 'no-results',
      title: 'No se encontraron postulaciones',
      description: 'Prueba con otro nombre de vacante o quita el filtro de estado.',
      action: {
        id: 'limpiar',
        label: 'Limpiar filtros',
        variant: 'outline',
        onClick: () => {
          setBusqueda('')
          setFiltros([])
        },
      },
    },
  }

  return (
    <>
      <Marco titulo="Historial de postulaciones" descripcion="Todas las vacantes de la empresa a las que se ha postulado.">
        <FramePanel>
          <FilaCifras
            columnas="grid-cols-3"
            cifras={[
              { etiqueta: 'Procesos activos', valor: String(activas), detalle: activas > 1 ? 'también está en otra vacante' : 'solo esta vacante' },
              { etiqueta: 'Participaciones', valor: String(postulaciones.length), detalle: 'desde su primera postulación' },
              { etiqueta: 'Descartes', valor: String(rechazos), detalle: rechazos ? 'en procesos anteriores' : 'ninguno hasta hoy' },
            ]}
          />
        </FramePanel>
      </Marco>
      {/* La lista es corta: con `pieSoloSiHaceFalta` el pie de páginas solo sale si no cabe en una página. */}
      <TablaDatos
        config={config}
        data={visibles}
        paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: resultado.length }}
        nombre="postulaciones"
        singular="postulación"
        id="postulaciones"
        pieSoloSiHaceFalta
      />
    </>
  )
}
