import { createContext, useContext, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, CheckmarkCircle02Icon, Loading03Icon, Mail01Icon, MoreHorizontalIcon, UserBlock01Icon, UserGroupIcon, ViewIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Progress,
  Text,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { SinResultados } from '@/shared/components/SinResultados'
import { BloqueAtencion, type AlertaAtencion } from '@/shared/components/BloqueAtencion'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { MetricasDestacadas, type Metrica } from '@/shared/components/MetricasDestacadas'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { notify } from '@/shared/components/notify'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { diasDesde, fechaCorta, fechaSinAnio, plural } from '@/modules/design-system/patrones/formato'
import type { Participante } from '@/modules/design-system/templates/planes-formacion/components/datos'
import { BADGE_AVANCE, avanceDe, type Avance } from './avance-plan'
import { PanelPersonasAvance, type ListaAvance } from './panel-personas-avance'
import { enOrdenDeLlegada } from './reportes'
import { SALIDA_PANEL, TIPOS, marcadosEn, nombreAsignacion, ordenarPor, personasDelPlan, totalPersonas, type PersonaDelPlan, type Plan } from './planes-datos'
import { FILAS_CLICABLES, abrirFilaConId } from './filas'

// El avance del plan: la pestaña «Avance» de la página del plan (plan.tsx). El progreso cuenta personas al 100 % (RN-08)
// y no está en vivo (RN-09). Un plan que aún no empieza no tiene avance: lo dice en su lugar (SinEmpezar).

const AVANCES: Avance[] = ['Completado', 'En curso', 'Sin iniciar']

// Un plan Planeado o Procesando todavía no tiene avance que mostrar. El título cambia según el estado.
export function SinEmpezar({ plan }: { plan: Plan }) {
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

type FilaPersona = Participante & { asignacionId: string; avance: Avance; asignacion: string }
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

// Los anchos suman lo que cabe en el marco de la tabla (1.104 px con la barra lateral abierta), con la casilla de elegir.
const COLUMNAS_PERSONAS: DataGridListConfig<FilaPersona>['columns'] = [
  { accessorKey: 'nombre', header: 'Persona', size: 220, ...SIN_ARRASTRE, cell: ({ row }) => <CeldaPersona fila={row.original} /> },
  // Por qué asignación le llega el plan (la primera, si está en dos): así se ve qué grupo va atrasado.
  {
    accessorKey: 'asignacion',
    header: 'Asignación',
    size: 150,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <TextoCompleto texto={row.original.asignacion}>
        <Text as="span" size="sm" className="block truncate">
          {row.original.asignacion}
        </Text>
      </TextoCompleto>
    ),
  },
  {
    accessorKey: 'ultimoAcceso',
    header: 'Último acceso',
    size: 120,
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
    // «Último avance», como en el reporte por colaborador: «Última fecha de progreso» no cabía con la columna Asignación.
    header: 'Último avance',
    size: 130,
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
    size: 170,
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
    size: 110,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Badge variant={BADGE_AVANCE[row.original.avance]} size="sm">
        {row.original.avance}
      </Badge>
    ),
  },
  { id: 'acciones', header: 'Acciones', size: 90, enableSorting: false, enableResizing: false, ...SIN_ARRASTRE, cell: ({ row }) => <MenuPersona fila={row.original} /> },
]

const FILTROS_PERSONAS: DataGridListConfig<FilaPersona>['columnFilters'] = [
  { id: 'avance', label: 'Estado', type: 'select', multiple: true, options: AVANCES.map((a) => ({ label: a, value: a })) },
]

const numero = (n: number) => n.toLocaleString('es-CO')
const porcentaje = (parte: number, total: number) => (total ? Math.round((parte / total) * 100) : 0)
const personas = (n: number) => `${numero(n)} ${plural(n, 'persona', 'personas')}`

