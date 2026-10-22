import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlarmClockIcon, ArrowRight01Icon, Calendar03Icon, Delete02Icon, Edit02Icon, Loading03Icon, MoreHorizontalIcon, PlusSignIcon, ViewIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FramePanel,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { BloqueAtencion, type AlertaAtencion } from '@/shared/components/BloqueAtencion'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { MetricasDestacadas, type Metrica } from '@/shared/components/MetricasDestacadas'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { ConfirmarEliminar } from '@/modules/design-system/data-grid/casos/seguimiento'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { Marco } from '@/modules/design-system/patrones/ficha'
import { diasDesde, fechaCorta, fechaSinAnio, plural } from '@/modules/design-system/patrones/formato'
import { AgentePlanes, useAgente } from './agente-aprendizaje'
import {
  ALCANCES,
  BADGE_ESTADO,
  ESTADOS,
  NOMBRE_ALCANCE,
  NOMBRE_ESTADO,
  PERSONAS_EMPRESA,
  TIPOS,
  cambiarPlanes,
  marcadosEn,
  momentoDe,
  ordenarPor,
  personasDelPlan,
  progresoDe,
  rutaPlan,
  totalPersonas,
  usePlanes,
  type Plan,
  type TipoPlan,
} from './planes-datos'
import { FILAS_CLICABLES, abrirAlTocarFila } from './filas'

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
type Acciones = Record<'onAbrir' | 'onEditar' | 'onEliminar', (plan: Plan) => void>
const nada = () => undefined
const AccionesPlan = createContext<Acciones>({ onAbrir: nada, onEditar: nada, onEliminar: nada })

// Tocar un plan (el nombre o cualquier parte de su fila) abre su página, en cualquier estado: con el plan corriendo,
// en «Avance». Ya no hay panel «Ver plan» de por medio (15-oct: era un paso de más). Eliminar sigue en el «⋯» de la
// fila y en el «⋯» de la página del plan.
function CeldaNombre({ plan }: { plan: FilaPlan }) {
  const { onAbrir } = useContext(AccionesPlan)
  return (
    <div className="flex w-full min-w-0 flex-col items-start gap-1">
      {/* Sin el relleno lateral del enlace (forzado: el del tema le gana a `px-0`), el nombre queda alineado con su
          resumen de abajo; con él se veía corrido (revisión de David, 30 sep). */}
      <Button variant="link" size="sm" className="max-w-full px-0!" onClick={() => onAbrir(plan)}>
        <span className="truncate">{plan.nombre}</span>
      </Button>
      <Text as="span" variant="muted" size="xs" className="max-w-full truncate">
        {resumenDe(plan)}
      </Text>
    </div>
  )
}

// La columna «Acciones» (decisión 15 de la auditoría, 5-oct): antes todo se abría tocando la fila, algo que no se ve.
// La fila abre la página del plan; el «⋯» dice a la vista qué más se puede hacer.
function MenuPlan({ plan }: { plan: FilaPlan }) {
  const { onAbrir, onEditar, onEliminar } = useContext(AccionesPlan)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${plan.nombre}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onAbrir(plan)}>
            <HugeiconsIcon icon={ViewIcon} aria-hidden="true" />
            Ver plan
          </DropdownMenuItem>
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
        {row.original.estado === 'Procesando' ? `Procesando ${row.original.procesando ?? 0} %` : NOMBRE_ESTADO[row.original.estado]}
      </Badge>
    ),
  },
  { id: 'acciones', header: 'Acciones', size: 96, enableSorting: false, enableResizing: false, ...SIN_ARRASTRE, cell: ({ row }) => <MenuPlan plan={row.original} /> },
]
const COLUMNAS: Record<TipoPlan, DataGridListConfig<FilaPlan>['columns']> = { contenidos: columnas('contenidos'), competencias: columnas('competencias') }

const FILTROS: DataGridListConfig<FilaPlan>['columnFilters'] = [
  { id: 'estado', label: 'Estado', type: 'select', multiple: true, options: ESTADOS.map((e) => ({ label: NOMBRE_ESTADO[e], value: e })) },
  { id: 'alcances', columnId: 'nombre', label: 'Asignación', type: 'select', multiple: true, options: ALCANCES.map((a) => ({ label: NOMBRE_ALCANCE[a.id], value: a.id })) },
]

// «Crea algo nuevo», como en LMS Creator › Contenidos y Encuestas: las formas de empezar un plan, a la vista. Las dos
// primeras abren «Crear plan» con su tipo; la del archivo abre el de contenidos, que es donde se sube el CSV (en el paso
// de las asignaciones, «Desde archivo»).
const CREAR: { id: string; titulo: string; descripcion: string; glass: string; tipo: TipoPlan }[] = [
  { id: 'contenidos', titulo: 'Plan de contenidos', descripcion: 'Cursos y rutas para grupos o personas, con fechas de inicio y cierre.', glass: 'glass-document', tipo: 'contenidos' },
  { id: 'competencias', titulo: 'Plan de competencias', descripcion: 'Una competencia con sus habilidades y las horas de estudio.', glass: 'glass-activity', tipo: 'competencias' },
  { id: 'archivo', titulo: 'Desde un archivo', descripcion: 'Personas y contenidos en un CSV, para planes grandes.', glass: 'glass-folder', tipo: 'contenidos' },
]

