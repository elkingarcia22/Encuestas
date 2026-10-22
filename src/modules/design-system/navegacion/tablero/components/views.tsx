import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Progress,
  Text,
  cn,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { Persona } from '../../../data-grid/casos/seguimiento'
import { SIN_ARRASTRE } from '../../../data-grid/casos/sin-arrastre'
import { TablaDatos } from '../../../data-grid/tabla-datos'
import { HIRES, STAGES, TODAY, initials, type Hire } from './data'

// `filtrosActivos` y `onLimpiar`: los filtros de la página (los chips de Área y Etapa), que valen para las tres vistas.
type ViewProps = { hires: Hire[]; filtrosActivos: number; onLimpiar: () => void }
type Filtro = { id: string; value: unknown }

// ── Vista de lista: la tabla del sistema (decisión 1 de la auditoría, 5-oct) ──
// TablaDatos con su cabecera (conteo, buscador), orden en cada columna, «Acciones» con el «⋯» y su paginador. Área y
// etapa se filtran con los chips de la página, que valen también para el tablero y el calendario; la columna suma el
// filtro de responsable, que solo tiene sentido en la lista.

function MenuIngreso({ hire }: { hire: Hire }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${hire.name}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => notify(`Onboarding de ${hire.name}`, undefined, 'info')}>Ver onboarding</DropdownMenuItem>
        <DropdownMenuItem onClick={() => notify(`Recordatorio enviado a ${hire.name}`, undefined, 'success')}>Enviar recordatorio</DropdownMenuItem>
        <DropdownMenuItem onClick={() => notify('Cambiar responsable', undefined, 'info')}>Cambiar responsable</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const COLUMNAS: DataGridListConfig<Hire>['columns'] = [
  { accessorKey: 'name', header: 'Persona', size: 220, cell: ({ row }) => <Persona nombre={row.original.name} detalle={row.original.role} /> },
  { accessorKey: 'area', header: 'Área', size: 130, cell: ({ row }) => <Text as="span" size="sm">{row.original.area}</Text> },
  {
    accessorKey: 'day',
    header: 'Ingreso',
    size: 100,
    cell: ({ row }) => (
      <Text as="span" size="sm" className="tabular-nums">
        {row.original.day} sep
      </Text>
    ),
  },
  {
    accessorKey: 'stage',
    header: 'Etapa',
    size: 120,
    cell: ({ row }) => (
      <Badge variant={row.original.stage === 'Completado' ? 'outline' : 'secondary'} className="font-normal">
        {row.original.stage}
      </Badge>
    ),
  },
  {
    accessorKey: 'progress',
    header: 'Avance',
    size: 150,
    cell: ({ row }) => (
      <span className="flex w-full items-center gap-2.5">
        <Progress value={row.original.progress} aria-label={`Avance de ${row.original.name}`} className="flex-1" />
        <Text as="span" variant="muted" size="sm" className="w-9 shrink-0 tabular-nums">
          {row.original.progress}%
        </Text>
      </span>
    ),
  },
  { accessorKey: 'owner', header: 'Responsable', size: 150, cell: ({ row }) => <Text as="span" size="sm">{row.original.owner}</Text> },
  {
    accessorKey: 'risk',
    header: 'Alertas',
    size: 110,
    // Variante suave: la roja sólida lleva texto blanco y en modo oscuro daba 2.9:1.
    cell: ({ row }) =>
      row.original.risk ? (
        <Badge variant="destructive-light" className="font-normal">
          En riesgo
        </Badge>
      ) : null,
  },
  {
    id: 'acciones',
    header: 'Acciones',
    size: 96,
    enableSorting: false,
    enableResizing: false,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <MenuIngreso hire={row.original} />,
  },
]

const FILTROS: DataGridListConfig<Hire>['columnFilters'] = [
  {
    id: 'owner',
    label: 'Responsable',
    type: 'select',
    multiple: true,
    options: [...new Set(HIRES.map((hire) => hire.owner))].sort().map((owner) => ({ label: owner, value: owner })),
  },
]

const ORDEN: Record<string, (hire: Hire) => string | number> = {
  name: (h) => h.name,
  area: (h) => h.area,
  day: (h) => h.day,
  stage: (h) => STAGES.indexOf(h.stage),
  progress: (h) => h.progress,
  owner: (h) => h.owner,
  risk: (h) => Number(h.risk),
}

