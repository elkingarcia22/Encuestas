import { createContext, useContext, useMemo, useState, type ReactElement } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Copy01Icon, Delete02Icon, Edit02Icon, EyeIcon, MoreHorizontalIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Text,
  TooltipProvider,
  type BulkAction,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { pagina } from '@/modules/design-system/templates/admin-compartido/lista'
import { ORIGIN_OPTIONS, SYSTEM_BLOCK_REASON, createdAtValue, formatIsoDay, type DemographicRow } from '../../modelo/demographicRows'
import { DEMOGRAPHIC_TYPES } from '../../modelo/demographics'

// La lista de datos demográficos: los del sistema (fijos, porque alimentan datos que la plataforma
// ya tiene de cada persona) y los que creó el equipo. Gemela de la tabla de encuestas: mismo
// marco, mismos controles de cabecera y misma selección, para que la segunda pestaña no sea otra app.
//
// Es la tabla del sistema (TablaDatos, auditoría 5-oct, decisiones 1 y 2): buscador, orden y filtro en cada columna,
// «Acciones» con los tres puntos y el pie en español de todo el admin. Sin la vista de lista ni el scroll infinito
// del menú «Configurar tabla», que eran de esta tabla sola.

export type AccionDemografico = 'ver' | 'editar' | 'duplicar' | 'eliminar'

const TablaContexto = createContext<(accion: AccionDemografico, fila: DemographicRow) => void>(() => undefined)

// La razón de una acción apagada sale en el globo del producto (Hint), no en el del navegador (decisión 16). El span
// deja abrir la ayuda aunque la opción esté apagada: lo apagado no recibe el cursor.
const conRazon = (apagada: boolean, opcion: ReactElement) =>
  apagada ? (
    <Hint label={SYSTEM_BLOCK_REASON} side="left">
      <span className="block">{opcion}</span>
    </Hint>
  ) : (
    opcion
  )

