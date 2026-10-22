import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Download01Icon, GitCompareIcon, MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  type BulkAction,
  type DataGridListConfig,
  Progress,
  Text,
  TooltipProvider,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { plural } from '@/modules/design-system/patrones/formato'
import { numero } from '@/modules/design-system/graficos/piezas'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { FiltroRangoCierre } from './filtro-rango-cierre'
import { ORIGIN_BUCKETS, PROGRESS_BUCKETS, matchesFilters, originOf, NO_FILTERS, type SurveyListFilters } from '../modelo/surveyListFilters'
import { dateValue, parseSurveyDate, startOfToday } from '../modelo/surveyListDates'
import type { SurveyListItem } from '../modelo/types'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { INICIO_VENCIDO_TOOLTIP, borradorConInicioVencido } from '../modelo/inicio-vencido'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { ACCIONES, accionesDe, type AccionEncuesta } from './acciones'
import { MAXIMO, MINIMO, TIPOS_COMPARABLES } from './comparar/asistente-comparativo'
import { CeldaFecha, type ModoFecha } from './celda-fecha'
import { VARIANTE_ESTADO } from './tonos'

// Una fecha del calendario del filtro → «aaaa-mm-dd» (hora local); sin fecha, extremo abierto.
const aIso = (fecha: Date | undefined) =>
  fecha ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}` : ''

export type EdicionFecha = { id: string; modo: ModoFecha }

// La fecha mínima de cada edición: una encuesta reabierta tiene que quedar abierta al menos hasta
// mañana, y el cierre no puede quedar antes del inicio ni en el pasado.

function minimoDe(encuesta: SurveyListItem, modo: ModoFecha): Date {
  const hoy = startOfToday()
  if (modo === 'inicio') return new Date(0)
  if (modo === 'reabrir') return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)
  const inicio = parseSurveyDate(encuesta.startDate)
  return inicio && inicio > hoy ? inicio : hoy
}

// Una encuesta que se está guardando no tiene nada que hacer; el resto siempre se puede eliminar.
const sePuedeEliminar = (encuesta: SurveyListItem) => encuesta.status !== 'Cargando'

// El menú de tres puntos de cada fila: las acciones de su estado, en sus grupos, y «Eliminar» al final y en rojo.
// Propio y no el `actions.item` de DataGridList: el de la librería no pinta «Eliminar» en rojo, no usa el botón redondo
// de solo icono, deja el menú tan angosto que parte cada acción en dos líneas y es igual para todos los estados.
function MenuDeFila({ encuesta, onAccion }: { encuesta: SurveyListItem; onAccion: (accion: AccionEncuesta, encuesta: SurveyListItem) => void }) {
  const grupos = accionesDe(encuesta.status)
  if (grupos.length === 0 && !sePuedeEliminar(encuesta)) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${encuesta.name}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {grupos.map((grupo, indice) => (
          <Fragment key={grupo.join('-')}>
            {indice > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuGroup>
              {grupo.map((accion) => (
                <DropdownMenuItem key={accion} onClick={() => onAccion(accion, encuesta)}>
                  <HugeiconsIcon icon={ACCIONES[accion].icono} aria-hidden="true" />
                  {ACCIONES[accion].etiqueta}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </Fragment>
        ))}
        {sePuedeEliminar(encuesta) ? (
          <>
            {grupos.length > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem variant="destructive" onClick={() => onAccion('eliminar', encuesta)}>
              <HugeiconsIcon icon={ACCIONES.eliminar.icono} aria-hidden="true" />
              {ACCIONES.eliminar.etiqueta}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const icono = (accion: AccionEncuesta) => <HugeiconsIcon icon={ACCIONES[accion].icono} aria-hidden="true" />

export function TablaEncuestas({
  encuestas,
  titulo,
  filtros,
  onFiltros,
  edicion,
  onEditarFecha,
  onGuardarFecha,
  onAccion,
  onAbrir,
  onDuplicarVarias,
  onExportarVarias,
  onEliminarVarias,
  onCompararVarias,
  aviso,
}: {
  encuestas: readonly SurveyListItem[]
  // El título en lo gris, sobre el conteo (16-oct, Nicolás: «no me les quites los títulos a las tablas»).
  titulo?: string
  filtros: SurveyListFilters
  onFiltros: (filtros: SurveyListFilters) => void
  edicion: EdicionFecha | null
  onEditarFecha: (edicion: EdicionFecha | null) => void
  onGuardarFecha: (id: string, modo: ModoFecha, fecha: Date) => void
  onAccion: (accion: AccionEncuesta, encuesta: SurveyListItem) => void
  onAbrir: (encuesta: SurveyListItem) => void
  onDuplicarVarias: (ids: string[]) => void
  onExportarVarias: (ids: string[]) => void
  onEliminarVarias: (ids: string[], limpiar: () => void) => void
  onCompararVarias?: (ids: string[]) => void
  aviso?: ReactNode
}) {
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [seleccionadas, setSeleccionadas] = useState<SurveyListItem[]>([])
  // Cambia para montar la tabla de nuevo y soltar la selección después de una acción masiva.
  const [versionTabla, setVersionTabla] = useState(0)
  const soltarSeleccion = () => setVersionTabla((version) => version + 1)

  const resultado = useMemo(() => {
    const hoy = new Date()
    const q = busqueda.trim().toLowerCase()
    const filas = encuestas
      .filter((encuesta) => matchesFilters(encuesta, filtros, hoy))
      .filter((encuesta) => !q || `${encuesta.name} ${encuesta.type}`.toLowerCase().includes(q))
    
    if (!orden) return filas
    
    const desc = orden.startsWith('-')
    const campo = (desc ? orden.slice(1) : orden) as keyof SurveyListItem
    return [...filas].sort((a, b) => {
      let va: any = a[campo] ?? ''
      let vb: any = b[campo] ?? ''
      
      if (campo === 'startDate') { va = dateValue(a.startDate); vb = dateValue(b.startDate) }
      if (campo === 'endDate') { va = dateValue(a.endDate); vb = dateValue(b.endDate) }
      if (campo === 'participants') { va = Number(a.participants) || 0; vb = Number(b.participants) || 0 }
      
      const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')
      return desc ? -r : r
    })
  }, [encuestas, filtros, busqueda, orden])

  // Si se reabre una encuesta desde otra pantalla (el panel de riesgos), su fila puede estar en otra página: se va a ella
  // para que el selector de la celda Cierre abra sobre la fila. Solo al empezar la edición, no cada vez que cambia la lista.
  useEffect(() => {
    if (edicion?.modo !== 'reabrir') return
    const posicion = resultado.findIndex((encuesta) => encuesta.id === edicion.id)
    if (posicion >= 0) setActual(Math.floor(posicion / porPagina) + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edicion])

  const paginaActual = useMemo(() => resultado.slice((actual - 1) * porPagina, actual * porPagina), [resultado, actual, porPagina])

  const opcionesTipo = useMemo(() => [...new Set(encuestas.map((e) => e.type))].sort((a, b) => a.localeCompare(b, 'es')), [encuestas])
  const opcionesEstado = useMemo(() => [...new Set(encuestas.map((e) => e.status))], [encuestas])

  const marcadas = seleccionadas.map(s => s.id)
  const comparables = marcadas.length >= MINIMO && marcadas.length <= MAXIMO && seleccionadas.every((encuesta) => encuesta.status === 'Finalizado' && encuesta.type === seleccionadas[0].type && TIPOS_COMPARABLES.includes(encuesta.type))

  // Con una encuesta marcada salen las mismas acciones que en su menú de tres puntos; con varias, solo las que se pueden
  // hacer a la vez. «Eliminar» va siempre, al final.
  const unaMarcada = seleccionadas.length === 1 ? seleccionadas[0] : null
  const accionesSeleccion: BulkAction<SurveyListItem>[] = [
    ...(unaMarcada ? accionesDe(unaMarcada.status).flat() : []).map((accion): BulkAction<SurveyListItem> => ({
      id: accion,
      label: ACCIONES[accion].etiqueta,
      icon: icono(accion),
      visibility: 'single-only',
      onClick: ([encuesta]) => onAccion(accion, encuesta),
    })),
    {
      id: 'duplicarVarias',
      label: 'Duplicar',
      icon: icono('duplicar'),
      visibility: 'bulk-only',
      onClick: (filas) => {
        onDuplicarVarias(filas.map((fila) => fila.id))
        soltarSeleccion()
      },
    },
    ...(onCompararVarias
      ? [
          {
            id: 'compararVarias',
            label: comparables ? 'Comparar' : `Comparar: elige de ${MINIMO} a ${MAXIMO} finalizadas del mismo tipo`,
            icon: <HugeiconsIcon icon={GitCompareIcon} aria-hidden="true" />,
            visibility: 'bulk-only' as const,
            disabled: !comparables,
            onClick: (filas: SurveyListItem[]) => onCompararVarias(filas.map((fila) => fila.id)),
          },
        ]
      : []),
    {
      id: 'exportarVarias',
      label: 'Exportar',
      icon: <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />,
      visibility: 'bulk-only',
      onClick: (filas) => onExportarVarias(filas.map((fila) => fila.id)),
    },
    {
      id: 'eliminarSeleccion',
      label: seleccionadas.length > 1 ? 'Eliminar encuestas' : ACCIONES.eliminar.etiqueta,
      icon: icono('eliminar'),
      variant: 'destructive',
      visibility: 'always',
      disabled: !seleccionadas.some(sePuedeEliminar),
      onClick: (filas) => {
        const eliminables = filas.filter(sePuedeEliminar)
        if (eliminables.length === 1) onAccion('eliminar', eliminables[0])
        else onEliminarVarias(eliminables.map((fila) => fila.id), soltarSeleccion)
      },
    },
  ]

  const filtrosActivos = Object.values(filtros).filter((valores) => valores.length > 0).length
  const limpiar = () => {
    setBusqueda('')
    onFiltros(NO_FILTERS)
    setActual(1)
    // Montarla de nuevo vacía también su buscador y sus filtros por columna.
    soltarSeleccion()
  }

  const config = useMemo<DataGridListConfig<SurveyListItem>>(() => ({
    // El marco, el conteo («12 encuestas») y las acciones de la selección junto al buscador los pone TablaDatos.
    columns: [
      {
        accessorKey: 'name',
        header: 'Nombre',
        size: 190,
        // El tipo va en la línea gris bajo el nombre, como Vacante + Área, y su filtro en este encabezado: con «Origen»
        // (14-oct) no cabían las dos columnas en 1.104 px sin desplazamiento horizontal.
        // Mientras se edita una fecha de la fila, el nombre no abre la encuesta: queda como texto.
        cell: ({ row }) => (
          <CeldaTitulo titulo={row.original.name} detalle={row.original.type} onClick={edicion?.id === row.original.id ? undefined : () => onAbrir(row.original)} />
        ),
      },
      {
        // «UBITS» si se creó en la plataforma, «Externa» si llegó con «Cargar encuestas» (Elkin, 14-oct).
        accessorKey: 'origin',
        header: 'Origen',
        size: 140,
        // Solo filtro, sin orden: con dos valores no hace falta, y el encabezado queda más angosto.
        enableSorting: false,
        cell: ({ row }) => {
          const origen = originOf(row.original)
          return <Badge variant={origen === 'UBITS' ? 'info-outline' : 'outline'}>{origen}</Badge>
        },
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        size: 160,
        cell: ({ row }) => <Badge variant={VARIANTE_ESTADO[row.original.status] ?? 'outline'}>{row.original.status}</Badge>,
      },
      {
        accessorKey: 'startDate',
        header: 'Inicio',
        size: 125,
        cell: ({ row }) => {
          const propia = edicion?.id === row.original.id ? edicion.modo : null
          const modo = propia !== null && propia === 'inicio' ? propia : null
          const editable = row.original.status === 'En progreso' || row.original.status === 'Por iniciar'
          // CRE-120: un borrador cuyo inicio ya pasó sigue en «Borrador» (nunca se envió); la fecha lo dice en tono de aviso.
          if (!editable && modo === null && borradorConInicioVencido(row.original)) {
            return (
              <Hint label={INICIO_VENCIDO_TOOLTIP}>
                <span tabIndex={0} className="inline-flex items-center gap-1 text-warning">
                  <HugeiconsIcon icon={Alert02Icon} size={14} aria-hidden="true" />
                  <Text as="span" size="sm" weight="medium" className="tabular-nums text-warning">{row.original.startDate}</Text>
                  <span className="sr-only">{INICIO_VENCIDO_TOOLTIP}</span>
                </span>
              </Hint>
            )
          }
          if (!editable && modo === null) {
            return <Text as="span" size="sm" weight="medium" className="tabular-nums">{row.original.startDate}</Text>
          }
          return (
            <CeldaFecha
              key={modo ?? 'cerrada'}
              valor={row.original.startDate}
              modo={modo}
              minimo={minimoDe(row.original, modo ?? 'inicio')}
              bloqueada={edicion !== null && edicion.id !== row.original.id}
              onEmpezar={() => onEditarFecha({ id: row.original.id, modo: 'inicio' })}
              onGuardar={(fecha) => onGuardarFecha(row.original.id, modo ?? 'inicio', fecha)}
              onCancelar={() => onEditarFecha(null)}
            />
          )
        },
      },
      {
        accessorKey: 'endDate',
        header: 'Cierre',
        size: 155,
        cell: ({ row }) => {
          const propia = edicion?.id === row.original.id ? edicion.modo : null
          // «Reabrir» también se elige en esta celda: es el mismo selector de «Editar fechas», con su propio texto y su botón «Aplicar nueva fecha».
          const modo = propia === 'cierre' || propia === 'reabrir' ? propia : null
          const editable = row.original.status === 'En progreso' || row.original.status === 'Por iniciar'
          if (!editable && modo === null) {
            return <Text as="span" size="sm" weight="medium" className="tabular-nums">{row.original.endDate}</Text>
          }
          return (
            <CeldaFecha
              key={modo ?? 'cerrada'}
              valor={row.original.endDate}
              modo={modo}
              minimo={minimoDe(row.original, modo ?? 'cierre')}
              bloqueada={edicion !== null && edicion.id !== row.original.id}
              onEmpezar={() => onEditarFecha({ id: row.original.id, modo: 'cierre' })}
              onGuardar={(fecha) => onGuardarFecha(row.original.id, modo ?? 'cierre', fecha)}
              onCancelar={() => onEditarFecha(null)}
            />
          )
        },
      },
      {
        accessorKey: 'progress',
        header: 'Avance',
        size: 165,
        // Los participantes van aquí, bajo la barra, y no en una columna propia: con ella la tabla no cabía en el marco y
        // se iba a desplazamiento horizontal.
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-3">
              <Progress value={row.original.progress} className="w-20" aria-label={`Avance ${row.original.progress} %`} />
              <Text as="span" size="xs" variant="muted" className="w-9 text-right tabular-nums">
                {row.original.progress} %
              </Text>
            </div>
            <Text as="span" size="xs" variant="muted" className="tabular-nums">
              de {numero(Number(row.original.participants) || 0)} {plural(Number(row.original.participants) || 0, 'participante', 'participantes')}
            </Text>
          </div>
        ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        size: 100,
        enableSorting: false,
        enableResizing: false,
        enableColumnOrdering: false,
        cell: ({ row }) => <MenuDeFila encuesta={row.original} onAccion={onAccion} />,
      },
    ],
    columnFilters: [
      {
        id: 'type',
        // En el encabezado de Nombre: el tipo ya no tiene columna propia, va bajo el nombre.
        columnId: 'name',
        label: 'Tipo',
        type: 'select',
        options: opcionesTipo.map((e) => ({ label: e, value: e })),
        multiple: true,
      },
      {
        id: 'origin',
        label: 'Origen',
        type: 'select',
        options: ORIGIN_BUCKETS.map((e) => ({ label: e, value: e })),
        multiple: true,
      },
      {
        id: 'status',
        label: 'Estado',
        type: 'select',
        options: opcionesEstado.map((e) => ({ label: e, value: e })),
        multiple: true,
      },
      {
        id: 'closeRange',
        // En el encabezado de Cierre, un rango de fechas con el embudo de los demás filtros (Elkin, 21-oct).
        columnId: 'endDate',
        label: 'Cierre',
        type: 'custom',
        component: FiltroRangoCierre,
      },
      {
        id: 'progress',
        label: 'Avance',
        type: 'select',
        options: PROGRESS_BUCKETS.map((e) => ({ label: e, value: e })),
        multiple: true,
      },
    ],
    onColumnFiltersChange: (nuevos) => {
      const f = { ...filtros }
      for (const filter of nuevos) {
        if (filter.id === 'type' || filter.id === 'origin' || filter.id === 'status' || filter.id === 'progress') {
           f[filter.id] = filter.value as string[]
        }
        // La tabla nombra el filtro por su columna: el de Cierre llega como `endDate`, con [desde, hasta] en fechas.
        if (filter.id === 'endDate' || filter.id === 'closeRange') {
          const [desde, hasta] = (filter.value as (Date | undefined)[] | undefined) ?? []
          f.closeRange = desde || hasta ? [aIso(desde), aIso(hasta)] : []
        }
        if (filter.id === 'name') f.type = filter.value as string[]
      }
      // If a filter is missing from nuevos, it means it was cleared
      const presentes = nuevos.map(n => (n.id === 'endDate' ? 'closeRange' : n.id === 'name' ? 'type' : n.id))
      for (const key of ['type', 'origin', 'status', 'closeRange', 'progress'] as const) {
        if (!presentes.includes(key)) {
          f[key] = []
        }
      }
      onFiltros(f)
      setActual(1)
    },
    sort: {
      onSortChange: (nuevoOrden) => {
        setOrden(nuevoOrden)
        setActual(1)
      },
    },
    search: {
      placeholder: 'Buscar por nombre o tipo',
      onSearch: (query) => {
        setBusqueda(query)
        setActual(1)
      },
    },
    // Sin `pagination`: la de la librería viene en inglés. El pie en español lo pone TablaDatos, el de todo el admin.
    selection: { onSelectionChange: setSeleccionadas },
    bulkActions: accionesSeleccion,
    // La librería trae en inglés el nombre del asa de cada columna para los lectores de pantalla.
    labels: { dragToReorder: 'Arrastrar para reordenar la columna' },
    // Los dos vacíos del sistema, con ilustración (decisión 14): «Sin resultados» con lo buscado y «Primera vez».
    emptyState: busqueda.trim() || filtrosActivos > 0
      ? { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={filtrosActivos} onLimpiar={limpiar} /> }
      : {
          type: 'empty',
          customComponent: <PrimeraVez icono="glass-paper-plus" titulo="Todavía no hay encuestas" descripcion="Crea la primera encuesta y aquí verás su avance, sus fechas y sus resultados." />,
        },
    layout: {
      reorderable: true,
      resizable: true,
    },
  }), [busqueda, filtros, filtrosActivos, opcionesTipo, opcionesEstado, edicion, onAbrir, onAccion, onFiltros, accionesSeleccion, limpiar])

  return (
    <TooltipProvider delay={200}>
      {/* Los tooltips de la tabla (acciones masivas) salen a los 200 ms, como los del resto del playground. */}
      {aviso}
      <TablaDatos
        key={versionTabla}
        config={config}
        data={paginaActual}
        paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: resultado.length }}
        titulo={titulo}
        nombre="encuestas"
        singular="encuesta"
        id="encuestas"
      />
    </TooltipProvider>
  )
}
