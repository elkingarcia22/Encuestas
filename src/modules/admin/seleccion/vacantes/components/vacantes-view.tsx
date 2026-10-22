import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  HelpCircleIcon,
  PlusSignIcon,
  Download01Icon,
  ViewIcon,
  Edit02Icon,
  Archive02Icon,
} from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Button,
  Field,
  FieldLabel,
  Heading,
  Input,
  Text,
  DataGridList,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { Badge } from '@/shared/components/Badge'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { WelcomeDialog } from '@/shared/components/Announcements'
import { notify } from '@/shared/components/notify'

// Candidatos de ejemplo del detalle de vacante (los mismos del prototipo).
const CANDIDATES = [
  { ini: 'AM', title: 'Andrés Malo', meta: 'Entrevista técnica' },
  { ini: 'LC', title: 'Lucía Cifuentes', meta: 'Filtro inicial' },
  { ini: 'JR', title: 'Julián Rey', meta: 'Prueba enviada' },
]

type Vacante = {
  title: string
  stage: string
  owner: string
  open: boolean
}

const VACANTES: Vacante[] = [
  { title: 'Analista de datos', stage: 'Entrevistas', owner: 'Laura M.', open: true },
  { title: 'Analista financiero', stage: 'Filtro inicial', owner: 'Andrés P.', open: true },
  { title: 'Coordinador de turno', stage: 'Oferta', owner: 'Laura M.', open: true },
  { title: 'Auxiliar de bodega', stage: 'Publicada', owner: 'Sara G.', open: true },
  { title: 'Jefe de planta', stage: 'Cerrada', owner: 'Sara G.', open: false },
]

const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

// Vacantes con detalle armado (/admin/seleccion/vacantes/:id): su fila lleva a esa pantalla; las demás
// siguen abriendo el resumen rápido.
const DETALLE: Record<string, string> = {
  'Analista de datos': 'analista-de-datos',
  'Coordinador de turno': 'coordinador-de-turno',
}

