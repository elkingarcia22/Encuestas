import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Calendar03Icon,
  Delete02Icon,
  Download01Icon,
  Flag02Icon,
  PlusSignIcon,
  TaskDone01Icon,
  UserSwitchIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  Progress,
  ProgressValue,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  type DataGridListConfig,
  type ListAction,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { notify } from '@/shared/components/notify'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { DialogoConfirmar } from '../../estados/confirmaciones'

import { CasoUbits } from '../../patrones/piezas'
import { SIN_ARRASTRE } from './sin-arrastre'
import { diasDesde, fechaCorta, fechaSinAnio, formatoKM, iniciales, isoHaceDias, plural } from '../../patrones/formato'
import { Indicadores as FilaEnMarco } from '../../metricas/cifras'
import { PERIODOS, PLANES, TAREAS, type EstadoPlan, type EstadoTarea, type Plan, type Prioridad, type Tarea } from './seguimiento-datos'

// Caso: Seguimiento de tareas y planes de toda la empresa (Herramientas › Tareas del admin).
// Fuente: HU «Seguimiento HR de tareas y planes» (RN-01 a RN-10).

type Filtro = { id: string; value: unknown }


const BADGE_TAREA: Record<EstadoTarea, 'secondary' | 'info-light' | 'success-light' | 'destructive-outline'> = {
  'Por hacer': 'secondary',
  Activo: 'info-light',
  Finalizada: 'success-light',
  Vencida: 'destructive-outline',
}

const BADGE_PLAN: Record<EstadoPlan, 'secondary' | 'info-light' | 'success-light' | 'destructive-outline'> = {
  'Por hacer': 'secondary',
  Activo: 'info-light',
  Finalizado: 'success-light',
  Vencido: 'destructive-outline',
}

// Lo rojo va en destructive-outline: destructive-light no se lee en el tema claro.
const BADGE_PRIORIDAD: Record<Prioridad, 'destructive-outline' | 'warning-light' | 'secondary'> = {
  Alta: 'destructive-outline',
  Media: 'warning-light',
  Baja: 'secondary',
}

function vencimiento(tarea: Tarea) {
  if (tarea.estado === 'Finalizada') return 'Terminada'
  const dias = -diasDesde(tarea.vence)
  if (dias < 0) return `Venció hace ${-dias} ${plural(-dias, 'día', 'días')}`
  if (dias === 0) return 'Vence hoy'
  return `Vence en ${dias} ${plural(dias, 'día', 'días')}`
}

export function Persona({ nombre, detalle }: { nombre: string; detalle?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar size="sm">
        <AvatarFallback>{iniciales(nombre)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-1">
        <Text as="span" size="sm" className="truncate">
          {nombre}
        </Text>
        {detalle ? (
          <Text as="span" variant="muted" size="xs" className="truncate">
            {detalle}
          </Text>
        ) : null}
      </div>
    </div>
  )
}

// ── Columnas y filtros (fuera del componente: si no, el filtro se cierra al marcar) ──

const COLUMNAS_TAREAS: DataGridListConfig<Tarea>['columns'] = [
  {
    accessorKey: 'titulo',
    header: 'Tarea',
    size: 280,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col gap-1">
        <Text as="span" size="sm" weight="medium" className="truncate">
          {row.original.titulo}
        </Text>
        <Text as="span" variant="muted" size="xs" className="truncate">
          {row.original.plan}
        </Text>
      </div>
    ),
  },
  {
    accessorKey: 'responsable',
    header: 'Responsable',
    size: 190,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <Persona nombre={row.original.responsable} detalle={row.original.area} />,
  },
  {
    accessorKey: 'prioridad',
    header: 'Prioridad',
    size: 110,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Badge variant={BADGE_PRIORIDAD[row.original.prioridad]} size="sm">
        {row.original.prioridad}
      </Badge>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    size: 110,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Badge variant={BADGE_TAREA[row.original.estado]} size="sm">
        {row.original.estado}
      </Badge>
    ),
  },
  {
    accessorKey: 'vence',
    header: 'Vence',
    size: 150,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <Text as="span" size="sm">
          {fechaCorta(row.original.vence)}
        </Text>
        <Text as="span" variant="muted" size="xs">
          {vencimiento(row.original)}
        </Text>
      </div>
    ),
  },
  {
    accessorKey: 'creada',
    header: 'Creada',
    size: 120,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" variant="muted" size="sm">
        {fechaCorta(row.original.creada)}
      </Text>
    ),
  },
]

