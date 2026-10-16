import { createContext, useContext, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Delete02Icon, Edit02Icon, MoreHorizontalIcon, PlusSignIcon, ViewIcon } from '@hugeicons/core-free-icons'
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
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { ConfirmarEliminar } from '@/modules/design-system/data-grid/casos/seguimiento'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { fechaCorta, plural } from '@/modules/design-system/patrones/formato'
import { AgentePlanes, useAgente } from './agente-aprendizaje'
import {
  ALCANCES,
  BADGE_ESTADO,
  ESTADOS,
  NOMBRE_ALCANCE,
  TIPOS,
  cambiarPlanes,
  marcadosEn,
  momentoDe,
  ordenarPor,
  progresoDe,
  rutaPlan,
  totalPersonas,
  usePlanes,
  type Plan,
  type TipoPlan,
} from './planes-datos'
import { FILAS_CLICABLES, abrirAlTocarFila } from './filas'
import { PanelPlan } from './panel-plan'

// Aprendizaje › Planes de formación › Planes. Rediseño parcial de la lista de /creator/training-plan/content-plan
// (HU-LMS-005): lo mismo que hoy —dos tipos de plan, estados, progreso y el menú según el estado—. La tabla es la del
// design system (DataGridList, como en Data grid › Evaluaciones 360°): buscador, filtros, orden por columna y
// paginación salen de ella. Su paginación viene en inglés: es un límite de la librería.
//
// Hallazgo del inventario: en el producto de hoy todos los planes salen al 0 % de progreso. Aquí la barra es la de
// RN-08 —cuántas personas terminaron el 100 % de lo que se les asignó— y se calcula con el avance de cada persona.

type FilaPlan = Plan & { progreso: number; empezo: boolean; alcances: string[] }
type Filtro = { id: string; value: unknown }

// El plan en cifras, en una línea: cuántas personas y cuántos contenidos (y las horas, en competencias). No se nombra
// el grupo ni la empresa: al guardar, el plan convierte cada asignación en personas (estado «Procesando»), así que lo
// que queda es gente con contenidos; además el nombre del grupo se cortaba (revisión de David, 30 sep).
function resumenDe(plan: Plan) {
  const personas = totalPersonas(plan)
  const items = new Set(plan.asignaciones.flatMap((a) => a.items)).size
  const horas = plan.tipo === 'competencias' && plan.horas ? ` · ${plan.horas} h por competencia` : ''
  return `${personas.toLocaleString('es-CO')} ${plural(personas, 'persona', 'personas')} · ${items} ${plural(items, TIPOS[plan.tipo].item, TIPOS[plan.tipo].items)}${horas}`
}

// Las columnas van fuera del componente (si no, el filtro se cierra al marcar); lo que necesitan de la pantalla —ver,
// abrir, editar o eliminar el plan— les llega por contexto.
type Acciones = Record<'onVer' | 'onAbrir' | 'onEditar' | 'onEliminar', (plan: Plan) => void>
const nada = () => undefined
const AccionesPlan = createContext<Acciones>({ onVer: nada, onAbrir: nada, onEditar: nada, onEliminar: nada })

// Tocar un plan (el nombre o cualquier parte de su fila) lo abre en el panel «Ver plan», en cualquier estado. Desde
// ahí se abre completo, se edita o se elimina; las mismas acciones están en el «⋯» de la columna «Acciones».
function CeldaNombre({ plan }: { plan: FilaPlan }) {
  const { onVer } = useContext(AccionesPlan)
  return (
    <div className="flex max-w-64 min-w-0 flex-col items-start gap-1">
      {/* Sin el relleno lateral del enlace (forzado: el del tema le gana a `px-0`), el nombre queda alineado con su
          resumen de abajo; con él se veía corrido (revisión de David, 30 sep). */}
      <Button variant="link" size="sm" className="max-w-full px-0!" onClick={() => onVer(plan)}>
        <span className="truncate">{plan.nombre}</span>
      </Button>
      <Text as="span" variant="muted" size="xs" className="max-w-full truncate">
        {resumenDe(plan)}
      </Text>
    </div>
  )
}