// Lo que necesita atención en el plan, en la franja del sistema (BloqueAtencion, la de Contenidos y Vacantes), de lo más
// grave a lo menos. Cada «Ver personas» abre la lista de quienes cuenta la frase, y ahí se actúa (recordar o descargar).
// - Quien no ha empezado (0 % de avance); entre ellos, quien nunca ha entrado, que se nombra si lo hay.
// - La asignación que va más atrás, si nadie de ella ha terminado o va a menos de la mitad que el plan.
// - Quien ya terminó todo, para descargarlo en orden de llegada (hay empresas que premian al primero).
// Lo que no aplica no sale.
function alertasDelPlan(plan: Plan, filas: PersonaDelPlan[], onLista: (lista: ListaAvance) => void): AlertaAtencion[] {
  const vigente = plan.estado === 'Vigente'
  const alertas: AlertaAtencion[] = []
  const faltan = -diasDesde(plan.fin)
  const cuando = !vigente ? `cerró el ${fechaCorta(plan.fin)}` : faltan > 0 ? `quedan ${numero(faltan)} ${plural(faltan, 'día', 'días')}` : 'cierra hoy'

  const sinEmpezar = filas.filter((f) => f.progreso === 0)
  const nunca = sinEmpezar.filter((f) => f.ultimoAcceso === null).length
  if (sinEmpezar.length) {
    const titulo = `${personas(sinEmpezar.length)} no ${plural(sinEmpezar.length, 'ha empezado', 'han empezado')}`
    alertas.push({
      id: 'sin-empezar',
      icono: UserBlock01Icon,
      tono: 'text-destructive',
      titulo,
      detalle: `${nunca ? `${numero(nunca)} ${plural(nunca, 'nunca ha entrado', 'nunca han entrado')}` : `Sin avance desde el ${fechaSinAnio(plan.inicio)}`} · ${cuando}.${vigente ? ' En «Ver personas» puedes recordarles.' : ''}`,
      resumen: `${numero(sinEmpezar.length)} sin empezar`,
      etiquetaAccion: 'Ver personas',
      onVer: () => onLista({ titulo, personas: sinEmpezar }),
    })
  }

  const terminaron = filas.filter((f) => f.progreso === 100)
  const general = porcentaje(terminaron.length, filas.length)
  if (plan.asignaciones.length > 1 && general > 0) {
    const porAsignacion = plan.asignaciones
      .map((asignacion) => {
        const suyas = filas.filter((f) => f.asignaciones.includes(asignacion.id))
        return { asignacion, suyas, va: porcentaje(suyas.filter((f) => f.progreso === 100).length, suyas.length) }
      })
      .filter((a) => a.suyas.length > 0)
      .sort((a, b) => a.va - b.va)
    const atras = porAsignacion[0]
    if (atras && (atras.va === 0 || atras.va < general / 2)) {
      const nombre = nombreAsignacion(atras.asignacion)
      const titulo = atras.va === 0 ? `Nadie de «${nombre}» ha terminado` : `«${nombre}» va atrasada`
      alertas.push({
        id: 'asignacion',
        icono: UserGroupIcon,
        tono: 'text-warning',
        titulo,
        detalle: `${atras.va} % terminó, frente al ${general} % del plan · ${personas(atras.suyas.length)} en la asignación.`,
        resumen: `${nombre} atrasada`,
        etiquetaAccion: 'Ver personas',
        onVer: () => onLista({ titulo, personas: atras.suyas }),
      })
    }
  }

  if (terminaron.length) {
    const primera = enOrdenDeLlegada(terminaron)[0]
    const titulo = `${personas(terminaron.length)} ya ${plural(terminaron.length, 'terminó', 'terminaron')}`
    alertas.push({
      id: 'terminaron',
      icono: CheckmarkCircle02Icon,
      tono: 'text-info',
      titulo,
      detalle: `La primera fue ${primera.nombre}, ${primera.ultimoProgreso ?? 'hace poco'}. Descarga la lista en orden de llegada.`,
      resumen: `${numero(terminaron.length)} ${plural(terminaron.length, 'terminó', 'terminaron')}`,
      etiquetaAccion: 'Ver personas',
      onVer: () => onLista({ titulo, personas: terminaron, terminaron: true }),
    })
  }
  return alertas
}