function MenuDeFila({ fila }: { fila: DemographicRow }) {
  const onAccion = useContext(TablaContexto)
  const delSistema = fila.origin === 'system'
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${fila.name}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onAccion('ver', fila)}>
            <HugeiconsIcon icon={EyeIcon} aria-hidden="true" />
            Ver detalle
          </DropdownMenuItem>
          {conRazon(
            delSistema,
            <DropdownMenuItem disabled={delSistema} onClick={() => onAccion('editar', fila)}>
              <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
              Editar
            </DropdownMenuItem>,
          )}
          <DropdownMenuItem onClick={() => onAccion('duplicar', fila)}>
            <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />
            Duplicar
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {conRazon(
          delSistema,
          <DropdownMenuItem variant="destructive" disabled={delSistema} onClick={() => onAccion('eliminar', fila)}>
            <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
            Eliminar
          </DropdownMenuItem>,
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// El nombre abre su ficha; debajo, en gris, las primeras opciones para reconocerlo sin abrirlo.
function Nombre({ fila }: { fila: DemographicRow }) {
  const onAccion = useContext(TablaContexto)
  const opciones = fila.optionLabels.slice(0, 3).join(', ') + (fila.optionLabels.length > 3 ? '…' : '')
  return <CeldaTitulo titulo={fila.name} detalle={opciones || undefined} onClick={() => onAccion('ver', fila)} />
}

const Origen = ({ fila }: { fila: DemographicRow }) => (
  <Badge variant={fila.origin === 'system' ? 'info-outline' : 'outline'}>{fila.originLabel}</Badge>
)

type Fila = DemographicRow & { creacionOrden: number }
type FiltroId = 'typeLabel' | 'originLabel'
const SIN_FILTROS: Record<FiltroId, string[]> = { typeLabel: [], originLabel: [] }

// Las columnas y los filtros van fuera del componente: si no, el filtro se cierra al marcar.
const COLUMNAS: DataGridListConfig<Fila>['columns'] = [
  { accessorKey: 'name', header: 'Nombre', size: 260, cell: ({ row }) => <Nombre fila={row.original} /> },
  { accessorKey: 'typeLabel', header: 'Tipo', size: 150, cell: ({ row }) => <Text as="span" size="sm" variant="muted">{row.original.typeLabel}</Text> },
  { accessorKey: 'originLabel', header: 'Origen', size: 140, cell: ({ row }) => <Origen fila={row.original} /> },
  {
    accessorKey: 'creacionOrden',
    header: 'Creación',
    size: 130,
    cell: ({ row }) => (
      <Text as="span" size="sm" className="tabular-nums">
        {formatIsoDay(row.original.createdAt)}
      </Text>
    ),
  },
  { accessorKey: 'createdBy', header: 'Creado por', size: 150, cell: ({ row }) => <Text as="span" size="sm">{row.original.createdBy ?? '—'}</Text> },
  {
    accessorKey: 'optionCount',
    header: 'Opciones',
    size: 110,
    cell: ({ row }) => (
      <Text as="span" size="sm" weight="medium" className="tabular-nums">
        {row.original.optionCount}
      </Text>
    ),
  },
  {
    id: 'acciones',
    header: 'Acciones',
    size: 100,
    enableSorting: false,
    enableResizing: false,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <MenuDeFila fila={row.original} />,
  },
]

const FILTROS: DataGridListConfig<Fila>['columnFilters'] = [
  { id: 'typeLabel', label: 'Tipo', type: 'select', multiple: true, options: DEMOGRAPHIC_TYPES.map((tipo) => ({ label: tipo.label, value: tipo.label })) },
  { id: 'originLabel', label: 'Origen', type: 'select', multiple: true, options: ORIGIN_OPTIONS.map((origen) => ({ label: origen, value: origen })) },
]

const icono = (simbolo: IconSvgElement) => <HugeiconsIcon icon={simbolo} aria-hidden="true" />

export function TablaDemograficos({
  filas,
  onAccion,
  onCrear,
  onDuplicarVarias,
  onEliminarVarias,
}: {
  filas: readonly DemographicRow[]
  onAccion: (accion: AccionDemografico, fila: DemographicRow) => void
  onCrear: () => void
  onDuplicarVarias: (filas: DemographicRow[], limpiar: () => void) => void
  onEliminarVarias: (filas: DemographicRow[], limpiar: () => void) => void
}) {
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Record<FiltroId, string[]>>(SIN_FILTROS)
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [marcadas, setMarcadas] = useState<Fila[]>([])
  // Un objeto nuevo suelta la selección de la tabla sin volver a montarla (y sin perder la búsqueda ni los filtros).
  const [sinSeleccion, setSinSeleccion] = useState<Record<string, boolean>>({})
  // Cambia para montar la tabla de nuevo al limpiar: así se vacían también su buscador y sus filtros.
  const [version, setVersion] = useState(0)

  const resultado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const lista: Fila[] = filas
      .filter((fila) => !q || fila.name.toLowerCase().includes(q))
      .filter((fila) => (Object.keys(filtros) as FiltroId[]).every((id) => filtros[id].length === 0 || filtros[id].includes(fila[id])))
      .map((fila) => ({ ...fila, creacionOrden: createdAtValue(fila) }))
    if (!orden) return lista
    const desc = orden.startsWith('-')
    const campo = (desc ? orden.slice(1) : orden) as keyof Fila
    return [...lista].sort((a, b) => {
      const va = a[campo] ?? ''
      const vb = b[campo] ?? ''
      const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')
      return desc ? -r : r
    })
  }, [filas, busqueda, filtros, orden])

  const visibles = useMemo(() => pagina(resultado, actual, porPagina), [resultado, actual, porPagina])
  const filtrosActivos = Object.values(filtros).filter((valores) => valores.length > 0).length
  const filtrando = busqueda.trim() !== '' || filtrosActivos > 0

  const soltarSeleccion = () => setSinSeleccion({})
  const limpiar = () => {
    setBusqueda('')
    setFiltros(SIN_FILTROS)
    setActual(1)
    setVersion((previa) => previa + 1)
  }

  // Con un demográfico marcado salen las mismas acciones que en su menú de tres puntos; con varios, solo las que se pueden
  // hacer a la vez. Los del sistema no se editan ni se eliminan.
  const unaMarcada = marcadas.length === 1 ? marcadas[0] : null
  const eliminables = marcadas.filter((fila) => fila.origin !== 'system')
  const delSistema = unaMarcada?.origin === 'system'
  const accionesSeleccion: BulkAction<Fila>[] = [
    ...(unaMarcada
      ? [
          { id: 'ver', label: 'Ver detalle', icon: icono(EyeIcon), visibility: 'single-only' as const, onClick: () => onAccion('ver', unaMarcada) },
          {
            id: 'editar',
            label: delSistema ? `Editar: ${SYSTEM_BLOCK_REASON.toLowerCase()}` : 'Editar',
            icon: icono(Edit02Icon),
            visibility: 'single-only' as const,
            disabled: delSistema,
            onClick: () => onAccion('editar', unaMarcada),
          },
          { id: 'duplicar', label: 'Duplicar', icon: icono(Copy01Icon), visibility: 'single-only' as const, onClick: () => onAccion('duplicar', unaMarcada) },
          {
            id: 'eliminar',
            label: delSistema ? `Eliminar: ${SYSTEM_BLOCK_REASON.toLowerCase()}` : 'Eliminar',
            icon: icono(Delete02Icon),
            variant: 'destructive' as const,
            visibility: 'single-only' as const,
            disabled: delSistema,
            onClick: () => onAccion('eliminar', unaMarcada),
          },
        ]
      : []),
    { id: 'duplicarVarias', label: 'Duplicar', icon: icono(Copy01Icon), visibility: 'bulk-only', onClick: () => onDuplicarVarias(marcadas, soltarSeleccion) },
    {
      id: 'eliminarVarias',
      label: eliminables.length === 0 ? `Eliminar: ${SYSTEM_BLOCK_REASON.toLowerCase()}` : eliminables.length < marcadas.length ? `Eliminar ${eliminables.length} (los del sistema no se eliminan)` : 'Eliminar',
      icon: icono(Delete02Icon),
      variant: 'destructive',
      visibility: 'bulk-only',
      disabled: eliminables.length === 0,
      onClick: () => onEliminarVarias(eliminables, soltarSeleccion),
    },
  ]

  const config: DataGridListConfig<Fila> = {
    columns: COLUMNAS,
    columnFilters: FILTROS,
    onColumnFiltersChange: (nuevos) => {
      const valores = (id: FiltroId) => {
        const valor = nuevos.find((filtro) => filtro.id === id)?.value
        return Array.isArray(valor) ? valor.map(String) : []
      }
      setFiltros({ typeLabel: valores('typeLabel'), originLabel: valores('originLabel') })
      setActual(1)
    },
    sort: {
      onSortChange: (nuevo) => {
        setOrden(nuevo)
        setActual(1)
      },
    },
    search: {
      placeholder: 'Buscar demográfico',
      onSearch: (q) => {
        setBusqueda(q)
        setActual(1)
      },
    },
    actions: {
      primary: { id: 'crear', label: 'Crear demográfico', icon: <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />, onClick: onCrear },
    },
    selection: { onSelectionChange: setMarcadas },
    bulkActions: accionesSeleccion,
    // Los dos vacíos del sistema (Estados › Estados vacíos), con ilustración (decisión 14).
    emptyState: filtrando
      ? { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={filtrosActivos} onLimpiar={limpiar} /> }
      : {
          type: 'empty',
          customComponent: (
            <PrimeraVez
              icono="glass-add"
              titulo="Todavía no hay datos demográficos"
              descripcion="Crea uno y cualquier encuesta podrá cortar sus resultados por él."
              accion={{ texto: 'Crear demográfico', icono: PlusSignIcon, onClick: onCrear }}
            />
          ),
        },
  }

  return (
    <TablaContexto.Provider value={onAccion}>
      {/* Los globos de las acciones de lo marcado salen a los 200 ms, como los del resto del playground. */}
      <TooltipProvider delay={200}>
        <TablaDatos
          key={version}
          config={config}
          data={visibles}
          initialRowSelection={sinSeleccion}
          paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: resultado.length }}
          nombre="datos demográficos"
          singular="dato demográfico"
          id="demograficos"
        />
      </TooltipProvider>
    </TablaContexto.Provider>
  )
}