// La columna «Acciones» (decisión 15 de la auditoría, 5-oct): antes todo se abría tocando la fila, algo que no se ve.
// La fila sigue abriendo «Ver plan»; el «⋯» dice a la vista qué más se puede hacer.
function MenuPlan({ plan }: { plan: FilaPlan }) {
  const { onVer, onAbrir, onEditar, onEliminar } = useContext(AccionesPlan)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${plan.nombre}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onVer(plan)}>
            <HugeiconsIcon icon={ViewIcon} aria-hidden="true" />
            Ver plan
          </DropdownMenuItem>
          {plan.empezo ? (
            <DropdownMenuItem onClick={() => onAbrir(plan)}>
              <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
              Ver plan completo
            </DropdownMenuItem>
          ) : null}
          {plan.estado !== 'No vigente' ? (
            <DropdownMenuItem onClick={() => onEditar(plan)}>
              <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
              Editar
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onEliminar(plan)}>
          <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// RN-08: personas que terminaron todo lo suyo. La barra y el % en una línea, como en UBITS.
function CeldaProgreso({ plan }: { plan: FilaPlan }) {
  if (!plan.empezo) {
    return (
      <Text as="span" variant="muted" size="sm">
        {plan.estado === 'Procesando' ? 'Asignando…' : 'Aún no empieza'}
      </Text>
    )
  }
  return (
    <span className="flex w-full items-center gap-2.5">
      <Progress value={plan.progreso} className="flex-1" aria-label={`${plan.progreso} % terminaron completo`} />
      <Text as="span" size="sm" className="w-10 shrink-0 text-right tabular-nums">
        {plan.progreso} %
      </Text>
    </span>
  )
}

const fechaConMomento = (fecha: string, plan: Plan, momento: boolean) => (
  <div className="flex flex-col gap-1">
    <Text as="span" size="sm">
      {fechaCorta(fecha)}
    </Text>
    {momento ? (
      <Text as="span" variant="muted" size="xs">
        {momentoDe(plan)}
      </Text>
    ) : null}
  </div>
)

const columnas = (tipo: TipoPlan): DataGridListConfig<FilaPlan>['columns'] => [
  { accessorKey: 'nombre', header: 'Nombre', size: 300, ...SIN_ARRASTRE, cell: ({ row }) => <CeldaNombre plan={row.original} /> },
  { accessorKey: 'inicio', header: 'Fecha de inicio', size: 130, ...SIN_ARRASTRE, cell: ({ row }) => fechaConMomento(row.original.inicio, row.original, false) },
  {
    accessorKey: 'fin',
    header: tipo === 'competencias' ? 'Fecha de cierre' : 'Fecha de finalización',
    size: 170,
    ...SIN_ARRASTRE,
    cell: ({ row }) => fechaConMomento(row.original.fin, row.original, true),
  },
  {
    accessorKey: 'progreso',
    header: 'Progreso',
    size: 170,
    ...SIN_ARRASTRE,
    // RN-08: personas que terminaron todo lo suyo. La barra y el % en una línea, como en UBITS.
    cell: ({ row }) => <CeldaProgreso plan={row.original} />,
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    size: 140,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Badge variant={BADGE_ESTADO[row.original.estado]} size="sm">
        {row.original.estado === 'Procesando' ? `Procesando ${row.original.procesando ?? 0} %` : row.original.estado}
      </Badge>
    ),
  },
  { id: 'acciones', header: 'Acciones', size: 96, enableSorting: false, enableResizing: false, ...SIN_ARRASTRE, cell: ({ row }) => <MenuPlan plan={row.original} /> },
]
const COLUMNAS: Record<TipoPlan, DataGridListConfig<FilaPlan>['columns']> = { contenidos: columnas('contenidos'), competencias: columnas('competencias') }

const FILTROS: DataGridListConfig<FilaPlan>['columnFilters'] = [
  { id: 'estado', label: 'Estado', type: 'select', multiple: true, options: ESTADOS.map((e) => ({ label: e, value: e })) },
  { id: 'alcances', columnId: 'nombre', label: 'Asignación', type: 'select', multiple: true, options: ALCANCES.map((a) => ({ label: NOMBRE_ALCANCE[a.id], value: a.id })) },
]

