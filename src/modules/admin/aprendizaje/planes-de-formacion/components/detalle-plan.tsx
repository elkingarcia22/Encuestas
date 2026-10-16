import { createContext, useContext, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  BookOpen01Icon,
  Calendar03Icon,
  Copy01Icon,
  Delete02Icon,
  Download01Icon,
  Edit02Icon,
  InformationCircleIcon,
  Loading03Icon,
  Mail01Icon,
  MoreHorizontalIcon,
  Target02Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  IconTile,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { SinResultados } from '@/shared/components/SinResultados'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify, notifyAction } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { ConfirmarEliminar, Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { PantallaDeError } from '@/modules/design-system/estados/errores-sistema'
import { registroQueNoExiste } from '@/modules/design-system/estados/errores-sistema-datos'
import { fechaCorta, fechaSinAnio, plural } from '@/modules/design-system/patrones/formato'
import type { Participante } from '@/modules/design-system/templates/planes-formacion/components/datos'
import { AgentePlanes, useAgente } from './agente-aprendizaje'
import { AvancePlan, BADGE_AVANCE, avanceDe, type Avance } from './avance-plan'
import { PanelColaborador } from './panel-colaborador'
import { NOMBRE_REPORTE, descargarReporte } from './reportes'
import { TablaItems } from './tabla-items'
import {
  SALIDA_PANEL,
  BADGE_ESTADO,
  TIPOS,
  buscarPlan,
  cambiarPlanes,
  marcadosEn,
  momentoDe,
  ordenarPor,
  personasDelPlan,
  rutaPlan,
  totalPersonas,
  usePlanes,
  type Plan,
} from './planes-datos'
import { FILAS_CLICABLES, abrirFilaConId } from './filas'

// Detalle del plan (/admin/aprendizaje/planes-de-formacion/planes/:id): el avance del plan y sus personas, con «⋯» para
// Editar, Duplicar, Descargar y Eliminar. Se llega desde la fila de un plan Vigente o No vigente (RN-06) o desde «Ver progreso» (RN-07).
// Las pestañas «Colaboradores / Contenidos» van bajo el título, en la cabecera (auditoría del 5-oct, decisión 13), y el
// bloque de avance entra en la primera.
//
// El progreso del plan cuenta personas al 100 % (RN-08) y no está en vivo (RN-09). En el producto de hoy, un plan que
// aún no empieza abre una ventana cuyo título cambia según el estado; aquí ese aviso vive en la pestaña de progreso,
// donde se nota qué falta, sin una ventana que haya que cerrar para ver el plan.

const AVANCES: Avance[] = ['Completado', 'En curso', 'Sin iniciar']

export function DetallePlan() {
  const { id } = useParams()
  usePlanes()
  const plan = buscarPlan(id)
  const navigate = useNavigate()

  if (!plan) {
    return (
      <PageShell>
        <PageContent>
          <PantallaDeError error={registroQueNoExiste('este plan', 'planes')} onAccion={() => navigate(rutaPlan())} />
        </PageContent>
      </PageShell>
    )
  }
  return <Detalle key={plan.id} plan={plan} />
}

function Detalle({ plan }: { plan: Plan }) {
  const navigate = useNavigate()
  const agente = useAgente()
  const textos = TIPOS[plan.tipo]
  const volver = plan.tipo === 'competencias' ? `${rutaPlan()}?tipo=competencias` : rutaPlan()
  const empezo = plan.estado === 'Vigente' || plan.estado === 'No vigente'
  const personas = totalPersonas(plan)

  const [eliminando, setEliminando] = useState(false)
  // Editar es la página del plan, la misma de Crear (decisión 5 de la auditoría, 5-oct); al guardar vuelve aquí.
  const editar = () => navigate(rutaPlan(`${plan.id}/editar`), { state: { volverA: rutaPlan(plan.id) } })
  // RN-12 de HU-LMS-015/021: los mismos dos tabs que Editar plan, aquí de solo lectura.
  const [parametros, setParametros] = useSearchParams()
  const tab = parametros.get('tab') === textos.items ? 'items' : 'colaboradores'
  const [recordando, setRecordando] = useState<Participante[]>([])
  const [viendo, setViendo] = useState<{ participante: Participante; vez: number } | null>(null)
  const [cerrandoPanel, setCerrandoPanel] = useState(false)

  const pendientes = empezo ? personasDelPlan(plan).filter((p) => p.progreso < 100) : []

  const duplicar = () => {
    const copia: Plan = { ...plan, id: `p-${Date.now()}`, nombre: `Copia de ${plan.nombre}`, estado: 'Planeado', procesando: undefined, tocado: Date.now() }
    cambiarPlanes((todos) => [copia, ...todos])
    // Se deshace con un clic: se duplica sin preguntar y el aviso trae «Deshacer».
    notifyAction('Plan duplicado', `«${copia.nombre}» quedó Planeado para que le cambies las fechas.`, {
      label: 'Deshacer',
      onClick: () => cambiarPlanes((todos) => todos.filter((p) => p.id !== copia.id)),
    })
  }

  const cerrarPanel = () => {
    setCerrandoPanel(true)
    window.setTimeout(() => {
      setViendo(null)
      setCerrandoPanel(false)
    }, SALIDA_PANEL)
  }

  return (
    <PageShell>
      <Tabs value={tab} onValueChange={(valor) => setParametros(valor === 'items' ? { tab: textos.items } : {}, { replace: true })}>
      <PageHeader
        back={{ label: 'Volver a planes', to: volver }}
        breadcrumbs={[
          { label: 'Inicio', path: '/admin' },
          { label: 'Aprendizaje' },
          { label: 'Planes de formación', path: volver },
          { label: plan.nombre },
        ]}
        kicker={textos.singular}
        media={
          <IconTile variant="soft" size="lg">
            <HugeiconsIcon icon={plan.tipo === 'competencias' ? Target02Icon : BookOpen01Icon} aria-hidden="true" />
          </IconTile>
        }
        title={plan.nombre}
        badge={
          <Badge variant={BADGE_ESTADO[plan.estado]} size="sm">
            {plan.estado === 'Procesando' ? `Procesando ${plan.procesando ?? 0} %` : plan.estado}
          </Badge>
        }
        meta={
          <>
            <span>
              {fechaSinAnio(plan.inicio)} – {fechaCorta(plan.fin)} · {momentoDe(plan)}
            </span>
            <span>
              {personas.toLocaleString('es-CO')} {plural(personas, 'persona', 'personas')}
            </span>
            {plan.tipo === 'competencias' && plan.horas ? <span>{plan.horas} h por competencia</span> : null}
          </>
        }
        actions={
          <>
            {/* Orden de la cabecera (decisión 15 de la auditoría, 5-oct): «⋯» primero, con su menú abierto hacia el
                inicio; después Editar y Enviar recordatorio; el agente, de último. */}
            <DropdownMenu>
              <DropdownMenuTrigger render={<BotonIcono aria-label="Más acciones del plan" />}>
                <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuGroup>
                  {plan.estado !== 'No vigente' ? (
                    <DropdownMenuItem onClick={editar}>
                      <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
                      Editar
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onClick={duplicar}>
                    <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />
                    Duplicar
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                {/* HU-LMS-016 / 022: dos reportes, solo con el plan Vigente o No vigente (RN-05, RN-06). */}
                {empezo ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      {(['por-colaborador', 'detallado'] as const).map((tipo) => (
                        <DropdownMenuItem
                          key={tipo}
                          onClick={() => {
                            descargarReporte(plan, tipo)
                            notify(`${NOMBRE_REPORTE[tipo]} descargado.`)
                          }}
                        >
                          <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
                          {NOMBRE_REPORTE[tipo]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setEliminando(true)}>
                  <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
                  Eliminar plan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Editar a la vista, no solo dentro de «⋯»: es el camino de vuelta desde el progreso. */}
            {plan.estado !== 'No vigente' ? (
              <Button variant="outline" onClick={editar}>
                <HugeiconsIcon icon={Edit02Icon} size={16} aria-hidden="true" />
                Editar
              </Button>
            ) : null}
            {plan.estado === 'Vigente' && pendientes.length ? (
              <Button variant="outline" onClick={() => setRecordando(pendientes)}>
                <HugeiconsIcon icon={Mail01Icon} size={16} aria-hidden="true" />
                Enviar recordatorio
              </Button>
            ) : null}
            {/* Lo de IA va de último y se abre al lado del plan: no es otra página. */}
            {/* Editar, Enviar recordatorio y el agente: más de dos llamados, el agente va solo con el orbe (regla del 5-oct). */}
            {agente.disponible ? <ReopenAgentButton compact onClick={agente.abrir} /> : null}
          </>
        }
        tabs={
          // Solo un plan que ya empezó tiene avance por persona y por ítem que mostrar.
          empezo ? (
            <TabsList variant="line">
              <TabsTrigger value="colaboradores" className="flex-none px-3">
                Colaboradores
              </TabsTrigger>
              <TabsTrigger value="items" className="flex-none px-3">
                {textos.items.charAt(0).toUpperCase() + textos.items.slice(1)}
              </TabsTrigger>
            </TabsList>
          ) : undefined
        }
      />

      <PageContent>
        <Alert variant="warning">
          <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
          <AlertDescription>
            <p>Las fechas del plan se gestionan según la zona horaria: America/Bogota.</p>
          </AlertDescription>
        </Alert>
        {empezo ? (
          <>
            {/* El avance del plan va en la primera pestaña, encima de sus personas. */}
            <TabsContent value="colaboradores" className="flex flex-col gap-6">
              <Progreso plan={plan} onVer={(participante) => setViendo({ participante, vez: Date.now() })} onRecordar={setRecordando} />
            </TabsContent>
            <TabsContent value="items">
              <TablaItems plan={plan} conAvance />
            </TabsContent>
          </>
        ) : (
          <SinEmpezar plan={plan} />
        )}
      </PageContent>
      </Tabs>

      {viendo ? (
        <PanelColaborador
          key={viendo.vez}
          abierto={!cerrandoPanel}
          onAbiertoChange={(abierto) => (abierto ? undefined : cerrarPanel())}
          plan={plan}
          participante={viendo.participante}
          onRecordar={() => setRecordando([viendo.participante])}
        />
      ) : null}

      {/* Le llega a otras personas: dice a cuántas antes de enviar. */}
      <DialogoConfirmar
        abierto={recordando.length > 0}
        onAbiertoChange={(abierto) => (abierto ? undefined : setRecordando([]))}
        icono={Mail01Icon}
        titulo="Enviar recordatorio"
        descripcion={
          recordando.length === 1
            ? `Le llegará un correo a ${recordando[0].nombre} con lo que le falta de «${plan.nombre}» y la fecha de cierre (${fechaCorta(plan.fin)}).`
            : `Le llegará un correo a ${recordando.length.toLocaleString('es-CO')} personas que no han terminado «${plan.nombre}», con lo que les falta y la fecha de cierre (${fechaCorta(plan.fin)}).`
        }
        accion={recordando.length === 1 ? 'Enviar recordatorio' : `Enviar a ${recordando.length.toLocaleString('es-CO')} personas`}
        onConfirmar={() => {
          notify('Recordatorio enviado', `Va en camino a ${recordando.length === 1 ? recordando[0].nombre : `${recordando.length.toLocaleString('es-CO')} personas`}.`)
          setRecordando([])
        }}
      />

      {/* RN-07: eliminar se confirma escribiendo «eliminar». */}
      <ConfirmarEliminar
        abierto={eliminando}
        onAbiertoChange={setEliminando}
        cantidad={1}
        sustantivo={['plan', 'planes']}
        titulo="Eliminar plan de formación"
        descripcion={`¿Deseas eliminar «${plan.nombre}»? ${personas.toLocaleString('es-CO')} ${plural(personas, 'persona lo pierde', 'personas lo pierden')} de su Zona de estudio. Su avance en los ${textos.items} se conserva, pero el plan no se puede recuperar.`}
        accion="Eliminar plan"
        onConfirmar={() => {
          cambiarPlanes((todos) => todos.filter((p) => p.id !== plan.id))
          notify('Plan eliminado', `«${plan.nombre}» ya no aparece en la Zona de estudio de nadie.`)
          navigate(volver)
        }}
      />
      {agente.portal(<AgentePlanes pantalla="detalle" plan={plan} onRecordar={setRecordando} onClose={agente.cerrar} />)}
    </PageShell>
  )
}

// Un plan Planeado o Procesando todavía no tiene avance que mostrar. El título cambia según el estado.
function SinEmpezar({ plan }: { plan: Plan }) {
  const procesando = plan.estado === 'Procesando'
  const personas = totalPersonas(plan)
  return (
    <Card>
      <CardContent>
        <Empty className="py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={procesando ? Loading03Icon : Calendar03Icon} size={20} aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{procesando ? `Se está asignando a las personas (${plan.procesando ?? 0} %)` : `Este plan empieza el ${fechaCorta(plan.inicio)}`}</EmptyTitle>
            <EmptyDescription>
              {procesando
                ? `En unos minutos le llega a las ${personas.toLocaleString('es-CO')} personas y desde ahí verás quién avanza.`
                : `Cuando arranque verás aquí quién avanza y quién no. ${personas.toLocaleString('es-CO')} ${plural(personas, 'persona ya lo tiene', 'personas ya lo tienen')} asignado.`}
            </EmptyDescription>
          </EmptyHeader>
          {procesando ? (
            <EmptyContent>
              <Progress value={plan.procesando ?? 0} className="w-64" aria-label="Avance de la asignación" />
            </EmptyContent>
          ) : null}
        </Empty>
      </CardContent>
    </Card>
  )
}

type FilaPersona = Participante & { asignacionId: string; avance: Avance }
type Filtro = { id: string; value: unknown }

// La fila abre «Detalle de colaborador»; las columnas van fuera del componente y las acciones llegan por contexto.
const AccionesPersona = createContext<{ onVer: (p: Participante) => void; onRecordar?: (p: Participante[]) => void }>({ onVer: () => undefined })

// La persona con la pieza del sistema (decisión 21 de la auditoría, 5-oct): iniciales, nombre y área. Ya no es un
// enlace; la fila entera la abre y el «⋯» de «Acciones» también, para quien navega con el teclado.
function CeldaPersona({ fila }: { fila: FilaPersona }) {
  return (
    <div data-fila={fila.id} className="min-w-0">
      <Persona nombre={fila.nombre} detalle={fila.area} />
    </div>
  )
}

function MenuPersona({ fila }: { fila: FilaPersona }) {
  const { onVer, onRecordar } = useContext(AccionesPersona)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${fila.nombre}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onVer(fila)}>
            <HugeiconsIcon icon={ViewIcon} aria-hidden="true" />
            Ver detalle
          </DropdownMenuItem>
          {onRecordar && fila.progreso < 100 ? (
            <DropdownMenuItem onClick={() => onRecordar([fila])}>
              <HugeiconsIcon icon={Mail01Icon} aria-hidden="true" />
              Enviar recordatorio
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const COLUMNAS_PERSONAS: DataGridListConfig<FilaPersona>['columns'] = [
  { accessorKey: 'nombre', header: 'Persona', size: 260, ...SIN_ARRASTRE, cell: ({ row }) => <CeldaPersona fila={row.original} /> },
  {
    accessorKey: 'ultimoAcceso',
    header: 'Último acceso',
    size: 140,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" size="sm" variant={row.original.ultimoAcceso ? undefined : 'muted'}>
        {row.original.ultimoAcceso ?? 'Sin acceso'}
      </Text>
    ),
  },
  // Como en UBITS: cuándo avanzó por última vez, que no es lo mismo que cuándo entró.
  {
    accessorKey: 'ultimoProgreso',
    header: 'Última fecha de progreso',
    size: 180,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" size="sm" variant={row.original.ultimoProgreso ? undefined : 'muted'}>
        {row.original.ultimoProgreso ?? 'Sin progreso'}
      </Text>
    ),
  },
  {
    accessorKey: 'progreso',
    header: 'Avance',
    size: 190,
    ...SIN_ARRASTRE,
    // La barra y cuánto lleva en una sola línea: todas las filas quedan del mismo alto.
    cell: ({ row }) => (
      <span className="flex w-full items-center gap-3">
        <Progress value={row.original.progreso} className="flex-1" aria-label={`${row.original.progreso} %`} />
        <Text as="span" size="sm" className="w-12 shrink-0 text-right tabular-nums">
          {row.original.hechos} de {row.original.total}
        </Text>
      </span>
    ),
  },
  {
    accessorKey: 'avance',
    header: 'Estado',
    size: 120,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Badge variant={BADGE_AVANCE[row.original.avance]} size="sm">
        {row.original.avance}
      </Badge>
    ),
  },
  { id: 'acciones', header: 'Acciones', size: 96, enableSorting: false, enableResizing: false, ...SIN_ARRASTRE, cell: ({ row }) => <MenuPersona fila={row.original} /> },
]

const FILTROS_PERSONAS: DataGridListConfig<FilaPersona>['columnFilters'] = [
  { id: 'avance', label: 'Estado', type: 'select', multiple: true, options: AVANCES.map((a) => ({ label: a, value: a })) },
]

function Progreso({ plan, onVer, onRecordar }: { plan: Plan; onVer: (p: Participante) => void; onRecordar: (p: Participante[]) => void }) {
  const filas = useMemo<FilaPersona[]>(() => personasDelPlan(plan).map((f) => ({ ...f, avance: avanceDe(f) })), [plan])
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [version, setVersion] = useState(0)
  const vigente = plan.estado === 'Vigente'

  const resultado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const avances = marcadosEn(filtros, 'avance')
    return ordenarPor(
      filas.filter((f) => (!avances.length || avances.includes(f.avance)) && (!q || `${f.nombre} ${f.area}`.toLowerCase().includes(q))),
      orden,
    )
  }, [filas, busqueda, filtros, orden])
  const visibles = resultado.slice((pagina - 1) * porPagina, pagina * porPagina)
  const filtrando = Boolean(busqueda.trim()) || filtros.some((f) => Array.isArray(f.value) && f.value.length > 0)

  const config: DataGridListConfig<FilaPersona> = {
    columns: COLUMNAS_PERSONAS,
    columnFilters: FILTROS_PERSONAS,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setPagina(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar persona o área',
      onSearch: (q) => {
        setBusqueda(q)
        setPagina(1)
      },
    },
    // Solo un plan vigente admite recordatorios: ahí se eligen personas y se les escribe a todas juntas.
    ...(vigente
      ? {
          selection: { onSelectionChange: () => undefined },
          actions: {
            bulk: [
              {
                id: 'recordar',
                label: 'Enviar recordatorio',
                icon: <HugeiconsIcon icon={Mail01Icon} aria-hidden="true" />,
                onClick: (elegidas: FilaPersona[]) => {
                  const pendientes = elegidas.filter((f) => f.progreso < 100)
                  if (pendientes.length) onRecordar(pendientes)
                  else notify('No hay a quién recordarle', 'Las personas elegidas ya terminaron el plan.')
                },
              },
            ],
          },
        }
      : {}),
    emptyState: filtrando
      ? {
          type: 'no-results',
          customComponent: (
            <SinResultados
              busqueda={busqueda}
              filtrosActivos={filtros.filter((f) => Array.isArray(f.value) && f.value.length > 0).length}
              onLimpiar={() => {
                setBusqueda('')
                setFiltros([])
                setVersion((v) => v + 1)
              }}
            />
          ),
        }
      : { type: 'empty', title: 'Este plan todavía no tiene personas' },
    frame: { title: 'Colaboradores', toolbar: 'header' },
    labels: { resultCount: (_visibles, total) => `${total.toLocaleString('es-CO')} ${plural(total, 'colaborador', 'colaboradores')}` },
  }

  // Como en UBITS, toda la fila abre el panel de la persona.
  const abrirFila = abrirFilaConId((id) => {
    const persona = filas.find((f) => f.id === id)
    if (persona) onVer(persona)
  })

  return (
    <>
      <AvancePlan plan={plan} filas={filas} onVer={onVer} onRecordar={onRecordar} />
      <AccionesPersona.Provider value={{ onVer, onRecordar: vigente ? onRecordar : undefined }}>
        <div onClick={abrirFila} className={FILAS_CLICABLES}>
  <TablaDatos key={version} config={config} data={visibles} paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: resultado.length }} nombre="personas" id="personas-plan" />
        </div>
      </AccionesPersona.Provider>
    </>
  )
}
