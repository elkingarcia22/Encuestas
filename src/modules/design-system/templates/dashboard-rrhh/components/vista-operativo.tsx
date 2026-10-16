import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Calendar03Icon,
  Copy01Icon,
  FilterHorizontalIcon,
  Mail01Icon,
  UserMultiple02Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Heading,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
  Progress,
  ProgressLabel,
  ProgressValue,
  ScrollArea,
  ScrollBar,
  Spinner,
  Text,
  TrafficLight,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'

import {
  ETAPAS,
  KPIS_OPERATIVO,
  PROCESOS,
  VACANTES_INICIALES,
  iniciales,
  type Proceso,
  type Vacante,
} from './data'
import { Anillo, Sparkline } from '../../dashboard/components/graficos'

// Estructura tomada de los bloques Solutions · CRM de ReUI: indicadores con minigráfico, una
// tabla de trabajo con celdas de dos líneas y anillo de avance, y un tablero por etapas.

type Filtro = { id: string; value: unknown }

// ── Tabla de procesos ──

const ESTADO: Record<Proceso['estado'], { variante: 'info-light' | 'warning-light' | 'secondary' | 'destructive-outline' | 'success-light'; color: string }> = {
  'En curso': { variante: 'info-light', color: 'var(--chart-2)' },
  'Por vencer': { variante: 'warning-light', color: 'var(--warning)' },
  Borrador: { variante: 'secondary', color: 'var(--muted-foreground)' },
  Vencido: { variante: 'destructive-outline', color: 'var(--destructive)' },
  Finalizado: { variante: 'success-light', color: 'var(--success)' },
}

function plazo(proceso: Proceso) {
  if (proceso.estado === 'Finalizado') return `Cerró el ${proceso.cierre}`
  if (proceso.diasRestantes < 0) return `Venció hace ${Math.abs(proceso.diasRestantes)} días`
  if (proceso.diasRestantes === 0) return 'Cierra hoy'
  if (proceso.diasRestantes === 1) return 'Cierra mañana'
  return `${proceso.diasRestantes} días para cerrar`
}

// La tabla lee enableColumnOrdering en cada columna para pintar el asidero de arrastre, pero el
// tipo de las columnas no lo declara: por eso va en una constante aparte que se esparce en cada una.
const SIN_ARRASTRE = { enableColumnOrdering: false }

// Columnas y filtros fuera del componente: si se crean en cada render, el filtro se
// cierra al marcar la primera opción (ver trampas_conocidas en flux-ui-para-ia.json).
const COLUMNAS: DataGridListConfig<Proceso>['columns'] = [
  {
    accessorKey: 'avance',
    header: 'Avance',
    size: 200,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Anillo valor={row.original.avance} color={ESTADO[row.original.estado].color} />
        <div className="flex min-w-0 flex-col gap-1">
          <Text as="span" size="sm" weight="medium">
            {row.original.avance} % completado
          </Text>
          <Text as="span" variant="muted" size="xs" className="truncate">
            {row.original.hechos.toLocaleString('es-CO')} de {row.original.total.toLocaleString('es-CO')} {row.original.unidad}
          </Text>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'nombre',
    header: 'Proceso',
    size: 290,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col gap-1">
        <Text as="span" size="sm" weight="medium" className="truncate">
          {row.original.nombre}
        </Text>
        <Text as="span" variant="muted" size="xs" className="truncate">
          {row.original.modulo} · {row.original.codigo}
        </Text>
      </div>
    ),
  },
  {
    accessorKey: 'responsable',
    header: 'Responsable',
    size: 170,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback>{iniciales(row.original.responsable)}</AvatarFallback>
        </Avatar>
        <Text as="span" size="sm" className="truncate">
          {row.original.responsable}
        </Text>
      </div>
    ),
  },
  {
    accessorKey: 'diasRestantes',
    header: 'Fechas',
    size: 180,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <Text as="span" size="sm">
          {row.original.inicio} – {row.original.cierre}
        </Text>
        <Text as="span" variant="muted" size="xs" className="flex items-center gap-1">
          <HugeiconsIcon icon={Calendar03Icon} size={12} aria-hidden="true" />
          {plazo(row.original)}
        </Text>
      </div>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    size: 120,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Badge variant={ESTADO[row.original.estado].variante} size="sm">
        {row.original.estado}
      </Badge>
    ),
  },
]

const FILTROS: DataGridListConfig<Proceso>['columnFilters'] = [
  {
    id: 'estado',
    label: 'Estado',
    type: 'select',
    multiple: true,
    options: (Object.keys(ESTADO) as Proceso['estado'][]).map((e) => ({ label: e, value: e })),
  },
]