export function ListaPlanes() {
  const navigate = useNavigate()
  const planes = usePlanes()
  const [parametros, setParametros] = useSearchParams()
  const tipo: TipoPlan = parametros.get('tipo') === 'competencias' ? 'competencias' : 'contenidos'
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [version, setVersion] = useState(0)
  const [eliminando, setEliminando] = useState<Plan | null>(null)
  // Un enlace viejo con ?editar=<id> abre el panel de ese plan; editar ya es una página (/planes/:id/editar).
  const [viendo, setViendo] = useState<{ id: string; vez: number } | null>(() => {
    const id = parametros.get('editar')
    return id ? { id, vez: 0 } : null
  })
  const [cerrando, setCerrando] = useState(false)
  const planVisto = viendo ? planes.find((p) => p.id === viendo.id) : undefined
  const textos = TIPOS[tipo]
  const agente = useAgente()
  const verVacio = parametros.has('vacio')

  // Lo último que se tocó queda arriba; después, lo más reciente primero.
  const delTipo = useMemo<FilaPlan[]>(
    () =>
      planes
        // ?vacio en la dirección muestra la lista sin planes (el estado «Primera vez»), para revisarlo sin borrar datos.
        .filter((p) => p.tipo === tipo && !verVacio)
        .sort((a, b) => b.tocado - a.tocado || b.inicio.localeCompare(a.inicio))
        .map((p) => {
          const empezo = p.estado === 'Vigente' || p.estado === 'No vigente'
          return { ...p, empezo, progreso: empezo ? Math.round(progresoDe(p)) : 0, alcances: [...new Set(p.asignaciones.map((a) => a.alcance))] }
        }),
    [planes, tipo, verVacio],
  )
  const resultado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const estados = marcadosEn(filtros, 'estado')
    const alcances = marcadosEn(filtros, 'alcances')
    return ordenarPor(
      delTipo.filter(
        (p) =>
          (!q || p.nombre.toLowerCase().includes(q)) &&
          (!estados.length || estados.includes(p.estado)) &&
          (!alcances.length || p.alcances.some((a) => alcances.includes(a))),
      ),
      orden,
    )
  }, [delTipo, busqueda, filtros, orden])
  const visibles = resultado.slice((pagina - 1) * porPagina, pagina * porPagina)
  const filtrosPuestos = filtros.filter((f) => Array.isArray(f.value) && f.value.length > 0).length
  const filtrando = Boolean(busqueda.trim()) || filtrosPuestos > 0

  // Al cambiar de tipo o limpiar, la tabla vuelve a empezar (también su buscador y sus filtros).
  const limpiar = () => {
    setBusqueda('')
    setFiltros([])
    setPagina(1)
    setVersion((v) => v + 1)
  }
  const crear = () => navigate(`${rutaPlan('crear')}?tipo=${tipo}`)

  const config: DataGridListConfig<FilaPlan> = {
    columns: COLUMNAS[tipo],
    columnFilters: FILTROS,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setPagina(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar por nombre del plan',
      onSearch: (q) => {
        setBusqueda(q)
        setPagina(1)
      },
    },
    // Los dos estados vacíos del design system (Estados › Estados vacíos): «Sin resultados» cuando la búsqueda o los
    // filtros dejan fuera todo, y «Primera vez» cuando todavía no hay ningún plan (revisión de David, 30 sep).
    emptyState: filtrando
      ? { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={filtrosPuestos} onLimpiar={limpiar} /> }
      : {
          type: 'empty',
          customComponent: (
            <PrimeraVez
              icono="glass-add"
              titulo={`Todavía no hay ${textos.plural.toLowerCase()}`}
              descripcion={
                tipo === 'competencias'
                  ? 'Asigna horas de estudio por competencia a toda la empresa, a grupos o a personas.'
                  : 'Asigna contenidos a toda la empresa, a grupos o a personas, y mira quién los terminó.'
              }
              accion={{ texto: `Crear ${textos.singular.toLowerCase()}`, icono: PlusSignIcon, onClick: crear }}
            />
          ),
        },
    frame: { title: textos.plural, toolbar: 'header' },
    labels: {
      // RN-09: el progreso no está en vivo, y se dice donde se lee el total.
      resultCount: (_visibles, total) => `${total} ${plural(total, 'plan', 'planes')} · el progreso se actualiza cada 30 minutos`,
    },
  }

  return (
    <PageShell>
      <PageHeader
        title="Planes de formación"
        description="Asigna formación a toda la empresa, a grupos o a personas, y mira quién la terminó completa."
        tabs={
          <Tabs
            value={tipo}
            onValueChange={(valor) => {
              setParametros(valor === 'competencias' ? { tipo: 'competencias' } : {}, { replace: true })
              limpiar()
            }}
          >
            {/* La pestaña convencional (subrayada) es la maestra; el switch queda para casos especiales (war room, 28 sep). */}
            <TabsList variant="line">
              <TabsTrigger value="contenidos" className="flex-none px-3">Planes de contenidos</TabsTrigger>
              <TabsTrigger value="competencias" className="flex-none px-3">Planes de competencias</TabsTrigger>
            </TabsList>
          </Tabs>
        }
        actions={
          <>
            {/* Como en UBITS, el botón cambia con la pestaña: «Crear plan de contenidos» o «de competencias». */}
            <Button onClick={crear}>
              <HugeiconsIcon icon={PlusSignIcon} size={16} aria-hidden="true" />
              Crear {textos.singular.toLowerCase()}
            </Button>
            {/* Lo de IA va de último y se abre al lado de la lista: no es otra página. */}
            {agente.disponible ? <ReopenAgentButton onClick={agente.abrir} /> : null}
          </>
        }
      />

      <PageContent>
        <AccionesPlan.Provider
          value={{
            onVer: (plan) => {
              setCerrando(false)
              setViendo({ id: plan.id, vez: Date.now() })
            },
            onAbrir: (plan) => navigate(rutaPlan(plan.id)),
            onEditar: (plan) => navigate(rutaPlan(`${plan.id}/editar`)),
            onEliminar: setEliminando,
          }}
        >
          {/* Como en UBITS, toda la fila abre el plan. */}
          <div onClick={abrirAlTocarFila} className={FILAS_CLICABLES}>
  <TablaDatos key={`${tipo}-${version}`} config={config} data={visibles} paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: resultado.length }} nombre="planes" id="planes" />
          </div>
        </AccionesPlan.Provider>
      </PageContent>

      {/* «Ver plan»: el plan en un panel, sin salir de la lista; de ahí salen abrir completo, editar y eliminar. */}
      {planVisto && viendo ? (
        <PanelPlan
          key={viendo.vez}
          abierto={!cerrando}
          onAbiertoChange={(abierto) => {
            if (abierto) return
            setCerrando(true)
            // Si se abrió desde un enlace de editar, la dirección vuelve a ser la de la lista.
            if (parametros.has('editar')) {
              const siguientes = new URLSearchParams(parametros)
              siguientes.delete('editar')
              setParametros(siguientes, { replace: true })
            }
          }}
          plan={planVisto}
          onAbrir={() => navigate(rutaPlan(planVisto.id))}
          onEliminar={() => {
            setCerrando(true)
            setEliminando(planVisto)
          }}
        />
      ) : null}

      {/* RN-07: eliminar se confirma escribiendo «eliminar». */}
      <ConfirmarEliminar
        abierto={eliminando !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : setEliminando(null))}
        cantidad={1}
        sustantivo={['plan', 'planes']}
        titulo="Eliminar plan de formación"
        descripcion={
          eliminando
            ? `¿Deseas eliminar «${eliminando.nombre}»? ${totalPersonas(eliminando).toLocaleString('es-CO')} ${plural(totalPersonas(eliminando), 'persona lo pierde', 'personas lo pierden')} de su Zona de estudio. Su avance en los ${TIPOS[eliminando.tipo].items} se conserva, pero el plan no se puede recuperar.`
            : ''
        }
        accion="Eliminar plan"
        onConfirmar={() => {
          const nombre = eliminando?.nombre
          cambiarPlanes((todos) => todos.filter((p) => p.id !== eliminando?.id))
          setEliminando(null)
          notify('Plan eliminado', `«${nombre}» ya no aparece en la Zona de estudio de nadie.`)
        }}
      />
      {agente.portal(
        <AgentePlanes
          pantalla="lista"
          planes={planes}
          onUsarBorrador={(borrador) => navigate(`${rutaPlan('crear')}?tipo=contenidos`, { state: { borrador } })}
          onAbrir={(plan) => {
            setCerrando(false)
            setViendo({ id: plan.id, vez: Date.now() })
          }}
          onClose={agente.cerrar}
        />,
      )}
    </PageShell>
  )
}