// Selección › Vacantes: lista con DataGridList y acciones
export function VacantesView() {
  const navigate = useNavigate()
  
  const [rows, setRows] = useState<Vacante[]>(VACANTES)
  const [create, setCreate] = useState(false)
  const [welcome, setWelcome] = useState(false)
  const [vacante, setVacante] = useState({ title: '', stage: '', owner: '' })
  const [vacanteOpen, setVacanteOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [owner, setOwner] = useState('')

  // DataGridList local state
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [filtros, setFiltros] = useState<{ id: string; value: unknown }[]>([])
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)

  // Las vacantes con detalle armado llevan a su pantalla; las demás abren el resumen rápido.
  const abrir = (v: Vacante) => {
    if (DETALLE[v.title]) {
      navigate(`/admin/seleccion/vacantes/${DETALLE[v.title]}`)
      return
    }
    setVacante(v)
    setVacanteOpen(true)
  }

  const crear = () => {
    if (!title.trim()) return
    setRows((r) => [{ title: title.trim(), stage: 'Borrador', owner: owner.trim() || 'Sin asignar', open: true }, ...r])
    setCreate(false)
    setTitle('')
    setOwner('')
    notify(`Vacante «${title.trim()}» creada como borrador`, undefined, 'success')
  }

  // Filtrado y ordenación locales para el DataGridList
  const resultado = useMemo(() => {
    let base = [...rows]
    
    // Búsqueda
    if (busqueda) {
      const q = busqueda.toLowerCase()
      base = base.filter((v) => v.title.toLowerCase().includes(q) || v.owner.toLowerCase().includes(q))
    }
    
    // Filtros
    for (const f of filtros) {
      const val = f.value
      if (val === undefined || val === null || val === '') continue
      if (f.id === 'open' && typeof val === 'string') {
        base = base.filter((v) => (val === 'Abiertas' ? v.open : !v.open))
      }
    }
    
    // Orden
    if (orden) {
      const desc = orden.startsWith('-')
      const campo = (desc ? orden.slice(1) : orden) as keyof Vacante
      base.sort((a, b) => {
        const valA = a[campo]
        const valB = b[campo]
        const comp = String(valA).localeCompare(String(valB), 'es')
        return desc ? -comp : comp
      })
    }
    return base
  }, [rows, busqueda, filtros, orden])

  const paginaActual = useMemo(() => resultado.slice((pagina - 1) * porPagina, pagina * porPagina), [resultado, pagina, porPagina])
  const hayFiltrosActivos = busqueda.trim() !== '' || filtros.length > 0
  
  const limpiarTodo = () => {
    setBusqueda('')
    setFiltros([])
    setPagina(1)
  }

  const COLUMNAS = useMemo<DataGridListConfig<Vacante>['columns']>(() => [
    {
      accessorKey: 'title',
      header: 'Vacante',
      size: 300,
      cell: ({ row }) => (
        <Button
          variant="link"
          className="h-auto! p-0! text-foreground! justify-start"
          onClick={(e) => {
            e.stopPropagation()
            abrir(row.original)
          }}
        >
          {row.original.title}
        </Button>
      ),
    },
    {
      accessorKey: 'stage',
      header: 'Etapa',
      size: 140,
      cell: ({ row }) => (
        <Badge variant={row.original.open ? 'secondary' : 'outline'}>
          {row.original.stage}
        </Badge>
      ),
    },
    {
      accessorKey: 'owner',
      header: 'Responsable',
      size: 200,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar size="sm" aria-hidden="true">
            <AvatarFallback>{initials(row.original.owner)}</AvatarFallback>
          </Avatar>
          <Text as="span" size="sm">{row.original.owner}</Text>
        </div>
      ),
    },
  ], [abrir])

  const FILTROS = useMemo<DataGridListConfig<Vacante>['columnFilters']>(() => [
    {
      id: 'open',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Abiertas', value: 'Abiertas' },
        { label: 'Cerradas', value: 'Cerradas' },
      ],
    },
  ], [])

  const emptyState: DataGridListConfig<Vacante>['emptyState'] = hayFiltrosActivos
    ? {
        // Vacíos con su ilustración glass (13-oct): sin resultados con «Limpiar», o todavía nada.
        type: 'no-results',
        customComponent: <SinResultados busqueda={busqueda} filtrosActivos={filtros.length} onLimpiar={limpiarTodo} />,
      }
    : {
        type: 'empty',
        customComponent: (
          <PrimeraVez
            icono="glass-bag"
            titulo="Todavía no hay vacantes"
            descripcion="Crea la primera vacante para empezar."
            accion={{ texto: 'Crear vacante', onClick: () => setCreate(true) }}
          />
        ),
      }

  const config: DataGridListConfig<Vacante> = {
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
      placeholder: 'Buscar vacante o responsable...',
      onSearch: (query) => {
        setBusqueda(query)
        setPagina(1)
      },
    },
    refresh: {
      onRefresh: () => notify('Lista actualizada', undefined, 'info'),
    },
    pagination: {
      total: resultado.length,
      current: pagina,
      pageSize: porPagina,
      onPageChange: setPagina,
      onPageSizeChange: (tamano) => {
        setPorPagina(tamano)
        setPagina(1)
      },
    },
    actions: {
      primary: {
        id: 'agregar',
        label: 'Crear vacante',
        icon: <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />,
        onClick: () => setCreate(true),
      },
      secondary: [
        {
          id: 'exportar',
          label: 'Exportar',
          variant: 'outline',
          icon: <HugeiconsIcon icon={Download01Icon} strokeWidth={2} aria-hidden="true" />,
          onClick: () => notify('Exportación generada', undefined, 'success'),
        },
      ],
      item: [
        {
          id: 'ver',
          label: 'Ver vacante',
          icon: <HugeiconsIcon icon={ViewIcon} strokeWidth={2} aria-hidden="true" />,
          onClick: (filas) => abrir(filas[0]),
        },
        {
          id: 'editar',
          label: 'Editar',
          icon: <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} aria-hidden="true" />,
          onClick: (filas) => notify(`Editando ${filas[0]?.title}`, undefined, 'info'),
        },
        {
          id: 'archivar',
          label: 'Archivar',
          variant: 'destructive',
          icon: <HugeiconsIcon icon={Archive02Icon} strokeWidth={2} aria-hidden="true" />,
          onClick: () => notify('Vacante archivada', undefined, 'success'),
        },
      ],
    },
    emptyState,
    layout: {
      reorderable: true,
      resizable: true,
    },
    frame: {
      toolbar: 'floating',
      toolbarPosition: 'absolute',
    },
  }

  return (
    // Contenedor de 1140 centrado, como el resto de pantallas.
    <div className="mx-auto flex w-full max-w-285 flex-col gap-6">
      <WelcomeDialog open={welcome} onOpenChange={setWelcome} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Heading level={1} className="text-3xl font-light tracking-tight">Vacantes</Heading>
          <Text variant="muted" aria-live="polite">{resultado.length} procesos · Selección</Text>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setWelcome(true)}>
            <HugeiconsIcon icon={HelpCircleIcon} size={16} aria-hidden="true" />
            ¿Cómo funciona?
          </Button>
        </div>
      </div>

      <DataGridList
        config={config}
        data={paginaActual}
      />

      <ActionDialog
        open={create}
        onOpenChange={setCreate}
        title="Crear vacante"
        sub="Queda en borrador hasta que la publiques."
        note="Selección · Meta Colombia"
        confirmLabel="Crear vacante"
        confirmDisabled={!title.trim()}
        onConfirm={crear}
      >
        <Field>
          <FieldLabel htmlFor="vacante-cargo">Nombre de la vacante</FieldLabel>
          <Input id="vacante-cargo" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Analista de operaciones" />
        </Field>
        <Field>
          <FieldLabel htmlFor="vacante-owner">Responsable</FieldLabel>
          <Input id="vacante-owner" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Laura M." />
        </Field>
      </ActionDialog>

      <ActionDialog
        open={vacanteOpen}
        onOpenChange={setVacanteOpen}
        title={vacante.title}
        sub={`${vacante.stage} · responsable ${vacante.owner}`}
        items={CANDIDATES}
        note="12 candidatos en total"
        cancelLabel="Cerrar"
      />
    </div>
  )
}
