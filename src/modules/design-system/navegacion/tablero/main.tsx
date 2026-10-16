import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  ArrowDown01Icon,
  Calendar03Icon,
  Cancel01Icon,
  Download04Icon,
  KanbanIcon,
  ListViewIcon,
} from '@hugeicons/core-free-icons'
import { Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger, Tabs, TabsList, TabsTrigger, ToggleGroup, ToggleGroupItem } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { Indicadores } from '../../metricas/cifras'
import { WS } from '../../drawers/components/drawer-styles'
import { CaseFrame } from '../components/case-frame'
import { AREAS, HIRES, STAGES, type Hire, type Stage } from './components/data'
import { BoardView, CalendarView, ListView } from './components/views'

type View = 'lista' | 'tablero' | 'calendario'
type Saved = 'todas' | 'equipo' | 'riesgo'
type Filters = { area: string | null; stage: Stage | null }

const PERIODS = ['Este mes', 'Próximos 30 días', 'Este trimestre']

const SAVED: { value: Saved; label: string; match: (hire: Hire) => boolean }[] = [
  { value: 'todas', label: 'Todas', match: () => true },
  { value: 'equipo', label: 'Mi equipo', match: (hire) => hire.myTeam },
  { value: 'riesgo', label: 'En riesgo', match: (hire) => hire.risk },
]

const VIEWS: { value: View; label: string; icon: typeof ListViewIcon }[] = [
  { value: 'lista', label: 'Lista', icon: ListViewIcon },
  { value: 'tablero', label: 'Tablero', icon: KanbanIcon },
  { value: 'calendario', label: 'Calendario', icon: Calendar03Icon },
]

