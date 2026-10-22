import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Calendar03Icon, ChartColumnIcon, CheckmarkCircle02Icon, Copy01Icon, Delete02Icon, Settings02Icon, Download01Icon, Edit02Icon, MoreHorizontalIcon, Share08Icon, UserAdd01Icon, UserGroupIcon, UserMultiple02Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Progress,
  Text,
  TooltipProvider,
  type BulkAction,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { dateValue, parseSurveyDate, startOfToday } from '../../encuestas/modelo/surveyListDates'
import { FiltroRangoCierre } from '../../encuestas/components/filtro-rango-cierre'

// Una fecha del calendario del filtro → «aaaa-mm-dd» (hora local); sin fecha, extremo abierto.
const aIso = (fecha: Date | undefined) =>
  fecha ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}` : ''
import { CeldaFecha, type ModoFecha, type TextosFecha } from '../../encuestas/components/celda-fecha'
import { formatoAvance, type Ciclo, type EstadoCiclo } from '../modelo/ciclos'
import { SIN_FILTROS, TRAMOS_AVANCE, cumpleFiltros, type FiltrosCiclos } from '../modelo/filtros'

// La lista de ciclos, con el mismo armado que la de Encuestas: la tabla del sistema (TablaDatos), que pone el marco, el
// recuento y el paginador en español; las acciones de la selección junto al buscador y un menú de tres puntos por fila
// con solo lo que su estado permite y «Eliminar» al final, en rojo. Sin título dentro del marco: lo da la pestaña.

export type AccionCiclo = 'ver' | 'editar' | 'editarFechas' | 'editarParticipantes' | 'objetivosGrupos' | 'objetivosColaborador' | 'configurar' | 'duplicar' | 'compartir' | 'finalizar' | 'eliminar'

const ACCIONES: Record<AccionCiclo, { etiqueta: string; icono: IconSvgElement }> = {
  ver: { etiqueta: 'Ver resultados', icono: ChartColumnIcon },
  editar: { etiqueta: 'Editar ciclo', icono: Edit02Icon },
  configurar: { etiqueta: 'Configurar ciclo', icono: Settings02Icon },
  editarFechas: { etiqueta: 'Editar fechas', icono: Calendar03Icon },
  editarParticipantes: { etiqueta: 'Editar participantes', icono: UserMultiple02Icon },
  objetivosGrupos: { etiqueta: 'Agregar objetivos a grupos', icono: UserGroupIcon },
  objetivosColaborador: { etiqueta: 'Agregar objetivos a un colaborador', icono: UserAdd01Icon },
  duplicar: { etiqueta: 'Duplicar', icono: Copy01Icon },
  compartir: { etiqueta: 'Compartir', icono: Share08Icon },
  finalizar: { etiqueta: 'Finalizar ciclo', icono: CheckmarkCircle02Icon },
  eliminar: { etiqueta: 'Eliminar', icono: Delete02Icon },
}

// Mismos tonos que los estados de Encuestas: en curso en azul, por iniciar en ámbar, finalizado en verde.
const VARIANTE_ESTADO: Record<EstadoCiclo, 'info-light' | 'warning-light' | 'success-light' | 'outline'> = {
  'En curso': 'info-light',
  'Por iniciar': 'warning-light',
  Finalizado: 'success-light',
  Borrador: 'outline',
}

const ESTADOS: readonly EstadoCiclo[] = ['En curso', 'Por iniciar', 'Finalizado', 'Borrador']
const PERIODOS = ['Mes', 'Bimestre', 'Trimestre', 'Semestre', 'Año', 'Personalizado']

/** Las acciones de cada estado, en grupos, como en el prototipo (`CICLO_ACTIONS_BY_ESTADO`); «Eliminar» va siempre aparte,
 *  al final. Un ciclo que no ha empezado todavía no tiene resultados que ver; uno finalizado ya no tiene nada que editar. */
function accionesDe(estado: EstadoCiclo): AccionCiclo[][] {
  // «Configurar ciclo» (estados de objetivos y niveles, 21-oct) va con las de cambiar el ciclo, en todos los estados.
  if (estado === 'Borrador') return [['editar', 'configurar'], ['objetivosGrupos', 'objetivosColaborador'], ['duplicar']]
  if (estado === 'Por iniciar') return [['editar', 'configurar', 'editarFechas', 'editarParticipantes'], ['objetivosGrupos', 'objetivosColaborador'], ['duplicar', 'compartir']]
  if (estado === 'En curso') return [['ver'], ['editar', 'configurar', 'editarFechas', 'editarParticipantes'], ['objetivosGrupos', 'objetivosColaborador'], ['duplicar', 'compartir', 'finalizar']]
  return [['ver'], ['configurar'], ['duplicar']]
}

/** Los textos del selector de fecha, en lo que significa para un ciclo. */
const TEXTOS_FECHA: TextosFecha = {
  inicio: { titulo: 'Nueva fecha de inicio', detalle: 'El ciclo empezará a recibir avances ese día.', accion: 'Guardar' },
  cierre: { titulo: 'Nueva fecha de cierre', detalle: 'El ciclo deja de recibir avances ese día.', accion: 'Guardar' },
  reabrir: { titulo: 'Reabrir hasta', detalle: 'El ciclo vuelve a estar en curso hasta ese día.', accion: 'Aplicar nueva fecha' },
}

// La fecha mínima de cada edición: el cierre no queda antes del inicio ni en el pasado; el inicio, no antes de hoy.
function minimoDe(ciclo: Ciclo, modo: ModoFecha): Date {
  const hoy = startOfToday()
  if (modo === 'inicio') return hoy
  const inicio = parseSurveyDate(ciclo.inicio)
  return inicio && inicio > hoy ? inicio : hoy
}

/** Qué fecha de qué fila se está editando. */
export type EdicionFecha = { id: string; modo: ModoFecha }

const icono = (accion: AccionCiclo) => <HugeiconsIcon icon={ACCIONES[accion].icono} aria-hidden="true" />

function MenuDeFila({ ciclo, onAccion }: { ciclo: Ciclo; onAccion: (accion: AccionCiclo, ciclo: Ciclo) => void }) {
  const grupos = accionesDe(ciclo.estado)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${ciclo.nombre}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {grupos.map((grupo, indice) => (
          <Fragment key={grupo.join('-')}>
            {indice > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuGroup>
              {grupo.map((accion) => (
                <DropdownMenuItem key={accion} onClick={() => onAccion(accion, ciclo)}>
                  {icono(accion)}
                  {ACCIONES[accion].etiqueta}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </Fragment>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onAccion('eliminar', ciclo)}>
          {icono('eliminar')}
          {ACCIONES.eliminar.etiqueta}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const CAMPOS_FILTRO = ['periodo', 'estado', 'avance'] as const

export function TablaCiclos({
  ciclos,
  filtros,
  onFiltros,
  onAccion,
  onDuplicarVarios,
  onExportarVarios,
  onEliminarVarios,
  aviso,
  edicion,
  onEditarFecha,
  onGuardarFecha,
}: {
  ciclos: readonly Ciclo[]
  filtros: FiltrosCiclos
  onFiltros: (filtros: FiltrosCiclos) => void
  onAccion: (accion: AccionCiclo, ciclo: Ciclo) => void
  onDuplicarVarios: (ids: string[]) => void
  onExportarVarios: (ids: string[]) => void
  onEliminarVarios: (ids: string[], limpiar: () => void) => void
  /** Una línea encima de la tabla: por ejemplo, que se está viendo solo lo que pide atención. */
  aviso?: ReactNode
  /** «Editar fechas»: la fecha de la fila se edita en su propia celda, con su calendario, como en Encuestas. */
  edicion: EdicionFecha | null
  onEditarFecha: (edicion: EdicionFecha | null) => void
  onGuardarFecha: (id: string, modo: ModoFecha, fecha: Date) => void
}) {
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [seleccionados, setSeleccionados] = useState<Ciclo[]>([])
  // Cambia para montar la tabla de nuevo y soltar la selección después de una acción masiva.
  const [versionTabla, setVersionTabla] = useState(0)
  const soltarSeleccion = () => setVersionTabla((version) => version + 1)

  const resultado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const filas = ciclos.filter((ciclo) => cumpleFiltros(ciclo, filtros)).filter((ciclo) => !q || `${ciclo.nombre} ${ciclo.periodo}`.toLowerCase().includes(q))
    if (!orden) return filas
    const desc = orden.startsWith('-')
    const campo = (desc ? orden.slice(1) : orden) as keyof Ciclo
    const valorDe = (ciclo: Ciclo) => (campo === 'inicio' || campo === 'cierre' ? dateValue(ciclo[campo]) : ciclo[campo])
    return [...filas].sort((a, b) => {
      const va = valorDe(a)
      const vb = valorDe(b)
      const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''), 'es')
      return desc ? -r : r
    })
  }, [ciclos, filtros, busqueda, orden])

  const paginaActual = useMemo(() => resultado.slice((actual - 1) * porPagina, actual * porPagina), [resultado, actual, porPagina])

  // Con un ciclo marcado salen las mismas acciones que en su menú; con varios, solo las que se pueden hacer a la vez.
  const unoMarcado = seleccionados.length === 1 ? seleccionados[0] : null
  const accionesSeleccion: BulkAction<Ciclo>[] = [
    ...(unoMarcado ? accionesDe(unoMarcado.estado).flat() : []).map(
      (accion): BulkAction<Ciclo> => ({ id: accion, label: ACCIONES[accion].etiqueta, icon: icono(accion), visibility: 'single-only', onClick: ([ciclo]) => onAccion(accion, ciclo) }),
    ),
    {
      id: 'duplicarVarios',
      label: 'Duplicar',
      icon: icono('duplicar'),
      visibility: 'bulk-only',
      onClick: (filas) => {
        onDuplicarVarios(filas.map((fila) => fila.id))
        soltarSeleccion()
      },
    },
    { id: 'exportarVarios', label: 'Exportar', icon: <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />, visibility: 'bulk-only', onClick: (filas) => onExportarVarios(filas.map((fila) => fila.id)) },
    {
      id: 'eliminarSeleccion',
      label: seleccionados.length > 1 ? 'Eliminar ciclos' : ACCIONES.eliminar.etiqueta,
      icon: icono('eliminar'),
      variant: 'destructive',
      visibility: 'always',
      onClick: (filas) => (filas.length === 1 ? onAccion('eliminar', filas[0]) : onEliminarVarios(filas.map((fila) => fila.id), soltarSeleccion)),
    },
  ]

  // Cuántos filtros hay puestos (el atajo «Para atender» cuenta como uno), para el vacío «Sin resultados».
  const filtrosActivos = [filtros.periodo, filtros.estado, filtros.avance, filtros.cierre].filter((valores) => valores.length > 0).length + (filtros.soloIds !== null ? 1 : 0)
  const conFiltros = busqueda.trim() !== '' || filtrosActivos > 0
  const limpiar = () => {
    setBusqueda('')
    onFiltros(SIN_FILTROS)
    setActual(1)
    // Montarla de nuevo vacía también su buscador y sus filtros por columna.
    soltarSeleccion()
  }

  // Inicio y cierre se editan en su celda solo mientras el ciclo puede cambiar de fechas (por iniciar o en curso).
  const celdaFecha = (ciclo: Ciclo, campo: 'inicio' | 'cierre') => {
    const modo = edicion?.id === ciclo.id && edicion.modo === campo ? campo : null
    const editable = ciclo.estado === 'En curso' || ciclo.estado === 'Por iniciar'
    if (!editable && modo === null) {
      return (
        <Text as="span" size="sm" weight="medium" className="tabular-nums">
          {ciclo[campo]}
        </Text>
      )
    }
    return (
      <CeldaFecha
        key={modo ?? 'cerrada'}
        valor={ciclo[campo]}
        modo={modo}
        textos={TEXTOS_FECHA}
        minimo={minimoDe(ciclo, campo)}
        bloqueada={edicion !== null && edicion.id !== ciclo.id}
        onEmpezar={() => onEditarFecha({ id: ciclo.id, modo: campo })}
        onGuardar={(fecha) => onGuardarFecha(ciclo.id, campo, fecha)}
        onCancelar={() => onEditarFecha(null)}
      />
    )
  }

  const config: DataGridListConfig<Ciclo> = {
    // El marco, el recuento («12 ciclos») y las acciones de la selección junto al buscador los pone TablaDatos.
    columns: [
      {
        accessorKey: 'nombre',
        header: 'Nombre',
        size: 270,
        // `w-0 min-w-full`: el nombre se encoge con «…» en vez de ensanchar la columna, y la tabla cabe en el marco.
        cell: ({ row }) => (
          <div className="w-0 min-w-full">
            <CeldaTitulo titulo={row.original.nombre} onClick={() => onAccion(row.original.estado === 'Borrador' || row.original.estado === 'Por iniciar' ? 'editar' : 'ver', row.original)} />
          </div>
        ),
      },
      { accessorKey: 'periodo', header: 'Periodo', size: 130, cell: ({ row }) => <Text as="span" size="sm" variant="muted">{row.original.periodo}</Text> },
      { accessorKey: 'estado', header: 'Estado', size: 130, cell: ({ row }) => <Badge variant={VARIANTE_ESTADO[row.original.estado]}>{row.original.estado}</Badge> },
      { accessorKey: 'inicio', header: 'Inicio', size: 125, cell: ({ row }) => celdaFecha(row.original, 'inicio') },
      { accessorKey: 'cierre', header: 'Cierre', size: 125, cell: ({ row }) => celdaFecha(row.original, 'cierre') },
      {
        accessorKey: 'avance',
        header: 'Avance',
        size: 150,
        // La barra llega hasta el 100%; la cifra dice cuánto se pasó de la meta. Sin columna de «# objetivos»: con ella la tabla
        // no cabe en el ancho de la página, y cuántos objetivos tiene el ciclo se ve al abrirlo.
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Progress value={Math.min(100, row.original.avance)} className="w-20" aria-label={`Avance ${formatoAvance(row.original.avance)}`} />
            <Text as="span" size="xs" variant="muted" className="w-10 text-right tabular-nums">
              {formatoAvance(row.original.avance)}
            </Text>
          </div>
        ),
      },
      { id: 'acciones', header: 'Acciones', size: 100, enableSorting: false, enableResizing: false, ...SIN_ARRASTRE, cell: ({ row }) => <MenuDeFila ciclo={row.original} onAccion={onAccion} /> },
    ],
    columnFilters: [
      { id: 'periodo', label: 'Periodo', type: 'select', options: PERIODOS.map((valor) => ({ label: valor, value: valor })), multiple: true },
      { id: 'estado', label: 'Estado', type: 'select', options: ESTADOS.map((valor) => ({ label: valor, value: valor })), multiple: true },
      { id: 'avance', label: 'Avance', type: 'select', options: TRAMOS_AVANCE.map((valor) => ({ label: valor, value: valor })), multiple: true },
      // Un rango de fechas con el embudo de los demás filtros, como en Encuestas (21-oct).
      { id: 'cierre', label: 'Cierre', type: 'custom', component: FiltroRangoCierre },
    ],
    onColumnFiltersChange: (nuevos) => {
      const siguiente: FiltrosCiclos = { ...filtros }
      for (const campo of CAMPOS_FILTRO) siguiente[campo] = (nuevos.find((filtro) => filtro.id === campo)?.value as string[] | undefined) ?? []
      const [desde, hasta] = (nuevos.find((filtro) => filtro.id === 'cierre')?.value as (Date | undefined)[] | undefined) ?? []
      siguiente.cierre = desde || hasta ? [aIso(desde), aIso(hasta)] : []
      onFiltros(siguiente)
      setActual(1)
    },
    sort: {
      onSortChange: (nuevoOrden) => {
        setOrden(nuevoOrden)
        setActual(1)
      },
    },
    search: {
      placeholder: 'Buscar por nombre o periodo',
      onSearch: (query) => {
        setBusqueda(query)
        setActual(1)
      },
    },
    selection: { onSelectionChange: setSeleccionados },
    bulkActions: accionesSeleccion,
    labels: { dragToReorder: 'Arrastrar para reordenar la columna' },
    // Los dos vacíos del sistema, con ilustración: «Sin resultados» con lo buscado y «Primera vez».
    emptyState: conFiltros
      ? { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={filtrosActivos} onLimpiar={limpiar} /> }
      : { type: 'empty', customComponent: <PrimeraVez icono="glass-add" titulo="Todavía no hay ciclos" descripcion="Crea el primer ciclo de objetivos para empezar." /> },
    // Sin cambiar el ancho de las columnas: con él la tabla mide la suma de sus anchos más una columna de relleno y no cabe
    // en el marco con la barra lateral abierta (1.104 px); sin él, las columnas se reparten el ancho que hay.
    layout: { reorderable: true, resizable: false },
  }

  return (
    <TooltipProvider delay={200}>
      {aviso}
      <TablaDatos
        key={versionTabla}
        config={config}
        data={paginaActual}
        paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: resultado.length }}
        titulo={filtrosActivos > 0 ? 'Ciclos filtrados' : 'Lista de ciclos de objetivos'}
        nombre="ciclos"
        singular="ciclo"
        id="ciclos"
      />
    </TooltipProvider>
  )
}
