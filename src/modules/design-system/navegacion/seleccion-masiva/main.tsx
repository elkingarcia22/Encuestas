import { createContext, useContext, useMemo, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon,
  Archive02Icon,
  Download04Icon,
  Mail01Icon,
  MoreHorizontalIcon,
  Mortarboard02Icon,
  UserGroupIcon,
  UserSwitchIcon,
} from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FloatingActionBar,
  Text,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { Persona } from '../../data-grid/casos/seguimiento'
import { SIN_ARRASTRE } from '../../data-grid/casos/sin-arrastre'
import { TablaDatos } from '../../data-grid/tabla-datos'
import { WS } from '../../drawers/components/drawer-styles'
import { DialogoConfirmar, RegistroConfirmar } from '../../estados/confirmaciones'
import { CaseFrame } from '../components/case-frame'
import { AREA_OPTIONS, PEOPLE, type Person } from './components/data'

type Filtro = { id: string; value: unknown }

// Lo que pregunta la ventana antes de una acción masiva.
type Pregunta = { titulo: string; descripcion: string; accion: string; aviso: string; destructiva?: boolean; icono: IconSvgElement }

const icon = (svg: typeof Mail01Icon) => <HugeiconsIcon icon={svg} size={16} />

// ── La tabla del sistema (decisión 1 de la auditoría, 5-oct): TablaDatos con su cabecera, filtros y orden por columna ──
// La casilla de cada fila no es la de la librería: aquí la selección sobrevive al cambiar de página y se puede extender a
// todas las personas filtradas («Seleccionar las 32»), y la tabla solo recibe las filas de la página. Por eso la columna
// de casillas es propia y lee la selección de un contexto (las columnas viven fuera del componente para que el filtro no
// se cierre al marcar).

type Seleccion = {
  marcadas: Set<number>
  alternar: (id: number) => void
  enPagina: number
  todaLaPagina: boolean
  alternarPagina: () => void
}

const SeleccionContexto = createContext<Seleccion>({
  marcadas: new Set(),
  alternar: () => undefined,
  enPagina: 0,
  todaLaPagina: false,
  alternarPagina: () => undefined,
})

function CasillaPagina() {
  const { enPagina, todaLaPagina, alternarPagina } = useContext(SeleccionContexto)
  return (
    <Checkbox
      checked={todaLaPagina}
      indeterminate={enPagina > 0 && !todaLaPagina}
      onCheckedChange={alternarPagina}
      aria-label="Seleccionar esta página"
    />
  )
}

function CasillaFila({ persona }: { persona: Person }) {
  const { marcadas, alternar } = useContext(SeleccionContexto)
  return <Checkbox checked={marcadas.has(persona.id)} onCheckedChange={() => alternar(persona.id)} aria-label={`Seleccionar a ${persona.name}`} />
}