const numero = (n: number) => n.toLocaleString('es-CO')
const personas = (n: number) => `${numero(n)} ${plural(n, 'persona', 'personas')}`
const porcentaje = (parte: number, total: number) => (total ? Math.round((parte / total) * 100) : 0)
const enMinuscula = (texto: string) => texto.charAt(0).toLowerCase() + texto.slice(1)
// Días hasta la fecha (0 = hoy; negativo = ya pasó).
const diasPara = (iso: string) => -diasDesde(iso)

// Las cuatro cifras de la lista, de los planes de la pestaña: cuántos corren, a cuánta gente le llegan, cuánta ya terminó y
// cuántos cierran pronto. La misma fila de indicadores de Contenidos y Encuestas.
function metricasDe(planes: Plan[]): Metrica[] {
  const vigentes = planes.filter((p) => p.estado === 'Vigente')
  const planeados = planes.filter((p) => p.estado === 'Planeado').length
  const asignando = planes.filter((p) => p.estado === 'Procesando').length
  const filas = vigentes.flatMap(personasDelPlan)
  const conPlan = new Set(filas.map((f) => f.usuario)).size
  const terminaron = filas.filter((f) => f.progreso === 100).length
  const cierran = vigentes.filter((p) => diasPara(p.fin) >= 0 && diasPara(p.fin) <= 30).sort((a, b) => a.fin.localeCompare(b.fin))
  return [
    {
      id: 'vigentes',
      titulo: 'Planes vigentes',
      valor: numero(vigentes.length),
      ayuda: 'Planes dentro de sus fechas: lo que las personas estudian cuenta para el plan. Abajo, los que todavía no empiezan y los que se están asignando.',
      detalle: `${numero(planeados)} ${plural(planeados, 'planeado', 'planeados')} · ${numero(asignando)} ${plural(asignando, 'se está asignando', 'se están asignando')}`,
      anillo: porcentaje(vigentes.length, planes.length),
      color: 'var(--color-success)',
    },
    {
      id: 'personas',
      titulo: 'Personas con un plan vigente',
      valor: numero(conPlan),
      ayuda: 'Personas distintas con al menos un plan vigente: quien está en dos planes cuenta una vez. El porcentaje es sobre las personas activas de la empresa.',
      detalle: `${porcentaje(conPlan, PERSONAS_EMPRESA)} % de las personas activas`,
      avance: porcentaje(conPlan, PERSONAS_EMPRESA),
    },
    {
      id: 'terminaron',
      titulo: 'Terminaron su plan',
      valor: `${porcentaje(terminaron, filas.length)} %`,
      ayuda: 'Quienes terminaron el 100 % de lo suyo en un plan vigente, no el promedio de avances. Quien está en dos planes cuenta en cada uno. Se actualiza cada 30 minutos.',
      detalle: 'De quienes tienen un plan vigente',
      avance: porcentaje(terminaron, filas.length),
      color: 'var(--color-success)',
    },
    {
      id: 'cierran',
      titulo: 'Cierran este mes',
      valor: numero(cierran.length),
      ayuda: 'Planes vigentes que llegan a su fecha de cierre en los próximos 30 días. Lo que se estudie después ya no cuenta para el plan.',
      detalle: cierran.length ? `El primero, el ${fechaSinAnio(cierran[0].fin)}` : 'Ninguno en los próximos 30 días',
    },
  ]
}