export function ListView({ hires, filtrosActivos, onLimpiar }: ViewProps) {
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  // Cambia para volver a montar la tabla: así «Limpiar» también vacía su buscador y su filtro.
  const [version, setVersion] = useState(0)

  const resultado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const valor = filtros.find((f) => f.id === 'owner')?.value
    const responsables = Array.isArray(valor) ? valor.map(String) : []
    const filas = hires.filter(
      (hire) =>
        (!q || hire.name.toLowerCase().includes(q) || hire.role.toLowerCase().includes(q)) &&
        (!responsables.length || responsables.includes(hire.owner)),
    )
    const desc = orden?.startsWith('-')
    const leer = orden ? ORDEN[desc ? orden.slice(1) : orden] : undefined
    if (!leer) return filas
    return [...filas].sort((a, b) => {
      const x = leer(a)
      const y = leer(b)
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es')
      return desc ? -r : r
    })
  }, [hires, busqueda, filtros, orden])
  // Los chips de la página pueden dejar menos filas de las que llegaban a esta página: se vuelve a la última que queda.
  const actual = Math.min(pagina, Math.max(1, Math.ceil(resultado.length / porPagina)))
  const visibles = resultado.slice((actual - 1) * porPagina, actual * porPagina)

  const filtrosPuestos = filtrosActivos + filtros.filter((f) => Array.isArray(f.value) && f.value.length > 0).length
  const filtrando = Boolean(busqueda.trim()) || filtrosPuestos > 0
  const limpiar = () => {
    setBusqueda('')
    setFiltros([])
    setPagina(1)
    setVersion((v) => v + 1)
    onLimpiar()
  }

  const config: DataGridListConfig<Hire> = {
    columns: COLUMNAS,
    columnFilters: FILTROS,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setPagina(1)
    },
    sort: {
      onSortChange: (nuevo) => {
        setOrden(nuevo)
        setPagina(1)
      },
    },
    search: {
      placeholder: 'Buscar persona o cargo',
      onSearch: (q) => {
        setBusqueda(q)
        setPagina(1)
      },
    },
    // Los dos vacíos del sistema, con ilustración.
    emptyState: filtrando
      ? { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={filtrosPuestos} onLimpiar={limpiar} /> }
      : {
          type: 'empty',
          customComponent: (
            <PrimeraVez icono="glass-calendar" titulo="Todavía no hay ingresos" descripcion="Cuando firmes el contrato de alguien nuevo, aquí verás su onboarding." />
          ),
        },
  }

  return (
    <TablaDatos
      key={version}
      config={config}
      data={visibles}
      paginacion={{ pagina: actual, setPagina, porPagina, setPorPagina, total: resultado.length }}
      nombre="personas"
      singular="persona"
      id="onboarding-lista"
    />
  )
}

// Sin nadie con los filtros de la página: el vacío «Sin resultados» del sistema, con su ilustración.
function NoResults({ filtrosActivos, onLimpiar }: Omit<ViewProps, 'hires'>) {
  return (
    <Card>
      <SinResultados filtrosActivos={filtrosActivos} onLimpiar={onLimpiar} />
    </Card>
  )
}

export function BoardView({ hires, filtrosActivos, onLimpiar }: ViewProps) {
  if (!hires.length) return <NoResults filtrosActivos={filtrosActivos} onLimpiar={onLimpiar} />

  return (
    <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
      {STAGES.map((stage) => {
        const column = hires.filter((hire) => hire.stage === stage)
        return (
          <div key={stage} className="flex flex-col gap-2 rounded-xl bg-muted/50 p-2">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm font-medium">{stage}</span>
              <Badge variant="secondary" size="xs" className="tabular-nums">
                {column.length}
              </Badge>
            </div>
            {column.length ? (
              column.map((hire) => (
                <Card key={hire.id} className="cursor-pointer gap-3 py-3.5" onClick={() => notify(`Onboarding de ${hire.name}`, undefined, 'info')}>
                  <CardContent className="flex flex-col gap-3 px-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-col gap-1">
                        {/* La tarjeta entera se abre con clic; con teclado, desde el nombre (su clic sube a la tarjeta). */}
                        <Button variant="link" className="h-auto! p-0! font-medium! text-foreground! no-underline! hover:underline! justify-start truncate text-sm!">
                          {hire.name}
                        </Button>
                        <span className="truncate text-xs text-muted-foreground">{hire.role}</span>
                      </div>
                      <Avatar size="sm">
                        <AvatarFallback>{initials(hire.owner)}</AvatarFallback>
                      </Avatar>
                    </div>
                    {stage !== 'Por iniciar' ? <Progress value={hire.progress} aria-label={`Avance de ${hire.name}`} /> : null}
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="tabular-nums">Ingresa el {hire.day} sep</span>
                      {/* Variante suave, como en la lista: la sólida no llega a 4.5:1 en modo oscuro. */}
                      {hire.risk ? (
                        <Badge variant="destructive-light" size="xs" className="font-normal">
                          En riesgo
                        </Badge>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">Sin personas</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
// Septiembre de 2026 empieza en martes: un hueco antes del día 1.
const LEADING = 1
const DAYS = 30

export function CalendarView({ hires }: ViewProps) {
  const cells = Array.from({ length: 35 }, (_, i) => {
    const day = i - LEADING + 1
    return day >= 1 && day <= DAYS ? day : null
  })

  return (
    <Card className="gap-0! overflow-hidden py-0!">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <span className="text-sm font-medium">Septiembre 2026</span>
        <span className="text-xs text-muted-foreground">{hires.length} ingresos</span>
      </div>
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="px-3 py-2 text-xs text-muted-foreground">
            {weekday}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const entries = day ? hires.filter((hire) => hire.day === day) : []
          return (
            <div key={i} className={cn('flex min-h-28 flex-col gap-1 border-b p-2', i % 7 !== 6 && 'border-r', !day && 'bg-muted/30')}>
              {day ? (
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full text-xs tabular-nums',
                    day === TODAY ? 'bg-primary font-medium text-primary-foreground' : 'text-muted-foreground',
                  )}
                >
                  {day}
                </span>
              ) : null}
              {entries.map((hire) => (
                <Badge
                  key={hire.id}
                  variant={hire.risk ? 'destructive-light' : 'primary-light'}
                  render={<button type="button" />}
                  className={cn('h-auto! cursor-pointer justify-start truncate rounded-md! px-1.5! py-1! text-left font-normal!')}
                  onClick={() => notify(`Onboarding de ${hire.name}`, undefined, 'info')}
                  aria-label={`${hire.name}, ingresa el ${day} sep${hire.risk ? ', en riesgo' : ''}`}
                >
                  {hire.name}
                </Badge>
              ))}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