const FILTROS_TAREAS: DataGridListConfig<Tarea>['columnFilters'] = [
  {
    id: 'estado',
    label: 'Estado',
    type: 'select',
    multiple: true,
    options: (['Por hacer', 'Activo', 'Finalizada', 'Vencida'] as EstadoTarea[]).map((e) => ({ label: e, value: e })),
  },
  {
    id: 'prioridad',
    label: 'Prioridad',
    type: 'select',
    multiple: true,
    options: (['Alta', 'Media', 'Baja'] as Prioridad[]).map((p) => ({ label: p, value: p })),
  },
]

const COLUMNAS_PLANES: DataGridListConfig<Plan>['columns'] = [
  {
    accessorKey: 'nombre',
    header: 'Plan',
    size: 300,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col gap-1">
        <Text as="span" size="sm" weight="medium" className="truncate">
          {row.original.nombre}
        </Text>
        <Text as="span" variant="muted" size="xs">
          {row.original.tareas} tareas
        </Text>
      </div>
    ),
  },
  {
    accessorKey: 'responsable',
    header: 'Responsable',
    size: 200,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <Persona nombre={row.original.responsable} />,
  },
  {
    accessorKey: 'avance',
    header: 'Avance',
    size: 170,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Progress value={row.original.avance} className="w-full gap-1.5">
        <ProgressValue className="ms-auto" />
      </Progress>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    size: 120,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Badge variant={BADGE_PLAN[row.original.estado]} size="sm">
        {row.original.estado}
      </Badge>
    ),
  },
  {
    accessorKey: 'fin',
    header: 'Fechas',
    size: 170,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" size="sm">
        {fechaSinAnio(row.original.inicio)} – {fechaCorta(row.original.fin)}
      </Text>
    ),
  },
]

const FILTROS_PLANES: DataGridListConfig<Plan>['columnFilters'] = [
  {
    id: 'estado',
    label: 'Estado',
    type: 'select',
    multiple: true,
    options: (['Por hacer', 'Activo', 'Finalizado', 'Vencido'] as EstadoPlan[]).map((e) => ({ label: e, value: e })),
  },
]

// ── Resolver en memoria lo que en producto haría el servidor ──

function resolver<T extends { creada: string }>(
  filas: T[],
  periodo: string,
  busqueda: string,
  campos: (keyof T)[],
  filtros: Filtro[],
  orden: string | undefined,
) {
  const desde = isoHaceDias(PERIODOS.find((p) => p.valor === periodo)?.dias ?? 7)
  const q = busqueda.trim().toLowerCase()

  let resultado = filas.filter((fila) => {
    if (fila.creada < desde) return false
    if (q && !campos.some((campo) => String(fila[campo]).toLowerCase().includes(q))) return false
    for (const { id, value } of filtros) {
      if (Array.isArray(value) && value.length > 0 && !value.map(String).includes(String(fila[id as keyof T]))) {
        return false
      }
    }
    return true
  })

  if (orden) {
    const desc = orden.startsWith('-')
    const campo = (desc ? orden.slice(1) : orden) as keyof T
    resultado = [...resultado].sort((a, b) => {
      const va = a[campo]
      const vb = b[campo]
      const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')
      return desc ? -r : r
    })
  }

  return resultado
}

// ── Piezas del caso ──

export type Indicador = { titulo: string; valor: number; detalle: string; atencion?: boolean }

// Las cifras van en una sola tarjeta partida (acuerdo del 14-sep), con la pieza de Design system › Métricas.
export function Indicadores({ items }: { items: Indicador[] }) {
  return (
    <FilaEnMarco
      cifras={items.map((item) => ({ etiqueta: item.titulo, valor: formatoKM(item.valor), detalle: item.detalle, atencion: item.atencion && item.valor > 0 }))}
    />
  )
}