// Patrón · Tablero con vistas: los mismos datos en lista, tablero o calendario, con vistas guardadas y filtros.
export function Component() {
  const [period, setPeriod] = useState(PERIODS[0])
  const [saved, setSaved] = useState<Saved>('todas')
  const [view, setView] = useState<View>('lista')
  const [filters, setFilters] = useState<Filters>({ area: null, stage: 'En curso' })

  const savedMatch = SAVED.find((item) => item.value === saved)!.match
  const hires = HIRES.filter(
    (hire) => savedMatch(hire) && (!filters.area || hire.area === filters.area) && (!filters.stage || hire.stage === filters.stage),
  )

  const chips = [
    filters.area ? { key: 'area' as const, label: `Área: ${filters.area}` } : null,
    filters.stage ? { key: 'stage' as const, label: `Etapa: ${filters.stage}` } : null,
  ].filter((chip) => chip !== null)

  const scoped = HIRES.filter(savedMatch)
  // Las cifras van en la fila partida del sistema (Indicadores, decisión 11 de la auditoría), sin variación.
  const kpis = [
    { etiqueta: 'Ingresos del mes', valor: String(scoped.length), detalle: 'personas en septiembre' },
    { etiqueta: 'En curso', valor: String(scoped.filter((h) => h.stage === 'En curso' || h.stage === 'Por cerrar').length), detalle: 'con tareas abiertas' },
    { etiqueta: 'En riesgo', valor: String(scoped.filter((h) => h.risk).length), detalle: 'atrasados más de 3 días' },
    {
      etiqueta: 'Avance promedio',
      valor: `${Math.round(scoped.reduce((sum, h) => sum + h.progress, 0) / Math.max(scoped.length, 1))}%`,
      detalle: 'de las tareas de ingreso',
    },
  ]
  const clearFilters = () => setFilters({ area: null, stage: null })

  return (
    <CaseFrame title="Tablero con vistas" hint="Seguir muchos registros cambiando de vista y de filtros" width="default">
      <PageShell width="default">
        <PageHeader
          tabsRegion="Vistas guardadas"
          breadcrumbs={[{ label: 'Inicio', path: '/admin' }, { label: 'Selección' }, { label: 'Onboarding' }]}
          title="Onboarding"
          description="Sigue el ingreso de las personas nuevas desde la firma del contrato hasta su primer mes."
          actions={
            <>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" className={WS} />}>
                  <HugeiconsIcon icon={Calendar03Icon} size={16} />
                  {period}
                  <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuRadioGroup value={period} onValueChange={setPeriod}>
                    {PERIODS.map((option) => (
                      <DropdownMenuRadioItem key={option} value={option}>
                        {option}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button data-region="Botón secundario" variant="outline" className={WS} onClick={() => notify('Exportando onboarding a Excel')}>
                <HugeiconsIcon icon={Download04Icon} size={16} />
                Exportar
              </Button>
              <Button data-region="Botón primario" className={WS} onClick={() => notify('Nuevo ingreso')}>
                <HugeiconsIcon icon={Add01Icon} size={16} />
                Nuevo ingreso
              </Button>
            </>
          }
          tabs={
            // «+ Vista» va al lado de la lista de pestañas y no adentro (un botón no puede ser hijo de un tablist). La fila
            // que lo lleva sigue la línea de la lista hasta el borde, así se ve igual que antes.
            <Tabs value={saved} onValueChange={(value) => setSaved(value as Saved)} className="flex-row! flex-wrap gap-0!">
              <TabsList variant="line" className="w-auto!">
                {SAVED.map((item) => (
                  <TabsTrigger key={item.value} value={item.value} className="flex-none gap-2 px-3">
                    {item.label}
                    <Badge variant="secondary" size="xs" className="tabular-nums">
                      {HIRES.filter(item.match).length}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="flex h-9 flex-1 items-center border-b border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-1 ml-1 text-muted-foreground!"
                  onClick={() => notify('Guardar los filtros actuales como vista')}
                >
                  <HugeiconsIcon icon={Add01Icon} size={14} />
                  Vista
                </Button>
              </div>
            </Tabs>
          }
        />

        <PageContent>
          <Indicadores cifras={kpis} />

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <Badge key={chip.key} variant="secondary" className="gap-1 pr-1 font-normal">
                  {chip.label}
                  <BotonIcono
                    size="icon-xs"
                    aria-label={`Quitar ${chip.label}`}
                    className="size-4! hover:bg-foreground/10!"
                    onClick={() => setFilters((current) => ({ ...current, [chip.key]: null }))}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={12} />
                  </BotonIcono>
                </Badge>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="text-muted-foreground!" />}>
                  <HugeiconsIcon icon={Add01Icon} size={14} />
                  Agregar filtro
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Área</DropdownMenuLabel>
                    {AREAS.map((area) => (
                      <DropdownMenuItem key={area} onClick={() => setFilters((current) => ({ ...current, area }))}>
                        {area}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Etapa</DropdownMenuLabel>
                    {STAGES.map((stage) => (
                      <DropdownMenuItem key={stage} onClick={() => setFilters((current) => ({ ...current, stage }))}>
                        {stage}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              {chips.length ? (
                <Button variant="ghost" size="sm" className="text-muted-foreground!" onClick={clearFilters}>
                  Limpiar
                </Button>
              ) : null}
            </div>

            {/* En la lista el conteo ya va arriba de la tabla, a la izquierda: aquí solo en el tablero y el calendario. */}
            <span role="status" className="ml-auto text-sm text-muted-foreground tabular-nums">
              {view === 'lista' ? null : `${hires.length} ${hires.length === 1 ? 'persona' : 'personas'}`}
            </span>
            <ToggleGroup
              data-region="Cambio de vista"
              aria-label="Cambio de vista"
              value={[view]}
              onValueChange={(value) => value.length && setView(value[0] as View)}
              variant="outline"
              size="sm"
            >
              {VIEWS.map((item) => (
                <ToggleGroupItem key={item.value} value={item.value} aria-label={item.label} className="gap-1.5 px-3">
                  <HugeiconsIcon icon={item.icon} size={16} />
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {view === 'lista' ? <ListView hires={hires} filtrosActivos={chips.length} onLimpiar={clearFilters} /> : null}
          {view === 'tablero' ? <BoardView hires={hires} filtrosActivos={chips.length} onLimpiar={clearFilters} /> : null}
          {view === 'calendario' ? <CalendarView hires={hires} filtrosActivos={chips.length} onLimpiar={clearFilters} /> : null}
        </PageContent>

      </PageShell>
    </CaseFrame>
  )
}

Component.displayName = 'NavigationDashboardPage'