// Lo de una sola persona va en el «⋯» de su fila; lo de varias, en la barra flotante.
function MenuPersona({ persona }: { persona: Person }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono className={WS} aria-label={`Acciones de ${persona.name}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => notify(`Perfil de ${persona.name}`, undefined, 'info')}>Ver perfil</DropdownMenuItem>
        <DropdownMenuItem onClick={() => notify(`Mensaje para ${persona.name}`, undefined, 'info')}>Enviar mensaje</DropdownMenuItem>
        <DropdownMenuItem onClick={() => notify(`Curso asignado a ${persona.name}`, undefined, 'success')}>Asignar curso</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const COLUMNAS: DataGridListConfig<Person>['columns'] = [
  {
    id: 'seleccion',
    header: () => <CasillaPagina />,
    size: 48,
    enableSorting: false,
    enableResizing: false,
    enableHiding: false,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <CasillaFila persona={row.original} />,
  },
  { accessorKey: 'name', header: 'Persona', size: 270, cell: ({ row }) => <Persona nombre={row.original.name} detalle={row.original.email} /> },
  {
    accessorKey: 'role',
    header: 'Cargo',
    size: 210,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col gap-1">
        <Text as="span" size="sm" className="truncate">
          {row.original.role}
        </Text>
        <Text as="span" variant="muted" size="xs" className="truncate">
          {row.original.area}
        </Text>
      </div>
    ),
  },
  { accessorKey: 'site', header: 'Sede', size: 130, cell: ({ row }) => <Text as="span" size="sm">{row.original.site}</Text> },
  {
    accessorKey: 'status',
    header: 'Estado',
    size: 150,
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'Activo' ? 'secondary' : 'outline'} className="font-normal">
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: 'joined',
    header: 'Ingreso',
    size: 130,
    cell: ({ row }) => (
      <Text as="span" variant="muted" size="sm" className="tabular-nums">
        {row.original.joined}
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
    cell: ({ row }) => <MenuPersona persona={row.original} />,
  },
]

const opciones = (valores: string[]) => [...new Set(valores)].sort().map((valor) => ({ label: valor, value: valor }))

// El área no tiene columna propia: va bajo el cargo, así que su filtro vive en la columna «Cargo».
const FILTROS: DataGridListConfig<Person>['columnFilters'] = [
  { id: 'area', columnId: 'role', label: 'Área', type: 'select', multiple: true, options: AREA_OPTIONS.filter((o) => o.value !== 'todas') },
  { id: 'site', label: 'Sede', type: 'select', multiple: true, options: opciones(PEOPLE.map((p) => p.site)) },
  { id: 'status', label: 'Estado', type: 'select', multiple: true, options: opciones(PEOPLE.map((p) => p.status)) },
]

const ORDEN: Record<string, (p: Person) => string | number> = {
  name: (p) => p.name,
  role: (p) => p.role,
  site: (p) => p.site,
  status: (p) => p.status,
  joined: (p) => p.joinedOrder,
}

// Patrón · Selección masiva: elegir filas en una tabla paginada y actuar sobre todas desde una barra flotante.
export function Component() {
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  // Cambia para volver a montar la tabla: así «Limpiar» también vacía su buscador y sus filtros.
  const [version, setVersion] = useState(0)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [pregunta, setPregunta] = useState<Pregunta | null>(null)

  const filtered = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    // La librería avisa el filtro con el id de la columna («role» para el de área).
    const marcados = (...ids: string[]) => {
      const valor = filtros.find((f) => ids.includes(f.id))?.value
      return Array.isArray(valor) ? valor.map(String) : []
    }
    const areas = marcados('area', 'role')
    const sedes = marcados('site')
    const estados = marcados('status')
    const filas = PEOPLE.filter(
      (person) =>
        (!q || person.name.toLowerCase().includes(q) || person.role.toLowerCase().includes(q)) &&
        (!areas.length || areas.includes(person.area)) &&
        (!sedes.length || sedes.includes(person.site)) &&
        (!estados.length || estados.includes(person.status)),
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
  }, [busqueda, filtros, orden])
  const pages = Math.max(1, Math.ceil(filtered.length / porPagina))
  const current = Math.min(pagina, pages)
  const rows = filtered.slice((current - 1) * porPagina, current * porPagina)

  const onPage = rows.filter((row) => selected.has(row.id)).length
  const allOnPage = rows.length > 0 && onPage === rows.length
  const allFiltered = filtered.length > 0 && filtered.every((person) => selected.has(person.id))

  const update = (change: (next: Set<number>) => void) =>
    setSelected((prev) => {
      const next = new Set(prev)
      change(next)
      return next
    })
  const toggle = (id: number) => update((next) => (next.has(id) ? next.delete(id) : next.add(id)))
  const togglePage = () => update((next) => rows.forEach((row) => (allOnPage ? next.delete(row.id) : next.add(row.id))))
  const clear = () => setSelected(new Set())
  const personasTexto = `${selected.size} ${selected.size === 1 ? 'persona' : 'personas'}`
  const act = (label: string) => () => notify(`${label} · ${personasTexto}`, undefined, 'success')
  // 13-oct (regla «preguntar-antes»): lo que le llega a otras personas, o las desactiva, pregunta antes con DialogoConfirmar
  // y la tarjeta de lo que se toca, que dice a cuántas personas. Exportar no afecta a nadie: va directo.
  const pedir = (nueva: Pregunta) => () => setPregunta(nueva)

  const filtrosPuestos = filtros.filter((f) => Array.isArray(f.value) && f.value.length > 0).length
  const filtrando = Boolean(busqueda.trim()) || filtrosPuestos > 0
  const limpiar = () => {
    setBusqueda('')
    setFiltros([])
    setPagina(1)
    setVersion((v) => v + 1)
  }

  const config: DataGridListConfig<Person> = {
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
      placeholder: 'Buscar por nombre o cargo',
      onSearch: (q) => {
        setBusqueda(q)
        setPagina(1)
      },
    },
    // Conteo en vivo arriba a la izquierda: cuántas hay marcadas y cuántas personas quedan con la búsqueda.
    frame: selected.size ? { description: `${selected.size} ${selected.size === 1 ? 'seleccionada' : 'seleccionadas'} · ${filtered.length} personas` } : undefined,
    // Los dos vacíos del sistema, con ilustración.
    emptyState: filtrando
      ? { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={filtrosPuestos} onLimpiar={limpiar} /> }
      : {
          type: 'empty',
          customComponent: (
            <PrimeraVez
              icono="glass-profile"
              titulo="Todavía no hay colaboradores"
              descripcion="Agrega a las personas de tu empresa una por una o impórtalas desde Excel."
              accion={{ texto: 'Agregar colaborador', icono: Add01Icon, onClick: () => notify('Agregar colaborador', undefined, 'info') }}
            />
          ),
        },
  }

  return (
    <CaseFrame title="Selección masiva" hint="Elegir varias filas y actuar sobre todas a la vez">
      <PageShell>
        <PageHeader
          breadcrumbs={[{ label: 'Inicio', path: '/admin' }, { label: 'Personas' }, { label: 'Colaboradores' }]}
          title="Colaboradores"
          description="Todas las personas de Meta Colombia. Selecciona varias para asignarles cursos, escribirles o moverlas de grupo."
          actions={
            <>
              <Button data-region="Botón secundario" variant="outline" className={WS} onClick={() => notify('Importar colaboradores desde Excel', undefined, 'info')}>
                <HugeiconsIcon icon={Download04Icon} size={16} />
                Importar
              </Button>
              <Button data-region="Botón primario" className={WS} onClick={() => notify('Agregar colaborador', undefined, 'info')}>
                <HugeiconsIcon icon={Add01Icon} size={16} />
                Agregar colaborador
              </Button>
            </>
          }
        />

        <PageContent>
          {allOnPage && filtered.length > rows.length ? (
            <div data-region="Aviso de selección" className="flex flex-wrap items-center justify-center gap-x-2 rounded-lg bg-muted/50 px-4 py-2">
              {allFiltered ? (
                <>
                  <Text as="span" size="sm">
                    Las {filtered.length} personas están seleccionadas.
                  </Text>
                  <Button variant="link" size="sm" className="h-auto px-0" onClick={clear}>
                    Quitar selección
                  </Button>
                </>
              ) : (
                <>
                  <Text as="span" size="sm">
                    Seleccionaste las {rows.length} personas de esta página.
                  </Text>
                  <Button variant="link" size="sm" className="h-auto px-0" onClick={() => update((next) => filtered.forEach((p) => next.add(p.id)))}>
                    Seleccionar las {filtered.length}
                  </Button>
                </>
              )}
            </div>
          ) : null}

          <SeleccionContexto.Provider value={{ marcadas: selected, alternar: toggle, enPagina: onPage, todaLaPagina: allOnPage, alternarPagina: togglePage }}>
            <TablaDatos
              key={version}
              config={config}
              data={rows}
              paginacion={{ pagina: current, setPagina, porPagina, setPorPagina, total: filtered.length }}
              nombre="personas"
              singular="persona"
              id="colaboradores-seleccion"
            />
          </SeleccionContexto.Provider>

          {selected.size ? <div className="h-16" aria-hidden /> : null}
        </PageContent>

      </PageShell>

      {/* La acción principal de la barra trae `text-white` fijo sobre `bg-primary`; en oscuro el azul del tema es claro y
          da 2.8:1. Se usa el color de texto del botón primario del tema (pendiente de reportar a librería). */}
      <div className="contents [&_button.bg-primary]:text-primary-foreground!">
      <FloatingActionBar
        hidden={selected.size === 0}
        position="fixed"
        offset={24}
        selectionCount={selected.size}
        onClearSelection={clear}
        labels={{
          toolbar: 'Acciones sobre la selección',
          selectionCount: (count) => `${count} ${count === 1 ? 'seleccionada' : 'seleccionadas'}`,
          clearSelection: 'Quitar selección',
          collapse: 'Contraer',
          expand: 'Expandir',
          moreActions: 'Más acciones',
          actionWithCount: (label, count) => `${label} (${count})`,
        }}
        primaryAction={{
          id: 'curso',
          label: 'Asignar curso',
          icon: icon(Mortarboard02Icon),
          onClick: pedir({ titulo: '¿Asignar el curso?', descripcion: `Lo ven ${personasTexto} en su Zona de estudio desde hoy.`, accion: `Asignar a ${personasTexto}`, aviso: 'Curso asignado', icono: Mortarboard02Icon }),
        }}
        items={[
          {
            id: 'mensaje',
            label: 'Enviar mensaje',
            icon: icon(Mail01Icon),
            onClick: pedir({ titulo: '¿Enviar el mensaje?', descripcion: `Les llega por correo a ${personasTexto}. Un correo enviado no se puede recoger.`, accion: `Enviar a ${personasTexto}`, aviso: 'Mensaje enviado', icono: Mail01Icon }),
          },
          {
            id: 'grupo',
            label: 'Agregar a grupo',
            icon: icon(UserGroupIcon),
            options: [
              { id: 'lideres', title: 'Programa de líderes', description: '24 personas', onClick: pedir({ titulo: '¿Agregar al grupo?', descripcion: `Entran a Programa de líderes y reciben sus planes de formación.`, accion: `Agregar a ${personasTexto}`, aviso: 'Agregadas a Programa de líderes', icono: UserGroupIcon }) },
              { id: 'induccion', title: 'Inducción 2026', description: '58 personas', onClick: pedir({ titulo: '¿Agregar al grupo?', descripcion: `Entran a Inducción 2026 y reciben sus planes de formación.`, accion: `Agregar a ${personasTexto}`, aviso: 'Agregadas a Inducción 2026', icono: UserGroupIcon }) },
            ],
          },
          { type: 'separator', id: 'sep' },
          { id: 'exportar', label: 'Exportar', icon: icon(Download04Icon), onClick: act('Exportadas') },
        ]}
        overflowActions={[
          { id: 'responsable', label: 'Cambiar jefe directo', icon: icon(UserSwitchIcon), onClick: pedir({ titulo: '¿Cambiar el jefe directo?', descripcion: `Cambia quién ve el avance de ${personasTexto} y les avisa por correo.`, accion: `Cambiar a ${personasTexto}`, aviso: 'Jefe directo actualizado', icono: UserSwitchIcon }) },
          { id: 'desactivar', label: 'Desactivar', icon: icon(Archive02Icon), variant: 'destructive', onClick: pedir({ titulo: '¿Desactivar a las personas?', descripcion: `Dejan de entrar a la plataforma. Su avance se conserva y se pueden reactivar después.`, accion: `Desactivar a ${personasTexto}`, aviso: 'Personas desactivadas', destructiva: true, icono: Archive02Icon }) },
        ]}
      />
      </div>

      <DialogoConfirmar
        abierto={pregunta !== null}
        onAbiertoChange={(abrir) => {
          if (!abrir) setPregunta(null)
        }}
        icono={pregunta?.icono}
        titulo={pregunta?.titulo ?? ''}
        descripcion={pregunta?.descripcion ?? ''}
        cancelar="Todavía no"
        accion={pregunta?.accion ?? ''}
        destructiva={pregunta?.destructiva}
        onConfirmar={() => {
          const hecha = pregunta
          setPregunta(null)
          if (hecha) notify(hecha.aviso, personasTexto, 'success')
        }}
      >
        <RegistroConfirmar nombre="Colaboradores seleccionados" detalle={`${personasTexto} de ${filtered.length}`} estado={personasTexto} tono="neutro" icono={UserGroupIcon} />
      </DialogoConfirmar>
    </CaseFrame>
  )
}

Component.displayName = 'NavigationBulkPage'