// RN-09: eliminar exige escribir la palabra del modal «Eliminar elementos».
// Título, texto y botón son opcionales para que otros templates (eliminar un plan de formación)
// usen el mismo diálogo con su propio copy; sin ellos se ve igual que en Seguimiento.
export function ConfirmarEliminar({
  abierto,
  onAbiertoChange,
  cantidad,
  sustantivo,
  onConfirmar,
  titulo = 'Eliminar elementos',
  descripcion,
  accion,
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  cantidad: number
  sustantivo: [string, string]
  onConfirmar: () => void
  titulo?: string
  descripcion?: string
  accion?: string
}) {
  const [texto, setTexto] = useState('')
  const listo = texto.trim().toLowerCase() === 'eliminar'

  // Eliminar es una confirmación, así que va en la ventana de confirmar (DialogoConfirmar, acuerdo del 6-oct: confirmar
  // en DialogoConfirmar, todo lo que tiene contenido en ActionDialog). La API de esta pieza no cambia.
  return (
    <DialogoConfirmar
      abierto={abierto}
      onAbiertoChange={(siguiente) => {
        onAbiertoChange(siguiente)
        if (siguiente) setTexto('')
      }}
      size="sm"
      icono={Delete02Icon}
      titulo={titulo ?? '¿Eliminar?'}
      descripcion={
        descripcion ??
        `Vas a eliminar ${cantidad} ${plural(cantidad, ...sustantivo)} de toda la empresa. Quienes las tenían asignadas dejan de verlas y no se pueden recuperar.`
      }
      accion={accion ?? `Eliminar ${cantidad} ${plural(cantidad, ...sustantivo)}`}
      destructiva
      deshabilitada={!listo}
      onConfirmar={() => {
        onAbiertoChange(false)
        onConfirmar()
      }}
    >
      <Field>
        <FieldLabel htmlFor="confirmar-eliminar">Escribe «eliminar» para confirmar</FieldLabel>
        <Input
          id="confirmar-eliminar"
          value={texto}
          autoComplete="off"
          onChange={(evento) => setTexto(evento.target.value)}
        />
        <FieldDescription>Así nadie borra cientos de registros por un clic de más.</FieldDescription>
      </Field>
    </DialogoConfirmar>
  )
}

const icono = (i: typeof ViewIcon) => <HugeiconsIcon icon={i} aria-hidden="true" />

// ── Pestaña Tareas ──

