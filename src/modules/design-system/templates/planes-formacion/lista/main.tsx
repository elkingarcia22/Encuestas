import { createContext, useContext, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, Edit02Icon, MoreHorizontalIcon, PlusSignIcon, ViewIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Progress,
  ProgressValue,
  Tabs,
  TabsContent,
  Text,
  toast,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { AgentePlanes, useAgente } from '@/modules/admin/aprendizaje/planes-de-formacion/components/agente-aprendizaje'
import { ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'

import { ConfirmarEliminar } from '../../../data-grid/casos/seguimiento'
import { SIN_ARRASTRE } from '../../../data-grid/casos/sin-arrastre'
import { PestanasDePatron } from '../../../patrones/piezas'
import { fechaCorta, plural } from '../../../patrones/formato'
import { pagina, resolver, useCargaInicial, type Filtro } from '../../admin-compartido/lista'
import { EncabezadoPantalla } from '../../admin-compartido/piezas'
import { TIPOS, destinoDeFila, progresoDe, ruta, totalPersonas, type EstadoPlan, type Plan, type TipoPlan } from '../components/datos'
import { usePlanes } from '../components/estado'

// Lista de planes (/creator/training-plan/content-plan): pestañas de contenidos y competencias,
// columnas Nombre, Fecha de inicio, Fecha de finalización, Progreso y Estado, filtro por estado y
// menú por fila que depende del estado (HU-LMS-005, RN-05 a RN-09).

type Fila = Plan & { progreso: number; personas: number }

const BADGE: Record<EstadoPlan, 'success-light' | 'secondary' | 'outline' | 'info-light'> = {
  Vigente: 'success-light',
  Planeado: 'secondary',
  'No vigente': 'outline',
  Procesando: 'info-light',
}

// ── Menú de cada fila (RN-07) ──
// «Ver progreso» en Vigente y No vigente; «Editar» en Planeado, Vigente y Procesando; «Eliminar»
// siempre. Como cambia por fila, va en una columna propia que lee las acciones de un contexto.

type Accion = 'progreso' | 'editar' | 'eliminar'
const AccionContexto = createContext<(accion: Accion, plan: Plan) => void>(() => undefined)

function MenuDeFila({ plan }: { plan: Plan }) {
  const ejecutar = useContext(AccionContexto)
  const verProgreso = plan.estado === 'Vigente' || plan.estado === 'No vigente'
  const editar = plan.estado !== 'No vigente'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${plan.nombre}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {verProgreso || editar ? (
          <>
            <DropdownMenuGroup>
              {verProgreso ? (
                <DropdownMenuItem onClick={() => ejecutar('progreso', plan)}>
                  <HugeiconsIcon icon={ViewIcon} aria-hidden="true" />
                  Ver progreso
                </DropdownMenuItem>
              ) : null}
              {editar ? (
                <DropdownMenuItem onClick={() => ejecutar('editar', plan)}>
                  <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
                  Editar
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem variant="destructive" onClick={() => ejecutar('eliminar', plan)}>
          <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Columnas y filtros (fuera del componente: si no, el filtro se cierra al marcar) ──
// Cabecera de la tabla del sistema (decisión 1 de la auditoría): encabezados de 40 px con asidero para mover cada
// columna, y la de los tres puntos con su encabezado «Acciones» (esa no se mueve).

const COLUMNAS: DataGridListConfig<Fila>['columns'] = [
  {
    accessorKey: 'nombre',
    header: 'Nombre',
    size: 330,
    // RN-06: el nombre abre edición o detalle según el estado. Las personas del plan salen en el globo oscuro del
    // sistema (Hint), no en la ayuda nativa del navegador.
    cell: ({ row }) => (
      <Hint label={`${row.original.personas.toLocaleString('es-CO')} ${plural(row.original.personas, 'persona', 'personas')}`} side="top">
        <Button variant="link" size="sm" nativeButton={false} render={<Link to={destinoDeFila(row.original)} />} className="max-w-full">
          <span className="truncate">{row.original.nombre}</span>
        </Button>
      </Hint>
    ),
  },
  {
    accessorKey: 'inicio',
    header: 'Fecha de inicio',
    size: 140,
    cell: ({ row }) => (
      <Text as="span" size="sm">
        {fechaCorta(row.original.inicio)}
      </Text>
    ),
  },
  {
    accessorKey: 'fin',
    header: 'Fecha de finalización',
    size: 160,
    cell: ({ row }) => (
      <Text as="span" size="sm">
        {fechaCorta(row.original.fin)}
      </Text>
    ),
  },
  {
    accessorKey: 'progreso',
    header: 'Progreso',
    size: 170,
    cell: ({ row }) =>
      row.original.estado === 'Planeado' || row.original.estado === 'Procesando' ? (
        <Text as="span" variant="muted" size="sm">
          Aún no empieza
        </Text>
      ) : (
        <Progress value={row.original.progreso} className="w-full gap-1.5">
          <ProgressValue className="ms-auto">{() => `${row.original.progreso.toLocaleString('es-CO')} %`}</ProgressValue>
        </Progress>
      ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    size: 140,
    cell: ({ row }) => (
      <Badge variant={BADGE[row.original.estado]} size="sm">
        {row.original.estado === 'Procesando' ? `Procesando ${row.original.procesando ?? 0} %` : row.original.estado}
      </Badge>
    ),
  },
  {
    id: 'acciones',
    header: 'Acciones',
    size: 96,
    enableSorting: false,
    enableResizing: false,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <MenuDeFila plan={row.original} />,
  },
]

const FILTROS: DataGridListConfig<Fila>['columnFilters'] = [
  {
    id: 'estado',
    label: 'Estado',
    type: 'select',
    multiple: true,
    options: (['Vigente', 'Planeado', 'No vigente', 'Procesando'] as EstadoPlan[]).map((e) => ({ label: e, value: e })),
  },
]

function TablaPlanes({ tipo }: { tipo: TipoPlan }) {
  const navigate = useNavigate()
  const { planes, setPlanes } = usePlanes()
  const [cargando] = useCargaInicial()
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [eliminando, setEliminando] = useState<Plan | null>(null)

  const filas = useMemo<Fila[]>(
    () =>
      planes
        .filter((p) => p.tipo === tipo)
        .map((p) => ({ ...p, progreso: progresoDe(p), personas: totalPersonas(p) }))
        // Lo último que se tocó queda arriba; después, lo más reciente primero.
        .sort((a, b) => b.tocado - a.tocado || b.inicio.localeCompare(a.inicio)),
    [planes, tipo],
  )
  const resultado = useMemo(() => resolver(filas, busqueda, ['nombre'], filtros, orden), [filas, busqueda, filtros, orden])
  const visibles = useMemo(() => pagina(resultado, actual, porPagina), [resultado, actual, porPagina])
  const textos = TIPOS[tipo]

  const ejecutar = (accion: Accion, plan: Plan) => {
    if (accion === 'progreso') navigate(ruta(plan.id))
    if (accion === 'editar') navigate(ruta(`${plan.id}/editar`))
    if (accion === 'eliminar') setEliminando(plan)
  }

  const vacio = filas.length === 0
  const config: DataGridListConfig<Fila> = {
    columns: COLUMNAS,
    columnFilters: FILTROS,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setActual(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar plan…',
      onSearch: (q) => {
        setBusqueda(q)
        setActual(1)
      },
    },
    // Primera vez (no hay ningún plan de este tipo) o sin resultados (la búsqueda no encontró).
    emptyState: vacio
      ? {
          type: 'empty',
          title: `Todavía no hay ${textos.plural.toLowerCase()}`,
          description:
            tipo === 'competencias'
              ? 'Asigna horas de formación por competencia a toda la empresa, a grupos o a personas. Cada asignación admite hasta 8 competencias.'
              : 'Asigna contenidos a toda la empresa, a grupos o a personas, y mira quién los terminó.',
          action: { id: 'crear', label: `Crear ${textos.singular.toLowerCase()}`, variant: 'primary', onClick: () => navigate(`${ruta('nuevo')}?tipo=${tipo}`) },
        }
      : {
          type: 'no-results',
          title: 'No se encontraron resultados',
          description: 'Prueba con otro nombre o quita el filtro de estado.',
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
    // Cabecera de la tabla del sistema: sin título dentro del marco (el título es el de la página), el conteo a la
    // izquierda y encabezados de 40 px con asidero. RN-09: el progreso no está en vivo; se dice junto al número de planes.
    frame: {
      description: `${resultado.length.toLocaleString('es-CO')} ${plural(resultado.length, 'plan', 'planes')} · el progreso se actualiza cada 30 minutos`,
    },
  }

  return (
    <>
      <AccionContexto.Provider value={ejecutar}>
        <TablaDatos config={config} data={visibles} isLoading={cargando} paginacion={{ pagina: actual, setPagina: setActual, porPagina: porPagina, setPorPagina: setPorPagina, total: resultado.length }} nombre="planes" singular="plan" id="planes" />
      </AccionContexto.Provider>
      <ConfirmarEliminar
        abierto={eliminando !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : setEliminando(null))}
        cantidad={1}
        sustantivo={['plan', 'planes']}
        titulo="Eliminar plan de formación"
        descripcion={
          eliminando
            ? `¿Deseas eliminar realmente el plan «${eliminando.nombre}»? ${totalPersonas(eliminando).toLocaleString('es-CO')} personas lo pierden de su Zona de estudio. Su avance en los contenidos se conserva, pero el plan no se puede recuperar.`
            : ''
        }
        accion="Eliminar plan"
        onConfirmar={() => {
          const nombre = eliminando?.nombre
          setPlanes((todos) => todos.filter((p) => p.id !== eliminando?.id))
          setEliminando(null)
          toast.add({ type: 'success', title: 'Plan eliminado', description: `«${nombre}» ya no aparece en la Zona de estudio de nadie.` })
        }}
      />
    </>
  )
}

export function Component() {
  const navigate = useNavigate()
  const { planes } = usePlanes()
  const [tipo, setTipo] = useState<TipoPlan>('contenidos')
  const agente = useAgente()

  return (
    // Las pestañas van dentro de la cabecera (`pestanas`), como en Planes de formación del admin: el Tabs envuelve la
    // pantalla.
    <Tabs value={tipo} onValueChange={(valor) => setTipo(valor as TipoPlan)} className="flex flex-1 flex-col gap-6 pt-2">
      <EncabezadoPantalla
        titulo="Planes de formación"
        descripcion="Asigna formación y mira qué porcentaje de personas la terminó completa."
        acciones={
          <>
            <Button nativeButton={false} render={<Link to={`${ruta('nuevo')}?tipo=${tipo}`} />}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
              Crear {TIPOS[tipo].singular.toLowerCase()}
            </Button>
            {/* La IA es el agente contextual: «Orbit Flow» abre su panel a la derecha, sobre esta lista, no otra página.
                El botón de IA va al final. */}
            {agente.disponible ? <ReopenAgentButton onClick={agente.abrir} /> : null}
          </>
        }
        pestanas={
          <PestanasDePatron
            items={[
              { valor: 'contenidos', etiqueta: 'Planes de contenidos' },
              { valor: 'competencias', etiqueta: 'Planes de competencias' },
            ]}
          />
        }
      />

      {/* Cada pestaña conserva su búsqueda y sus filtros. */}
      <TabsContent value="contenidos" keepMounted>
        <TablaPlanes tipo="contenidos" />
      </TabsContent>
      <TabsContent value="competencias" keepMounted>
        <TablaPlanes tipo="competencias" />
      </TabsContent>

      {agente.portal(
        <AgentePlanes
          pantalla="lista"
          planes={planes}
          onUsarBorrador={(borrador) => navigate(`${ruta('nuevo')}?tipo=contenidos`, { state: { borrador } })}
          onAbrir={(plan) => navigate(destinoDeFila(plan))}
          onClose={agente.cerrar}
        />,
      )}
    </Tabs>
  )
}

Component.displayName = 'PlanesFormacionLista'
