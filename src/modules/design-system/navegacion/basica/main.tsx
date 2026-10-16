import { createContext, useContext, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Download04Icon, MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { CeldaTitulo } from '../../data-grid/celda-titulo'
import { Persona } from '../../data-grid/casos/seguimiento'
import { SIN_ARRASTRE } from '../../data-grid/casos/sin-arrastre'
import { TablaDatos } from '../../data-grid/tabla-datos'
import { WS } from '../../drawers/components/drawer-styles'
import { CaseFrame } from '../components/case-frame'

type Status = 'abiertas' | 'borradores' | 'cerradas'
type Filtro = { id: string; value: unknown }

// `days`: hace cuántos días se tocó, para ordenar la columna «Actualizada».
type Vacancy = { name: string; area: string; stage: string; status: Status; candidates: number; owner: string; updated: string; days: number }

const VACANCIES: Vacancy[] = [
  { name: 'Analista de datos', area: 'Analítica', stage: 'Entrevistas', status: 'abiertas', candidates: 18, owner: 'Laura Méndez', updated: 'Hoy, 9:40', days: 0 },
  { name: 'Ejecutivo comercial B2B', area: 'Ventas', stage: 'Filtro inicial', status: 'abiertas', candidates: 42, owner: 'Andrés Pardo', updated: 'Ayer', days: 1 },
  { name: 'Coordinador de bodega', area: 'Operaciones', stage: 'Oferta', status: 'abiertas', candidates: 7, owner: 'Sara Gómez', updated: 'Hace 2 días', days: 2 },
  { name: 'Diseñador de producto', area: 'Tecnología', stage: 'Publicada', status: 'abiertas', candidates: 3, owner: 'Laura Méndez', updated: 'Hace 3 días', days: 3 },
  { name: 'Líder de nómina', area: 'Gestión humana', stage: 'Borrador', status: 'borradores', candidates: 0, owner: 'Sara Gómez', updated: '12 sep', days: 23 },
  { name: 'Analista contable', area: 'Finanzas', stage: 'Contratada', status: 'cerradas', candidates: 26, owner: 'Andrés Pardo', updated: '2 sep', days: 33 },
  { name: 'Técnico de mantenimiento', area: 'Operaciones', stage: 'Cancelada', status: 'cerradas', candidates: 11, owner: 'Laura Méndez', updated: '28 ago', days: 38 },
]

const TABS: { value: Status | 'todas'; label: string }[] = [
  { value: 'abiertas', label: 'Abiertas' },
  { value: 'borradores', label: 'Borradores' },
  { value: 'cerradas', label: 'Cerradas' },
  { value: 'todas', label: 'Todas' },
]

// «Primera vez» de cada pestaña: lo que todavía no hay.
const VACIO: Record<Status | 'todas', string> = {
  abiertas: 'Todavía no hay vacantes abiertas',
  borradores: 'Todavía no hay borradores',
  cerradas: 'Todavía no hay vacantes cerradas',
  todas: 'Todavía no hay vacantes',
}

// ── La tabla del sistema (decisión 1 de la auditoría, 5-oct): TablaDatos con la cabecera de Vacantes ──
// Conteo a la izquierda, buscador a la derecha, filtro y orden en cada columna, «Acciones» con el «⋯» y el paginador del
// sistema dentro del marco. Las columnas y los filtros viven fuera del componente (si no, el filtro se cierra al marcar);
// lo que la fila le pide a la pantalla —abrir la vacante— le llega por contexto.

const AbrirVacante = createContext<(vacante: Vacancy) => void>(() => undefined)

function NombreVacante({ vacante }: { vacante: Vacancy }) {
  const abrir = useContext(AbrirVacante)
  return <CeldaTitulo titulo={vacante.name} detalle={vacante.area} onClick={() => abrir(vacante)} />
}

function MenuVacante({ vacante }: { vacante: Vacancy }) {
  const abrir = useContext(AbrirVacante)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono className={WS} aria-label={`Acciones de ${vacante.name}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => abrir(vacante)}>Ver vacante</DropdownMenuItem>
        <DropdownMenuItem onClick={() => notify('Duplicada')}>Duplicar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => notify('Enlace copiado')}>Copiar enlace</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => notify('Vacante archivada')}>
          Archivar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const COLUMNAS: DataGridListConfig<Vacancy>['columns'] = [
  { accessorKey: 'name', header: 'Vacante', size: 250, cell: ({ row }) => <NombreVacante vacante={row.original} /> },
  {
    accessorKey: 'stage',
    header: 'Etapa',
    size: 150,
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'abiertas' ? 'secondary' : 'outline'} className="font-normal">
        {row.original.stage}
      </Badge>
    ),
  },
  {
    accessorKey: 'candidates',
    header: 'Candidatos',
    size: 130,
    cell: ({ row }) => (
      <Text as="span" size="sm" className="tabular-nums">
        {row.original.candidates}
      </Text>
    ),
  },
  { accessorKey: 'owner', header: 'Responsable', size: 200, cell: ({ row }) => <Persona nombre={row.original.owner} /> },
  {
    accessorKey: 'updated',
    header: 'Actualizada',
    size: 140,
    cell: ({ row }) => (
      <Text as="span" variant="muted" size="sm">
        {row.original.updated}
      </Text>
    ),
  },
  {
    id: 'acciones',
    header: 'Acciones',
    size: 96,
    enableSorting: false,
    enableResizing: false,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <MenuVacante vacante={row.original} />,
  },
]

const opciones = (valores: string[]) => [...new Set(valores)].map((valor) => ({ label: valor, value: valor }))

const FILTROS: DataGridListConfig<Vacancy>['columnFilters'] = [
  { id: 'stage', label: 'Etapa', type: 'select', multiple: true, options: opciones(VACANCIES.map((v) => v.stage)) },
  { id: 'owner', label: 'Responsable', type: 'select', multiple: true, options: opciones(VACANCIES.map((v) => v.owner)) },
]

const ORDEN: Record<string, (v: Vacancy) => string | number> = {
  name: (v) => v.name,
  stage: (v) => v.stage,
  candidates: (v) => v.candidates,
  owner: (v) => v.owner,
  updated: (v) => -v.days,
}

// Patrón · Shell básico: la pantalla de lista más común del Workspace.
export function Component() {
  const [tab, setTab] = useState<Status | 'todas'>('abiertas')
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  // Cambia para volver a montar la tabla: así «Limpiar» también vacía su buscador y sus filtros.
  const [version, setVersion] = useState(0)

  const count = (value: Status | 'todas') => (value === 'todas' ? VACANCIES.length : VACANCIES.filter((v) => v.status === value).length)

  const resultado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const marcados = (id: string) => {
      const valor = filtros.find((f) => f.id === id)?.value
      return Array.isArray(valor) ? valor.map(String) : []
    }
    const etapas = marcados('stage')
    const responsables = marcados('owner')
    const filas = VACANCIES.filter(
      (v) =>
        (tab === 'todas' || v.status === tab) &&
        (!q || v.name.toLowerCase().includes(q) || v.owner.toLowerCase().includes(q) || v.area.toLowerCase().includes(q)) &&
        (!etapas.length || etapas.includes(v.stage)) &&
        (!responsables.length || responsables.includes(v.owner)),
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
  }, [tab, busqueda, filtros, orden])
  const visibles = resultado.slice((pagina - 1) * porPagina, pagina * porPagina)

  const filtrosPuestos = filtros.filter((f) => Array.isArray(f.value) && f.value.length > 0).length
  const filtrando = Boolean(busqueda.trim()) || filtrosPuestos > 0
  const limpiar = () => {
    setBusqueda('')
    setFiltros([])
    setPagina(1)
    setVersion((v) => v + 1)
  }

  const config: DataGridListConfig<Vacancy> = {
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
      placeholder: 'Buscar vacante o responsable',
      onSearch: (q) => {
        setBusqueda(q)
        setPagina(1)
      },
    },
    // Los dos vacíos del sistema, con ilustración: «Sin resultados» si la búsqueda o un filtro dejan fuera todo, y
    // «Primera vez» si la pestaña todavía no tiene vacantes.
    emptyState: filtrando
      ? { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={filtrosPuestos} onLimpiar={limpiar} /> }
      : {
          type: 'empty',
          customComponent: (
            <PrimeraVez
              icono="glass-add"
              titulo={VACIO[tab]}
              descripcion="Publica una vacante y sigue aquí a sus candidatos, etapa por etapa."
              accion={{ texto: 'Nueva vacante', icono: Add01Icon, onClick: () => notify('Nueva vacante') }}
            />
          ),
        },
  }

  return (
    <CaseFrame title="Shell básico" hint="Listas y pantallas de entrada a una sección">
      <PageShell>
        <PageHeader
          breadcrumbs={[{ label: 'Inicio', path: '/admin' }, { label: 'Selección' }, { label: 'Vacantes' }]}
          title="Vacantes"
          description="Publica, sigue y cierra los procesos de selección de tu empresa."
          actions={
            <>
              {/* El «⋯» va primero y su menú abre hacia adentro de la fila (decisión 15 de la auditoría). */}
              <DropdownMenu>
                <DropdownMenuTrigger render={<BotonIcono size="icon" className={WS} aria-label="Más acciones" />}>
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={18} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => notify('Configurar etapas del proceso')}>Configurar etapas</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => notify('Plantillas de vacante')}>Plantillas de vacante</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => notify('Vacantes archivadas')}>Ver archivadas</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button data-region="Botón secundario" variant="outline" className={WS} onClick={() => notify('Exportando vacantes a Excel')}>
                <HugeiconsIcon icon={Download04Icon} size={16} />
                Exportar
              </Button>
              <Button data-region="Botón primario" className={WS} onClick={() => notify('Nueva vacante')}>
                <HugeiconsIcon icon={Add01Icon} size={16} />
                Nueva vacante
              </Button>
            </>
          }
          tabs={
            <Tabs
              value={tab}
              onValueChange={(value) => {
                setTab(value as Status | 'todas')
                setPagina(1)
              }}
            >
              <TabsList variant="line">
                {TABS.map((item) => (
                  <TabsTrigger key={item.value} value={item.value} className="flex-none gap-2 px-3">
                    {item.label}
                    <Badge variant="secondary" size="xs" className="tabular-nums">
                      {count(item.value)}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          }
        />

        <PageContent>
          <AbrirVacante.Provider value={(vacante) => notify(`Abrir «${vacante.name}»`)}>
            <TablaDatos
              key={version}
              config={config}
              data={visibles}
              paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: resultado.length }}
              nombre="vacantes"
              singular="vacante"
              id="vacantes-basica"
            />
          </AbrirVacante.Provider>
        </PageContent>

      </PageShell>
    </CaseFrame>
  )
}

Component.displayName = 'NavigationBasicPage'