// DataGridList no filtra ni ordena solo: avisa del cambio y espera los datos resueltos.
function resolver(filas: Proceso[], busqueda: string, filtros: Filtro[], orden?: string) {
  const q = busqueda.trim().toLowerCase()
  let resultado = filas.filter((fila) => {
    if (q && ![fila.nombre, fila.responsable, fila.modulo, fila.codigo].some((c) => c.toLowerCase().includes(q))) return false
    for (const { id, value } of filtros) {
      if (Array.isArray(value) && value.length > 0 && !value.map(String).includes(String(fila[id as keyof Proceso]))) {
        return false
      }
    }
    return true
  })

  if (orden) {
    const desc = orden.startsWith('-')
    const campo = (desc ? orden.slice(1) : orden) as keyof Proceso
    resultado = [...resultado].sort((a, b) => {
      const va = a[campo]
      const vb = b[campo]
      const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')
      return desc ? -r : r
    })
  }

  return resultado
}

function TablaDeProcesos() {
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)

  const resultado = useMemo(() => resolver(PROCESOS, busqueda, filtros, orden), [busqueda, filtros, orden])
  const visibles = useMemo(() => resultado.slice((pagina - 1) * porPagina, pagina * porPagina), [resultado, pagina, porPagina])
  const hayFiltros = busqueda.trim() !== '' || filtros.length > 0

  const config: DataGridListConfig<Proceso> = {
    columns: COLUMNAS,
    columnFilters: FILTROS,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setPagina(1)
    },
    sort: { onSortChange: (nuevo) => setOrden(nuevo) },
    search: {
      placeholder: 'Buscar proceso o persona…',
      onSearch: (q) => {
        setBusqueda(q)
        setPagina(1)
      },
    },
    actions: {
      item: [
        { id: 'abrir', label: 'Abrir', icon: <HugeiconsIcon icon={ViewIcon} aria-hidden="true" />, onClick: () => undefined },
        { id: 'recordar', label: 'Enviar recordatorio', icon: <HugeiconsIcon icon={Mail01Icon} aria-hidden="true" />, onClick: () => undefined },
        { id: 'duplicar', label: 'Duplicar', icon: <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />, onClick: () => undefined },
      ],
    },
    emptyState: hayFiltros
      ? { type: 'no-results', title: 'Nada coincide con esos filtros', description: 'Prueba con otro módulo o estado.' }
      : { type: 'empty', title: 'No hay procesos en curso', description: 'Cuando crees una evaluación, encuesta o plan aparecerá aquí.' },
    // toolbar 'header': sin selección de filas, la barra de acciones en el panel queda como una franja vacía.
    frame: { title: 'Procesos en curso', toolbar: 'header' },
    // En un tablero de consulta no hace falta arrastrar columnas; así cabe la de acciones.
    // El asidero de cada cabecera se quita además con SIN_ARRASTRE en las columnas.
    layout: { reorderable: false },
  }

  return <TablaDatos config={config} data={visibles} paginacion={{ pagina: pagina, setPagina: setPagina, porPagina: porPagina, setPorPagina: setPorPagina, total: resultado.length }} nombre="procesos" id="operativo" />
}

// ── Tablero de vacantes ──

const RIESGO: Record<Vacante['riesgo'], 'success-light' | 'warning-light' | 'destructive-outline'> = {
  'A tiempo': 'success-light',
  'En riesgo': 'warning-light',
  Bloqueada: 'destructive-outline',
}

function restantes(dias: number) {
  if (dias <= 0) return 'Cierra hoy'
  if (dias === 1) return 'Cierra mañana'
  return `${dias} d restantes`
}