// Las cuatro cifras del avance, en la fila de indicadores del sistema (la de Contenidos y Encuestas). Las tres de
// personas se tocan y abren a quienes cuentan, en el mismo panel de «Ver personas».
function metricasDelPlan(plan: Plan, filas: PersonaDelPlan[], onLista: (lista: ListaAvance) => void): Metrica[] {
  const textos = TIPOS[plan.tipo]
  const total = filas.length
  const de = (avance: Avance) => filas.filter((f) => avanceDe(f) === avance)
  const conCompleto = de('Completado')
  const conCurso = de('En curso')
  const conSinIniciar = de('Sin iniciar')
  const terminaron = conCompleto.length
  const enCurso = conCurso.length
  const sinIniciar = conSinIniciar.length
  const ver = (gente: PersonaDelPlan[], titulo: string, terminadas = false) =>
    gente.length ? { onVer: () => onLista({ titulo, personas: gente, terminaron: terminadas }), etiquetaVer: `Ver las personas: ${titulo}` } : {}
  const nunca = filas.filter((f) => f.ultimoAcceso === null && f.progreso === 0).length
  // Días del plan, contando el de inicio y el de cierre.
  const duracion = Math.max(1, diasDesde(plan.inicio) - diasDesde(plan.fin) + 1)
  const dia = Math.min(duracion, Math.max(1, diasDesde(plan.inicio) + 1))
  const faltan = Math.max(0, -diasDesde(plan.fin))
  const termino = plan.estado === 'No vigente'
  return [
    {
      id: 'terminaron',
      titulo: 'Terminaron todo',
      valor: `${porcentaje(terminaron, total)} %`,
      ayuda: `Personas que terminaron todos sus ${textos.items}. Cuenta a quienes llegaron al 100 %, no el promedio de avances. Se actualiza cada 30 minutos.`,
      detalle: `${numero(terminaron)} de ${personas(total)}`,
      avance: porcentaje(terminaron, total),
      color: 'var(--color-success)',
      ...ver(conCompleto, `${personas(terminaron)} ${plural(terminaron, 'terminó', 'terminaron')} todo`, true),
    },
    {
      id: 'en-curso',
      titulo: 'En curso',
      valor: numero(enCurso),
      ayuda: `Personas que ya hicieron al menos uno de sus ${textos.items}, pero no todos.`,
      detalle: `${porcentaje(enCurso, total)} % de las personas`,
      anillo: porcentaje(enCurso, total),
      color: 'var(--color-info)',
      ...ver(conCurso, `${personas(enCurso)} en curso`),
    },
    {
      id: 'sin-iniciar',
      titulo: 'Sin iniciar',
      valor: numero(sinIniciar),
      ayuda: `Personas que todavía no terminan ninguno de sus ${textos.items}. Algunas ya entraron; las que nunca han entrado se cuentan aparte.`,
      detalle: nunca ? `${numero(nunca)} ${plural(nunca, 'nunca ha entrado', 'nunca han entrado')}` : `${porcentaje(sinIniciar, total)} % de las personas`,
      anillo: porcentaje(sinIniciar, total),
      color: 'var(--color-warning)',
      ...ver(conSinIniciar, `${personas(sinIniciar)} sin iniciar`),
    },
    termino
      ? {
          id: 'tiempo',
          titulo: 'Tiempo del plan',
          valor: 'Terminó',
          ayuda: 'El plan ya pasó su fecha de cierre: lo que se estudie ahora ya no cuenta para el plan.',
          detalle: `Cerró el ${fechaCorta(plan.fin)} · duró ${numero(duracion)} días`,
          avance: 100,
        }
      : {
          id: 'tiempo',
          titulo: 'Tiempo del plan',
          valor: faltan ? `${numero(faltan)} ${plural(faltan, 'día', 'días')}` : 'Cierra hoy',
          ayuda: 'Cuántos días quedan para la fecha de cierre. Lo que se estudie después ya no cuenta para el plan.',
          detalle: `Cierra el ${fechaCorta(plan.fin)} · día ${numero(dia)} de ${numero(duracion)}`,
          avance: porcentaje(dia, duracion),
        },
  ]
}

export function Progreso({
  plan,
  onVer,
  onRecordar,
}: {
  plan: Plan
  onVer: (p: Participante) => void
  onRecordar: (p: Participante[]) => void
}) {
  const personasPlan = personasDelPlan(plan)
  const filas = useMemo<FilaPersona[]>(
    () =>
      personasPlan.map((f) => {
        const asignacion = plan.asignaciones.find((a) => a.id === f.asignacionId)
        const otras = f.asignaciones.length - 1
        const nombre = asignacion ? nombreAsignacion(asignacion) : 'Agregada aparte'
        return { ...f, avance: avanceDe(f), asignacion: otras > 0 ? `${nombre} y ${otras} más` : nombre }
      }),
    [personasPlan, plan.asignaciones],
  )
  // La lista detrás de un caso de «Para atender», en un panel. Se desmonta después de la animación de salida.
  const [lista, setLista] = useState<{ lista: ListaAvance; abierto: boolean; vez: number } | null>(null)
  const cerrarLista = () => {
    setLista((actual) => (actual ? { ...actual, abierto: false } : actual))
    window.setTimeout(() => setLista((actual) => (actual && !actual.abierto ? null : actual)), SALIDA_PANEL)
  }
  const abrirLista = (elegida: ListaAvance) => setLista((actual) => ({ lista: elegida, abierto: true, vez: (actual?.vez ?? 0) + 1 }))
  const alertas = alertasDelPlan(plan, personasPlan, abrirLista)
  const metricas = metricasDelPlan(plan, personasPlan, abrirLista)
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
    // Siete columnas no caben en el marco (1.104 px) con el asidero y el cambio de ancho: se apagan, como en Vacantes.
    layout: { reorderable: false, resizable: false },
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
                  else notify('No hay a quién recordarle', 'Las personas elegidas ya terminaron el plan.', 'info')
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
      {/* Lo que necesita atención, las cifras y la tabla, como el inicio de Contenidos. */}
      <BloqueAtencion alertas={alertas} etiqueta="Lo que necesita atención en el plan" />
      {lista ? <PanelPersonasAvance key={lista.vez} plan={plan} lista={lista.lista} abierto={lista.abierto} onAbiertoChange={(abierto) => (abierto ? undefined : cerrarLista())} /> : null}
      <MetricasDestacadas metricas={metricas} etiqueta="Avance del plan" />
      <AccionesPersona.Provider value={{ onVer, onRecordar: vigente ? onRecordar : undefined }}>
        <div onClick={abrirFila} className={FILAS_CLICABLES}>
          <TablaDatos key={version} config={config} data={visibles} paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: resultado.length }} nombre="personas" id="personas-plan" />
        </div>
      </AccionesPersona.Provider>
    </>
  )
}