// Lo que necesita atención en la lista, en la franja del sistema (BloqueAtencion, la de Contenidos y Vacantes), de lo
// más grave a lo menos. Sale de los planes de la pestaña, no está escrito, y cada «Ver» abre el plan, donde se actúa
// (en su «Avance» se recuerda a quien falta):
// - Planes vigentes que cierran en 15 días o menos con personas sin terminar.
// - Planes planeados que empiezan en 7 días o menos: último momento para revisarlos.
// - Planes que se están asignando (Procesando).
function alertasDe(planes: Plan[], onAbrir: (plan: Plan) => void): AlertaAtencion[] {
  const cierran = planes
    .filter((p) => p.estado === 'Vigente' && diasPara(p.fin) >= 0 && diasPara(p.fin) <= 15)
    .sort((a, b) => a.fin.localeCompare(b.fin))
    .flatMap<AlertaAtencion>((plan) => {
      const pendientes = personasDelPlan(plan).filter((f) => f.progreso < 100).length
      if (!pendientes) return []
      return [
        {
          id: `cierra-${plan.id}`,
          icono: AlarmClockIcon,
          tono: 'text-destructive',
          titulo: `«${plan.nombre}» cierra con ${personas(pendientes)} sin terminar`,
          detalle: `${momentoDe(plan)}, el ${fechaSinAnio(plan.fin)}. Desde su avance puedes recordarles lo que les falta.`,
          resumen: `${plan.nombre}: ${numero(pendientes)} sin terminar`,
          etiquetaAccion: 'Ver plan',
          onVer: () => onAbrir(plan),
        },
      ]
    })
  const empiezan = planes
    .filter((p) => p.estado === 'Planeado' && diasPara(p.inicio) >= 0 && diasPara(p.inicio) <= 7)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
    .map<AlertaAtencion>((plan) => ({
      id: `empieza-${plan.id}`,
      icono: Calendar03Icon,
      tono: 'text-warning',
      titulo: `«${plan.nombre}» ${enMinuscula(momentoDe(plan))}`,
      detalle: `Le llega a ${personas(totalPersonas(plan))} el ${fechaSinAnio(plan.inicio)}. Es el último momento para revisar quién ve qué.`,
      resumen: `${plan.nombre}: ${enMinuscula(momentoDe(plan))}`,
      etiquetaAccion: 'Revisar el plan',
      onVer: () => onAbrir(plan),
    }))
  const asignando = planes
    .filter((p) => p.estado === 'Procesando')
    .map<AlertaAtencion>((plan) => ({
      id: `asignando-${plan.id}`,
      icono: Loading03Icon,
      tono: 'text-info',
      titulo: `«${plan.nombre}» se está asignando (${plan.procesando ?? 0} %)`,
      detalle: `En unos minutos le llega a ${personas(totalPersonas(plan))}.`,
      resumen: `${plan.nombre}: asignando`,
      etiquetaAccion: 'Ver plan',
      onVer: () => onAbrir(plan),
    }))
  return [...cierran, ...empiezan, ...asignando]
}

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
  // Un enlace viejo con ?editar=<id> lleva directo a la página de ese plan (antes abría el panel «Ver plan», que ya no existe).
  const editarViejo = parametros.get('editar')
  useEffect(() => {
    if (editarViejo) navigate(rutaPlan(editarViejo), { replace: true })
  }, [editarViejo, navigate])
  const abrir = (plan: Plan) => navigate(rutaPlan(plan.id))
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

  // Lo de arriba de la tabla sale de los planes de la pestaña (sin ?vacio: la lista vacía no tiene nada que contar).
  const deLaPestana = useMemo(() => (verVacio ? [] : planes.filter((p) => p.tipo === tipo)), [planes, tipo, verVacio])
  const metricas = useMemo(() => metricasDe(deLaPestana), [deLaPestana])
  const alertas = alertasDe(deLaPestana, abrir)

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
        {/* La anatomía de los inicios de Contenidos y Encuestas: crear, lo que hay que atender, las cifras y la tabla. */}
        <Marco titulo="Crea algo nuevo">
          <FramePanel>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CREAR.map((opcion) => (
                <Button
                  key={opcion.id}
                  variant="outline"
                  onClick={() => navigate(`${rutaPlan('crear')}?tipo=${opcion.tipo}`)}
                  // Las mismas tarjetas de LMS Creator › Contenidos y Encuestas: `cursor-pointer` porque se leen como las del
                  // catálogo. Los «!» son los de esas tarjetas: el tema del botón (sin capa, ver Design system › Diferencias)
                  // le gana a `h-auto`, la alineación, el relleno y el salto de línea, y sin forzarlos el texto no cabe.
                  className="group h-auto! cursor-pointer items-start! justify-start! gap-3! rounded-xl! p-3! text-left! whitespace-normal!"
                >
                  <ImagenGlass nombre={opcion.glass} tamano={44} className="shrink-0" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-sm font-medium">
                      {opcion.titulo}
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                    </span>
                    <span className="text-xs leading-snug font-normal text-muted-foreground">{opcion.descripcion}</span>
                  </span>
                </Button>
              ))}
            </div>
          </FramePanel>
        </Marco>

        <BloqueAtencion alertas={alertas} etiqueta={`Lo que necesita atención en ${textos.plural.toLowerCase()}`} />
        {verVacio ? null : <MetricasDestacadas metricas={metricas} etiqueta={`Resumen de ${textos.plural.toLowerCase()}`} />}

        <AccionesPlan.Provider
          value={{
            onAbrir: abrir,
            // El plan se edita en su página; «Editar» abre directo sus asignaciones.
            onEditar: (plan) => navigate(`${rutaPlan(plan.id)}?tab=quien`),
            onEliminar: setEliminando,
          }}
        >
          {/* Como en UBITS, toda la fila abre el plan. */}
          <div onClick={abrirAlTocarFila} className={FILAS_CLICABLES}>
  <TablaDatos key={`${tipo}-${version}`} config={config} data={visibles} paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: resultado.length }} nombre="planes" id="planes" />
          </div>
        </AccionesPlan.Provider>
      </PageContent>

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
          notify('Plan eliminado', `«${nombre}» ya no aparece en la Zona de estudio de nadie.`, 'success')
        }}
      />
      {agente.portal(
        <AgentePlanes
          pantalla="lista"
          planes={planes}
          onUsarBorrador={(borrador) => navigate(`${rutaPlan('crear')}?tipo=contenidos`, { state: { borrador } })}
          onAbrir={abrir}
          onClose={agente.cerrar}
        />,
      )}
    </PageShell>
  )
}