function TarjetaDeVacante({ vacante }: { vacante: Vacante }) {
  return (
    <KanbanItem value={vacante.id}>
      <KanbanItemHandle>
        <Frame variant="ghost" spacing="sm" className="p-0">
          <FramePanel className="flex flex-col gap-3 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-1">
                <Text as="span" size="sm" weight="medium" className="truncate">
                  {vacante.titulo}
                </Text>
                <Text as="span" variant="muted" size="xs">
                  {vacante.area}
                </Text>
              </div>
              <Badge variant={RIESGO[vacante.riesgo]} size="sm">
                {vacante.riesgo}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Item variant="outline" size="xs">
                <ItemContent>
                  <ItemTitle>
                    <HugeiconsIcon icon={UserMultiple02Icon} size={14} aria-hidden="true" />
                    {vacante.candidatos}
                  </ItemTitle>
                  <ItemDescription>Candidatos</ItemDescription>
                </ItemContent>
              </Item>
              <Item variant="outline" size="xs">
                <ItemContent>
                  <ItemTitle>
                    <HugeiconsIcon icon={Calendar03Icon} size={14} aria-hidden="true" />
                    {vacante.cierre}
                  </ItemTitle>
                  <ItemDescription>Cierre</ItemDescription>
                </ItemContent>
              </Item>
            </div>
            <Progress value={vacante.confianza}>
              <ProgressLabel>Confianza de cierre</ProgressLabel>
              <ProgressValue className="ms-auto" />
            </Progress>
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarFallback>{iniciales(vacante.reclutador)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Text as="span" size="xs" weight="medium" className="truncate">
                  {vacante.reclutador}
                </Text>
                <Text as="span" variant="muted" size="xs">
                  {vacante.rol}
                </Text>
              </div>
              <Text as="span" variant="muted" size="xs">
                {restantes(vacante.diasRestantes)}
              </Text>
            </div>
          </FramePanel>
        </Frame>
      </KanbanItemHandle>
    </KanbanItem>
  )
}

function TableroDeVacantes() {
  const [columnas, setColumnas] = useState<Record<string, Vacante[]>>(VACANTES_INICIALES)
  const total = Object.values(columnas).reduce((suma, lista) => suma + lista.length, 0)

  return (
    <section className="flex flex-col gap-3" aria-labelledby="vacantes-por-etapa">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Heading as="h2" level={5} id="vacantes-por-etapa">
              Vacantes por etapa
            </Heading>
            <Badge variant="outline" size="sm">
              {total}
            </Badge>
          </div>
          <Text variant="muted" size="sm">
            Las cinco etapas del flujo del candidato. Arrastra una vacante para cambiarla de etapa; desliza para ver todas.
          </Text>
        </div>
        <Button variant="outline" size="sm">
          <HugeiconsIcon icon={FilterHorizontalIcon} aria-hidden="true" />
          Filtros
        </Button>
      </div>
      {/* Cinco columnas anchas no caben: el tablero se desplaza en horizontal, con la barra visible. */}
      <ScrollArea className="w-full">
        <Kanban value={columnas} onValueChange={setColumnas} getItemValue={(vacante) => vacante.id}>
          <KanbanBoard className="w-[1400px] grid-cols-5 items-start gap-3 pb-4 sm:grid-cols-5">
            {ETAPAS.map((etapa) => {
              const vacantes = columnas[etapa.id] ?? []
              return (
                <KanbanColumn key={etapa.id} value={etapa.id}>
                  <Frame spacing="sm" className="h-full">
                    <FrameHeader className="flex flex-row items-center gap-2">
                      <TrafficLight data={{ label: etapa.titulo, items: [{ label: '', value: '', color: etapa.color }] }} />
                      <FrameTitle>{etapa.titulo}</FrameTitle>
                      <Badge variant="outline" size="sm" className="ms-auto">
                        {vacantes.length}
                      </Badge>
                    </FrameHeader>
                    <KanbanColumnContent value={etapa.id} className="flex min-h-24 flex-col gap-2 p-0.5">
                      {vacantes.map((vacante) => (
                        <TarjetaDeVacante key={vacante.id} vacante={vacante} />
                      ))}
                    </KanbanColumnContent>
                  </Frame>
                </KanbanColumn>
              )
            })}
          </KanbanBoard>
          <KanbanOverlay />
        </Kanban>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  )
}

export function VistaOperativo() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        {KPIS_OPERATIVO.map((kpi) => (
          <Card key={kpi.id} size="sm">
            <CardHeader>
              <CardTitle>{kpi.titulo}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between gap-4">
              <div className="flex flex-col gap-1">
                <CardDescription>{kpi.detalle}</CardDescription>
                <Text as="span" size="xl" weight="semibold">
                  {kpi.valor}
                </Text>
              </div>
              <div className="h-14 w-36 shrink-0" aria-hidden="true">
                <Sparkline datos={kpi.serie} color={kpi.color} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Alert variant="info">
        <Spinner />
        <AlertTitle>Carga masiva de 120 usuarios en proceso</AlertTitle>
        <AlertDescription>Van 42. Los cambios masivos se procesan en segundo plano; el resultado también llega por correo.</AlertDescription>
      </Alert>
      <TablaDeProcesos />
      <TableroDeVacantes />
    </div>
  )
}