function TablaTareas({ periodo, limpiarSeleccion }: { periodo: string; limpiarSeleccion: Record<string, boolean> }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(50)
  const [eliminadas, setEliminadas] = useState<Set<string>>(new Set())
  const [porEliminar, setPorEliminar] = useState<Tarea[]>([])
  const [confirmando, setConfirmando] = useState(false)

  const vivas = useMemo(() => TAREAS.filter((t) => !eliminadas.has(t.id)), [eliminadas])
  const resultado = useMemo(
    () => resolver(vivas, periodo, busqueda, ['titulo', 'plan', 'responsable'], filtros, orden),
    [vivas, periodo, busqueda, filtros, orden],
  )
  const visibles = useMemo(() => resultado.slice((pagina - 1) * porPagina, pagina * porPagina), [resultado, pagina, porPagina])

  // RN-08: los indicadores cuentan la lista filtrada, no toda la empresa.
  const cuenta = (estado: EstadoTarea) => resultado.filter((t) => t.estado === estado).length

  const aviso = (titulo: string) => (filas: Tarea[]) =>
    notify(`${titulo} ${filas.length} ${plural(filas.length, 'tarea', 'tareas')}`, undefined, 'success')

  const masivas: ListAction<Tarea>[] = [
    { id: 'reasignar', label: 'Reasignar', icon: icono(UserSwitchIcon), onClick: aviso('Se reasignaron') },
    { id: 'prioridad', label: 'Cambiar prioridad', icon: icono(Flag02Icon), onClick: aviso('Cambió la prioridad de') },
    { id: 'estado', label: 'Cambiar estado', icon: icono(TaskDone01Icon), onClick: aviso('Cambió el estado de') },
    { id: 'fecha', label: 'Cambiar fecha', icon: icono(Calendar03Icon), onClick: aviso('Cambió la fecha de') },
    { id: 'descargar', label: 'Descargar', icon: icono(Download01Icon), onClick: aviso('Se descargaron') },
    {
      id: 'eliminar',
      label: 'Eliminar',
      variant: 'destructive',
      icon: icono(Delete02Icon),
      onClick: (filas) => {
        setPorEliminar(filas)
        setConfirmando(true)
      },
    },
  ]

  const config: DataGridListConfig<Tarea> = {
    columns: COLUMNAS_TAREAS,
    columnFilters: FILTROS_TAREAS,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setPagina(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar tarea, plan o persona…',
      onSearch: (q) => {
        setBusqueda(q)
        setPagina(1)
      },
    },
    selection: { onSelectionChange: () => undefined },
    actions: {
      primary: {
        id: 'crear',
        label: 'Crear tarea',
        icon: <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />,
        onClick: () => notify('Se abre la creación de una tarea de seguimiento', undefined, 'info'),
      },
      item: [
        {
          id: 'detalle',
          label: 'Ver detalle',
          icon: icono(ViewIcon),
          onClick: ([fila]) => notify('Se abre el detalle de la tarea', fila?.titulo, 'info'),
        },
      ],
      bulk: masivas,
    },
    emptyState: {
      type: 'no-results',
      title: 'No se encontraron resultados',
      description: 'Amplía el periodo o quita alguno de los filtros.',
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
    frame: { toolbar: 'header' },
    labels: {
      resultCount: (_v, total) => `${total.toLocaleString('es-CO')} ${plural(total, 'tarea', 'tareas')} en el periodo`,
    },
  }

  return (
    <div className="flex flex-col gap-4">
      <Indicadores
        items={[
          { titulo: 'Tareas', valor: resultado.length, detalle: 'Con los filtros de ahora' },
          { titulo: 'Finalizadas', valor: cuenta('Finalizada'), detalle: 'Cerradas a tiempo o tarde' },
          { titulo: 'Por hacer', valor: cuenta('Por hacer') + cuenta('Activo'), detalle: 'Por hacer y activas' },
          { titulo: 'Vencidas', valor: cuenta('Vencida'), detalle: 'Pasaron su fecha', atencion: true },
        ]}
      />
      <TablaDatos config={config} data={visibles} initialRowSelection={limpiarSeleccion} paginacion={{ pagina: pagina, setPagina: setPagina, porPagina: porPagina, setPorPagina: setPorPagina, total: resultado.length }} nombre="tareas" id="seguimiento-tareas" />
      <ConfirmarEliminar
        abierto={confirmando}
        onAbiertoChange={setConfirmando}
        cantidad={porEliminar.length}
        sustantivo={['tarea', 'tareas']}
        onConfirmar={() => {
          setEliminadas((previas) => new Set([...previas, ...porEliminar.map((t) => t.id)]))
          notify(`${porEliminar.length} ${plural(porEliminar.length, 'tarea eliminada', 'tareas eliminadas')}`, undefined, 'success')
          setConfirmando(false)
        }}
      />
    </div>
  )
}

// ── Pestaña Planes ──

function TablaPlanes({ periodo, limpiarSeleccion }: { periodo: string; limpiarSeleccion: Record<string, boolean> }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(50)
  const [eliminados, setEliminados] = useState<Set<string>>(new Set())
  const [porEliminar, setPorEliminar] = useState<Plan[]>([])
  const [confirmando, setConfirmando] = useState(false)

  const vivos = useMemo(() => PLANES.filter((p) => !eliminados.has(p.id)), [eliminados])
  const resultado = useMemo(
    () => resolver(vivos, periodo, busqueda, ['nombre', 'responsable'], filtros, orden),
    [vivos, periodo, busqueda, filtros, orden],
  )
  const visibles = useMemo(() => resultado.slice((pagina - 1) * porPagina, pagina * porPagina), [resultado, pagina, porPagina])
  const cuenta = (estado: EstadoPlan) => resultado.filter((p) => p.estado === estado).length

  const aviso = (titulo: string) => (filas: Plan[]) =>
    notify(`${titulo} ${filas.length} ${plural(filas.length, 'plan', 'planes')}`, undefined, 'success')

  const config: DataGridListConfig<Plan> = {
    columns: COLUMNAS_PLANES,
    columnFilters: FILTROS_PLANES,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setPagina(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar plan o responsable…',
      onSearch: (q) => {
        setBusqueda(q)
        setPagina(1)
      },
    },
    selection: { onSelectionChange: () => undefined },
    actions: {
      primary: {
        id: 'crear',
        label: 'Crear plan',
        icon: <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />,
        onClick: () => notify('Se abre la creación de un plan de tareas', undefined, 'info'),
      },
      item: [
        {
          id: 'detalle',
          label: 'Ver detalle',
          icon: icono(ViewIcon),
          onClick: ([fila]) => notify('Se abre el detalle del plan', fila?.nombre, 'info'),
        },
      ],
      bulk: [
        { id: 'estado', label: 'Cambiar estado', icon: icono(TaskDone01Icon), onClick: aviso('Cambió el estado de') },
        { id: 'fecha', label: 'Cambiar fecha', icon: icono(Calendar03Icon), onClick: aviso('Cambió la fecha de') },
        { id: 'descargar', label: 'Descargar', icon: icono(Download01Icon), onClick: aviso('Se descargaron') },
        {
          id: 'eliminar',
          label: 'Eliminar',
          variant: 'destructive',
          icon: icono(Delete02Icon),
          onClick: (filas) => {
            setPorEliminar(filas)
            setConfirmando(true)
          },
        },
      ],
    },
    emptyState: {
      type: 'no-results',
      title: 'No se encontraron resultados',
      description: 'Amplía el periodo o quita alguno de los filtros.',
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
    frame: { toolbar: 'header' },
    labels: {
      resultCount: (_v, total) => `${total.toLocaleString('es-CO')} ${plural(total, 'plan', 'planes')} en el periodo`,
    },
  }

  return (
    <div className="flex flex-col gap-4">
      <Indicadores
        items={[
          { titulo: 'Planes', valor: resultado.length, detalle: 'Con los filtros de ahora' },
          { titulo: 'Finalizados', valor: cuenta('Finalizado'), detalle: 'Todas sus tareas cerradas' },
          { titulo: 'Por hacer', valor: cuenta('Por hacer') + cuenta('Activo'), detalle: 'Por hacer y activos' },
          { titulo: 'Vencidos', valor: cuenta('Vencido'), detalle: 'Pasaron su fecha de fin', atencion: true },
        ]}
      />
      <TablaDatos config={config} data={visibles} initialRowSelection={limpiarSeleccion} paginacion={{ pagina: pagina, setPagina: setPagina, porPagina: porPagina, setPorPagina: setPorPagina, total: resultado.length }} nombre="planes" id="seguimiento-planes" />
      <ConfirmarEliminar
        abierto={confirmando}
        onAbiertoChange={setConfirmando}
        cantidad={porEliminar.length}
        sustantivo={['plan', 'planes']}
        onConfirmar={() => {
          setEliminados((previos) => new Set([...previos, ...porEliminar.map((p) => p.id)]))
          notify(`${porEliminar.length} ${plural(porEliminar.length, 'plan eliminado', 'planes eliminados')}`, undefined, 'success')
          setConfirmando(false)
        }}
      />
    </div>
  )
}

// ── Caso completo ──

export function CasoSeguimiento() {
  const [pestana, setPestana] = useState('tareas')
  const [periodo, setPeriodo] = useState('7')
  // RN-02: al cambiar de pestaña se limpia la selección. Un objeto nuevo en initialRowSelection
  // reinicia la selección de las tablas sin perder su búsqueda ni sus filtros.
  const [limpiarSeleccion, setLimpiarSeleccion] = useState<Record<string, boolean>>({})

  return (
    <CasoUbits
      rol="Administrador"
      donde={['Herramientas', 'Tareas', 'Seguimiento']}
      titulo="Vista densa de toda la empresa con acciones masivas"
      descripcion="Recursos Humanos tiene que encontrar en menos de un minuto lo vencido o pendiente del periodo. Cambia el periodo, filtra por estado y mira cómo los indicadores cuentan exactamente lo que queda en la tabla. Selecciona varias filas para ver las acciones masivas."
      historia="la historia «Seguimiento HR de tareas y planes»"
      reglas={[
        { titulo: 'Periodo por defecto: últimos 7 días', detalle: 'Filtra por fecha de creación. Llega hasta «Último año».' },
        { titulo: 'Indicadores fieles a la tabla', detalle: 'Cuentan lo filtrado y usan el formato corto del producto (1,2K).' },
        { titulo: 'Cada pestaña conserva lo suyo', detalle: 'Tareas y Planes guardan su búsqueda y filtros; la selección se limpia al cambiar.' },
        { titulo: 'Acciones sobre varias filas', detalle: 'Reasignar, prioridad (solo tareas), estado, fecha, descargar y eliminar.' },
        { titulo: 'Eliminar se confirma escribiendo', detalle: 'El diálogo «Eliminar elementos» pide escribir la palabra antes de activar el botón.' },
        { titulo: 'De a 50 filas', detalle: 'La tabla trae 50 por página. En producto carga más al llegar al final.' },
      ]}
    >
      <Tabs
        value={pestana}
        onValueChange={(valor) => {
          setPestana(String(valor))
          setLimpiarSeleccion({})
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList variant="line">
            <TabsTrigger value="tareas" className="flex-none">
              Tareas
            </TabsTrigger>
            <TabsTrigger value="planes" className="flex-none">
              Planes
            </TabsTrigger>
          </TabsList>
          <Select value={periodo} onValueChange={(valor) => setPeriodo(String(valor))}>
            <SelectTrigger size="sm" className="w-44" aria-label="Periodo">
              <SelectValue>{(valor) => PERIODOS.find((p) => p.valor === valor)?.etiqueta}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PERIODOS.map((p) => (
                <SelectItem key={p.valor} value={p.valor}>
                  {p.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <TabsContent value="tareas" keepMounted className="pt-4">
          <TablaTareas periodo={periodo} limpiarSeleccion={limpiarSeleccion} />
        </TabsContent>
        <TabsContent value="planes" keepMounted className="pt-4">
          <TablaPlanes periodo={periodo} limpiarSeleccion={limpiarSeleccion} />
        </TabsContent>
      </Tabs>
    </CasoUbits>
  )
}
