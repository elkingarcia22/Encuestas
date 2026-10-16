import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Agreement01Icon,
  Cancel01Icon,
  FullScreenIcon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  Award01Icon,
  Briefcase06Icon,
  FileImportIcon,
  FolderRemoveIcon,
  ViewIcon,
  LanguageSkillIcon,
  MoneyBag02Icon,
  PencilEdit02Icon,
  PlusSignIcon,
  Settings01Icon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Button,
  Card,
  cn,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  IconTile,
  Item,
  ItemContent,
  ItemMedia,
  Progress,
  ScrollArea,
  ScrollBar,
  Heading,
  Separator,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  TrafficLight,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { notify } from '@/shared/components/notify'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { useVentanasEnPanel } from '@/modules/design-system/drawers/components/drawer-anidado'
import { BarraSegmentada } from '@/modules/design-system/templates/dashboard/components/graficos'
import { pesos } from '../../vacantes/detalle/components/data'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { setRightPanelOpen } from '@/shared/components/right-panel-store'
import { AgentDock, ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import {
  agregarVacante,
  primeraEtapaDe,
  siguienteEtapaDe,
  VACANTES_UI,
  buscarVacanteUI,
  type Candidatura,
  type VacanteUI,
  type Veredicto,
} from '../../propuestas/datos'
import { AccionesVacante, EstadoVacante } from '../../propuestas/components/acciones-vacante'
import { eliminarVacantes } from './inicio/acciones'
import { estadoInicio } from './inicio/estado'
import { cambiosDeEtapa, registroDeMovimientos } from '../../propuestas/movimientos'
import { permisoEn } from '../../propuestas/permisos'
import { AgenteVacante } from '../../propuestas/components/agente-vacante'
import { AgregarCandidatos } from '../../propuestas/components/agregar-candidatos'
import { FichaPersona, pestanaParaEtapa } from '../../propuestas/components/ficha-persona'
import { PestanaCvs, useImportaciones } from '../../propuestas/components/importar-cvs'
import { useProceso, type Cambio } from '../../propuestas/components/use-proceso'
import { AvisoVacanteCerrada, BarraTablero, PieTablero, TableroColumnas, useTablero, type Tablero } from '../../propuestas/components/tablero-candidatos'
import { BarraEnLote } from './acciones-en-lote'
import { AvatarEsqueleto, Esqueleto, LineaEsqueleto, useCarga } from '../../propuestas/components/carga'

// Exploración 1 — dentro de la vacante.
//
// 29 sep, reunión con Elkin: los candidatos se trabajan en el TABLERO KANBAN. La bandeja (lista con la ficha siempre
// abierta al lado y el teclado J/K/A/R) mostraba demasiado a la vez; en el tablero la acción es la que más se hace,
// mover de etapa, y la ficha se abre en un panel solo cuando se necesita («Sí, esa es como la mejor»). El panel abre
// en la pestaña que sirve para la etapa en la que está la persona (lo decide `pestanaParaEtapa`, de la ficha).
//
// Pestañas: Candidatos (el tablero, primero y por defecto: el 90 % del tiempo se pasa ahí) · La vacante · CVs
// importados. La información de la vacante casi no se consulta: la cabecera quedó corta y el detalle vive en su
// pestaña. Arriba quedan las tres acciones que más se usan (Compartir, Importar CVs, Orbit Flow); editar está en «⋯» y
// lleva a la misma creación por pasos de Elkin, en modo edición.

type Pestana = 'candidatos' | 'vacante' | 'cvs' | 'actividad'

// Las tres caras de una vacante, como switch y **dentro** de la tarjeta, igual que «Vacantes / Mis candidatos»
// en la lista (22 sep). Subrayadas y colgando de la cabecera parecían navegación de la página; aquí se lee que
// son tres formas de mirar lo mismo. Respeta el mismo margen lateral que la tabla de abajo: el switch tiene
// fondo propio, así que se alinea por su caja y no por su texto.
// Genérica en la pestaña: cada exploración tiene las suyas. «Candidatos» es siempre el tablero kanban, como en el
// producto; `primera` es la forma de trabajar propia de cada exploración, que va al lado, nunca escondida detrás de un
// cambio de vista (24 sep): «Pipeline» en la 2 y «Revisar» en la 3. Va antes que el tablero salvo cuando la vacante
// abre en él (`tableroPrimero`: la 2 desde el 27 sep). La 1 no tiene forma propia: desde el 29 sep su única vista de
// candidatos es el tablero.
export function BarraPestanas<P extends string = Pestana>({
  pestana,
  onPestana,
  candidatos,
  lotes,
  primera,
  tableroPrimero = false,
  extra,
}: {
  pestana: P
  onPestana: (valor: P) => void
  candidatos?: number
  lotes: number
  primera?: { valor: P; etiqueta: string; cuenta?: number }
  // El tablero antes que la forma propia, cuando la vacante abre en él (la 2, desde el 27 sep).
  tableroPrimero?: boolean
  // Al otro lado de la fila (en «Reclutamiento», cuánta gente libre de la base le sirve a la vacante).
  extra?: ReactNode
}) {
  const propia = primera ? (
    <TabsTrigger value={primera.valor}>
      {primera.etiqueta}
      {primera.cuenta ? (
        <Badge variant="secondary" className="tabular-nums">
          {primera.cuenta}
        </Badge>
      ) : null}
    </TabsTrigger>
  ) : null
  const tablero =
    candidatos !== undefined ? (
      <TabsTrigger value="candidatos">
        Candidatos
        <Badge variant="secondary" className="tabular-nums">
          {candidatos}
        </Badge>
      </TabsTrigger>
    ) : null
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
      {/* En el celular las pestañas se deslizan en vez de cortarse (VA-22). */}
      <Tabs value={pestana} onValueChange={(valor) => onPestana(valor as P)} className="min-w-0 max-w-full">
        <TabsList variant="view" className="max-w-full overflow-x-auto">
          {tableroPrimero ? tablero : propia}
          {tableroPrimero ? propia : tablero}
          <TabsTrigger value="vacante">La vacante</TabsTrigger>
          <TabsTrigger value="cvs">
            CVs importados
            {lotes ? (
              <Badge variant="secondary" className="tabular-nums">
                {lotes}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="actividad">Actividad</TabsTrigger>
        </TabsList>
      </Tabs>
      {extra ? <div className="ml-auto">{extra}</div> : null}
    </div>
  )
}

// La fila de una persona mientras carga, con los altos exactos de la fila de «Mis candidatos» (la usa esa lista; la
// bandeja que también la usaba salió el 29 sep): casilla (sin cara: los candidatos no tienen foto, 8 oct), el nombre con su insignia (19,25px de línea),
// lo que hace (21px) y la tercera línea (20px más 2 de aire). Sin `ItemDescription`, que es un párrafo y no admite los
// bloques del esqueleto.
export function FilaPersonaCargando({ conCasilla = true }: { conCasilla?: boolean }) {
  return (
    <Item size="sm" className="items-start! rounded-lg!">
      {conCasilla ? (
        <ItemMedia className="h-8">
          <Skeleton className="size-4 rounded-sm" />
        </ItemMedia>
      ) : null}
      <ItemContent className="min-w-0! gap-0.5!">
        <div className="flex h-[19.25px] w-full items-center gap-2">
          <Skeleton className="h-3.5 w-2/5" />
          <Skeleton className="ms-auto h-4 w-9 shrink-0" />
        </div>
        <LineaEsqueleto className="h-[21px] py-1" ancho="w-3/4" />
        <div className="pt-0.5">
          <LineaEsqueleto className="py-0.5" ancho="w-3/5" />
        </div>
      </ItemContent>
    </Item>
  )
}

// Cabecera de la vacante: nombre, estado, una línea corta del puesto y sus acciones. La comparten las exploraciones 1, 2
// y 4; `extra` va al final de la fila (el «Orbit Flow», que siempre es el último). `seccion` es de dónde cuelga en la miga
// y a dónde vuelve la flecha: «Vacantes» o, en la 4, «Reclutamiento».
//
// 29 sep, reunión con Elkin: la información de la vacante casi no se consulta (el 90 % del tiempo se pasa en el
// tablero) y arriba se veía apretada. Queda una sola línea —área, sede y modalidad, días abierta—; las aplicaciones ya
// las cuentan las pestañas y quién la trabaja se ve en las caras de «Compartir».
export function CabeceraVacante({
  ruta,
  seccion = 'Vacantes',
  vacante,
  onCambio,
  onImportar,
  onEditar,
  onTerminar,
  compartir,
  extra,
}: {
  ruta: string
  seccion?: string
  vacante: VacanteUI
  onCambio: (cambio: Partial<VacanteUI>) => void
  onImportar: () => void
  // Editar en la creación por pasos (la 1 y la 4). Sin esto, el editor de siempre.
  onEditar?: () => void
  // Un borrador al que le falta algo: «Publicar» lleva a terminarlo en el paso pendiente.
  onTerminar?: (paso: number) => void
  // «Compartir» abierto desde la pantalla (al llegar de publicar).
  compartir?: { abierto: boolean; onAbierto: (abierto: boolean) => void }
  extra?: ReactNode
}) {
  const navigate = useNavigate()
  // Lo que puede hacer quien mira (VA-11): sin ser dueña no publica, no cierra ni elimina; con «Solo ver» no importa
  // ni edita.
  const permiso = permisoEn(vacante)
  // Eliminar la saca de verdad de la lista de la sesión (Vacantes, el Dashboard y Mis candidatos dejan de verla), y
  // «Deshacer» la devuelve una sola vez al mismo lugar (VA-03).
  const deshacerEliminar = useRef<(() => void) | null>(null)
  return (
    <PageHeader
      breadcrumbs={[
        { label: 'Inicio', path: '/admin' },
        { label: 'Selección' },
        { label: seccion, path: ruta },
        { label: vacante.titulo },
      ]}
      back={{ label: seccion, to: ruta, variant: 'icon' }}
      title={vacante.titulo}
      badge={
        <EstadoVacante
          vacante={vacante}
          onCambio={onCambio}
          soloLectura={!permiso.administra}
          onTerminar={onTerminar ? (_, paso) => onTerminar(paso) : undefined}
        />
      }
      meta={
        <>
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon icon={Briefcase06Icon} size={15} />
            {vacante.area}
          </span>
          {/* Una vacante remota tiene «Remoto» de sede y de modalidad: se dice una vez. */}
          <span>{vacante.modalidad === vacante.sede ? vacante.sede : `${vacante.sede} · ${vacante.modalidad}`}</span>
          <span>{vacante.estado === 'Borrador' ? 'Sin publicar' : vacante.diasAbierta === 0 ? 'Abierta hoy' : vacante.diasAbierta === 1 ? '1 día abierta' : `${vacante.diasAbierta} días abierta`}</span>
        </>
      }
      actions={
        <>
          <AccionesVacante
            vacante={vacante}
            onCambio={onCambio}
            onEliminar={() => {
              deshacerEliminar.current = eliminarVacantes(VACANTES_UI.filter((una) => una.id === vacante.id))
              navigate(ruta)
            }}
            // «Deshacer» tiene que devolverla de verdad: si no, es un botón que miente.
            onRestaurar={() => {
              if (deshacerEliminar.current) deshacerEliminar.current()
              else if (!buscarVacanteUI(vacante.id)) agregarVacante(vacante)
              deshacerEliminar.current = null
              navigate(`${ruta}/${vacante.id}`)
            }}
            onEditar={onEditar}
            compartir={compartir}
            permiso={permiso}
            primario={
              permiso.trabaja && vacante.estado !== 'Cerrada' ? (
                <Button onClick={onImportar}>
                  <HugeiconsIcon icon={FileImportIcon} size={16} />
                  Importar CVs
                </Button>
              ) : null
            }
          />
          {extra}
        </>
      }
    />
  )
}

// La actividad de la vacante (VA-35): cada cambio de la sesión, con quién lo hizo y lo que dejó (saltos, correos,
// invitaciones). Lo que se deshace sale de aquí: lo deshecho no pasó.
function ActividadVacante({ vacante, personas }: { vacante: VacanteUI; personas: Candidatura[] }) {
  const registro = useSyncExternalStore(registroDeMovimientos.suscribir, registroDeMovimientos.leer)
  const porId = new Map(personas.map((c) => [c.id, c]))
  const suyos = [...registro].filter((movimiento) => porId.has(movimiento.candidaturaId)).reverse()
  if (!suyos.length)
    return (
      <PrimeraVez
        className="py-12"
        icono="glass-clock"
        titulo="Todavía no hay actividad en esta visita"
        descripcion="Cuando alguien mueva, rechace, escriba o sume gente, queda aquí con su nombre y la hora."
      />
    )
  return (
    <div className="flex flex-col divide-y px-5">
      {suyos.map((movimiento) => {
        const cambio = cambiosDeEtapa(porId.get(movimiento.candidaturaId)!, vacante.etapas, [movimiento])[0]
        return (
          <div key={movimiento.id} className="flex flex-col gap-1 py-3">
            <Text as="p" size="sm">
              <Text as="span" size="sm" weight="medium">
                {cambio.quien}
              </Text>{' '}
              · {porId.get(movimiento.candidaturaId)?.candidato.nombre}: {cambio.titulo.charAt(0).toLowerCase() + cambio.titulo.slice(1)}
            </Text>
            <Text as="p" size="xs" variant="muted">
              {[cambio.cuando, ...cambio.marcas.map((marca) => marca.texto), cambio.comentario ? `«${cambio.comentario}»` : ''].filter(Boolean).join(' · ')}
            </Text>
          </div>
        )
      })}
    </div>
  )
}

// Pasar de una persona a otra dentro del panel lateral (29 sep, reunión con Elkin: el «1 de 31» se veía raro, pegado al
// borde de arriba y sin decir de qué). Va debajo de la cabecera del panel, con aire: «Anterior» a un lado, «Siguiente»
// al otro —con el nombre de quién sigue en el globo— y en medio en qué persona se va y de dónde.
// El ancho del panel lateral en el celular: la variable que la librería usa para su ancho, solo por debajo de 640 px.
const ANCHO_EN_CELULAR = { '--drawer-content-width': 'calc(100vw - 1.5rem)' } as CSSProperties

export function NavegacionPanel({
  indice,
  total,
  donde,
  anterior,
  siguiente,
  onAnterior,
  onSiguiente,
}: {
  indice: number
  total: number
  // De qué recorrido: «del tablero», «en Evaluación CV»…
  donde?: string
  anterior?: string
  siguiente?: string
  onAnterior: () => void
  onSiguiente: () => void
}) {
  return (
    <div className="flex items-center gap-2 border-b px-3 py-2">
      <Hint label={anterior ? `Anterior: ${anterior}` : 'Es la primera'}>
        <Button variant="ghost" size="sm" disabled={!anterior} onClick={onAnterior} aria-label={anterior ? `Anterior: ${anterior}` : 'Anterior'}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          <span className="max-sm:sr-only">Anterior</span>
        </Button>
      </Hint>
      {/* En el celular las flechas van solas y el contador se lee entero: antes quedaba «6 de …» (CA-33). */}
      <Text as="span" variant="muted" size="sm" role="status" className="min-w-0 flex-1 truncate text-center tabular-nums">
        {indice + 1} de {total}
        {donde ? <span className="max-sm:hidden"> {donde}</span> : null}
      </Text>
      <Hint label={siguiente ? `Siguiente: ${siguiente}` : 'Es la última'}>
        <Button variant="ghost" size="sm" disabled={!siguiente} onClick={onSiguiente} aria-label={siguiente ? `Siguiente: ${siguiente}` : 'Siguiente'}>
          <span className="max-sm:sr-only">Siguiente</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </Button>
      </Hint>
    </div>
  )
}

// Pestaña «La vacante». Glow up del 24 sep (Nicolás: «de verdad se ve horrible… glow up al 10000 %»): antes eran
// catorce cajas grises del mismo peso apiladas en dos columnas (el puesto, una barra azul gruesa por requisito, las
// etapas como una lista larga y siete condiciones una debajo de otra). Ahora son cuatro bloques con el lenguaje de
// los del Inicio (Frame con borde doble, cifras en seminegrita, leyenda con TrafficLight), cada uno con su forma:
// 1. Las condiciones, en una franja de cifras: lo que la cabecera no dice (salario, experiencia, contrato, idioma),
//    con lo que dice la gente en proceso cuando aporta algo (cuántos piden dentro del rango).
// 2. El puesto: el texto a un ancho de lectura cómodo y, debajo, quién la trabaja. (29 sep, reunión con Elkin: al lado
//    se veía raro —con una descripción corta la columna quedaba más alta que el texto y con una larga se perdía—. Una
//    descripción larga se recorta con «Ver todo». Las etiquetas, que son las carpetas del producto, viven en la tabla de
//    Vacantes desde el 8 oct: no se repiten aquí.)
// 3. Lo que se pide: cada requisito con cómo lo cumple la gente en proceso según la IA, en una barra por veredicto
//    (verde cumple, ámbar a medias, rojo no, gris por validar), y el que menos se cumple, señalado.
// 4. El proceso: las etapas en fila, como un embudo, con cuánta gente hay en cada una y dónde se acumula.
// Cada bloque trae su acción con nombre, que abre el editor en su paso. La comparten las tres exploraciones: la
// vacante es el mismo objeto en todas. En la 1 editar lleva a la creación por pasos de Elkin (29 sep), por eso cada
// acción dice además qué sección se quiere cambiar: la pantalla decide a qué paso va.

export type SeccionVacante = 'condiciones' | 'puesto' | 'requisitos' | 'etapas'

// Más allá de cinco párrafos o de unas 700 letras, el texto se recorta y se abre con «Ver todo».
const LETRAS_SIN_RECORTE = 700


const VEREDICTOS: { id: Veredicto; nombre: string; color: string }[] = [
  { id: 'cumple', nombre: 'Cumplen', color: 'var(--success)' },
  { id: 'parcial', nombre: 'A medias', color: 'var(--warning)' },
  { id: 'no-cumple', nombre: 'No cumplen', color: 'var(--destructive)' },
  // El gris del texto secundario, no uno mezclado con el fondo: ese se perdía en modo oscuro.
  { id: 'por-validar', nombre: 'Por validar', color: 'var(--muted-foreground)' },
]

// El proceso, siempre en una sola fila: de izquierda a derecha, en el orden en que lo recorre cada persona, como el
// tablero de candidatos. Las etapas se reparten el ancho; si no caben a su mínimo (10rem: el nombre en dos líneas sin
// cortarse a mitad de palabra), la fila se desplaza de lado con su barra, igual que el tablero. Así 5, 8 o 12 etapas
// se leen igual (1 oct, Nicolás: «¿qué sucede cuando son muchas más etapas?»; antes, desde siete bajaban a filas de a
// cuatro sin divisores y se perdía el orden). Con el agente abierto la página se angosta y la barra aparece antes.
const ANCHO_ETAPA = '10rem'
const CELDA_ETAPA = 'flex min-w-0 flex-col gap-2 px-3 first:ps-0 last:pe-0'

function FilaEtapas({ cuantas, children }: { cuantas: number; children: ReactNode }) {
  return (
    <FramePanel className="[--frame-panel-px:0px] [--frame-panel-py:0px]">
      <ScrollArea className="w-full">
        <div
          className="grid divide-x p-4"
          style={{ gridTemplateColumns: `repeat(${cuantas}, minmax(0, 1fr))`, minWidth: `calc(${cuantas} * ${ANCHO_ETAPA} + 2rem)` }}
        >
          {children}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </FramePanel>
  )
}

const personasEn = (n: number) => `${n} ${n === 1 ? 'persona' : 'personas'}`

// Cabecera de cada bloque: título, una frase y su acción con nombre a la derecha.
// El tablero a pantalla completa, por encima del menú y del header (8 oct, Nicolás: «debería haber una opción para poder
// ver todo el canvas ampliado, que quede hermoso y se pueda ver todo el kanban»). Una franja arriba con de qué vacante es,
// los filtros, «Agregar candidatos» y la X para cerrar; abajo, las columnas a todo lo ancho, sin caja. La ficha se abre
// encima, como siempre.
function TableroAmpliable({ vacante, ampliado, onReducir, children }: { vacante: VacanteUI; ampliado: boolean; onReducir: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!ampliado) return
    const alTeclear = (evento: KeyboardEvent) => {
      // Escape cierra primero lo que esté encima (la ficha, un menú, una ventana): reduce solo si el foco está en el tablero.
      const foco = document.activeElement
      const enTablero = !foco || foco === document.body || Boolean(foco.closest('[data-tablero]'))
      if (evento.key !== 'Escape' || !enTablero || document.querySelector('[role=menu], [role=listbox]')) return
      onReducir()
    }
    // En captura: la tarjeta enfocada (se puede arrastrar con teclado) se queda con el Escape si se escucha después.
    document.addEventListener('keydown', alTeclear, true)
    return () => document.removeEventListener('keydown', alTeclear, true)
  }, [ampliado, onReducir])
  if (!ampliado) return <>{children}</>
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Tablero de ${vacante.titulo}`}
      data-tablero=""
      className="fixed inset-0 z-40 flex flex-col bg-background animate-in duration-200 fade-in-0 zoom-in-[0.98]"
    >
      {/* Sin marco ni caja: la barra del tablero es la franja de arriba (con el nombre y «Cerrar») y las columnas
          ocupan todo lo demás (8 oct, Nicolás: «ya ampliado no debería estar encerrado»). */}
      {children}
    </div>,
    document.body,
  )
}

// El marco del tablero: la tarjeta de siempre o, a pantalla completa, nada (las columnas van sobre el fondo).
function MarcoTablero({ ampliado, children }: { ampliado: boolean; children: ReactNode }) {
  if (ampliado) return <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
  return <Card className="relative gap-0! overflow-hidden py-0!">{children}</Card>
}

function CabeceraBloque({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string
  descripcion: ReactNode
  accion?: { etiqueta: string; icono: IconSvgElement; onClick: () => void }
}) {
  return (
    <FrameHeader className="flex flex-row items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <FrameTitle>{titulo}</FrameTitle>
        <FrameDescription>{descripcion}</FrameDescription>
      </div>
      {accion ? (
        <Button variant="outline" size="sm" className="shrink-0" onClick={accion.onClick}>
          <HugeiconsIcon icon={accion.icono} size={16} />
          {accion.etiqueta}
        </Button>
      ) : null}
    </FrameHeader>
  )
}

export function PestanaVacante({
  vacante,
  dentro,
  onEditar,
}: {
  vacante: VacanteUI
  dentro: Candidatura[]
  // Abre el editor de la vacante en un paso del editor de siempre (1 el puesto y los requisitos, 2 las etapas) y dice
  // qué sección se quiere cambiar, para la creación por pasos de la 1.
  onEditar?: (paso: number, seccion: SeccionVacante) => void
}) {
  const n = dentro.length
  const [todoElTexto, setTodoElTexto] = useState(false)
  const letras = vacante.descripcion.reduce((suma, parrafo) => suma + parrafo.length, 0)
  const recortable = vacante.descripcion.length > 5 || letras > LETRAS_SIN_RECORTE
  // Recortado: los párrafos que entren en el límite, al menos uno.
  const parrafos = (() => {
    if (!recortable || todoElTexto) return vacante.descripcion
    const visibles: string[] = []
    let cuenta = 0
    for (const parrafo of vacante.descripcion) {
      if (visibles.length && cuenta + parrafo.length > LETRAS_SIN_RECORTE * 0.6) break
      visibles.push(parrafo)
      cuenta += parrafo.length
    }
    return visibles
  })()
  const [minimo, maximo] = vacante.rango
  const enRango = dentro.filter((c) => c.candidato.pretension >= minimo && c.candidato.pretension <= maximo).length
  const encima = dentro.filter((c) => c.candidato.pretension > maximo).length

  // Cómo cumple la gente en proceso cada requisito, contado por veredicto.
  const porRequisito = vacante.requisitos.map((requisito, indice) => ({
    requisito,
    cuenta: Object.fromEntries(
      VEREDICTOS.map(({ id }) => [id, dentro.filter((c) => c.criterios[indice]?.veredicto === id).length]),
    ) as Record<Veredicto, number>,
  }))
  const cumplenDe = (indice: number) => porRequisito[indice]?.cuenta.cumple ?? 0
  // El que menos se cumple, si hay gente y no lo cumplen todos: es el que decide quién pasa.
  const indiceDificil = n
    ? porRequisito.reduce((menor, _, indice) => (cumplenDe(indice) < cumplenDe(menor) ? indice : menor), 0)
    : -1
  const dificil = indiceDificil >= 0 && cumplenDe(indiceDificil) < n ? indiceDificil : -1
  const condiciones: { etiqueta: string; valor: string; detalle?: string; aviso?: string; icono: IconSvgElement }[] = [
    {
      etiqueta: 'Salario al mes',
      valor: `${pesos(minimo)} a ${pesos(maximo)}`,
      detalle: n ? `${enRango} de ${n} piden dentro del rango` : 'Nadie en proceso todavía',
      aviso: encima ? `${encima} por encima` : undefined,
      icono: MoneyBag02Icon,
    },
    { etiqueta: 'Experiencia', valor: vacante.experiencia, detalle: vacante.seniority, icono: Award01Icon },
    { etiqueta: 'Contrato', valor: vacante.contrato, detalle: `Modalidad ${vacante.modalidad.toLowerCase()}`, icono: Agreement01Icon },
    {
      etiqueta: 'Idioma',
      valor: vacante.idioma,
      detalle: vacante.idioma === 'No requerido' ? 'No es requisito' : 'Entra en los requisitos',
      icono: LanguageSkillIcon,
    },
  ]

  const enEtapa = vacante.etapas.map((etapa) => dentro.filter((c) => c.etapa === etapa.id).length)
  const mayor = Math.max(0, ...enEtapa)
  // «Aquí se acumula» solo si una etapa tiene más gente que todas las demás: con empate no dice nada.
  const acumula = mayor > 0 && enEtapa.filter((cuantos) => cuantos === mayor).length === 1 ? enEtapa.indexOf(mayor) : -1

  // La pestaña carga al abrirla. Mientras tanto, los cuatro bloques ya tienen su título, sus botones de editar y sus
  // rótulos fijos (qué es cada cosa no depende de los datos); lo que viene de la vacante y de la gente va en gris, en su
  // mismo lugar: las cuatro condiciones, el texto y el equipo del puesto, una fila por requisito y una columna por etapa.
  const cargando = useCarga()
  if (cargando) {
    return (
      <Esqueleto etiqueta="Cargando la vacante" className="@container flex flex-col gap-5 p-5">
        <Frame>
          <FramePanel className="grid gap-5 @lg:grid-cols-2 @4xl:grid-cols-4 @4xl:gap-0 @4xl:divide-x">
            {condiciones.map((condicion) => (
              <div key={condicion.etiqueta} className="flex min-w-0 items-start gap-3 @4xl:px-5 @4xl:first:ps-0 @4xl:last:pe-0">
                <IconTile variant="soft" size="sm" className="shrink-0">
                  <HugeiconsIcon icon={condicion.icono} aria-hidden="true" />
                </IconTile>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Text as="span" variant="muted" size="sm">
                    {condicion.etiqueta}
                  </Text>
                  <span className="flex h-7 items-center">
                    <Skeleton className="h-5 w-4/5" />
                  </span>
                  <LineaEsqueleto tamano="chico" ancho="w-3/5" />
                  {condicion.aviso ? <Skeleton className="mt-0.5 h-4.5 w-20" /> : null}
                </div>
              </div>
            ))}
          </FramePanel>
        </Frame>

        <Frame>
          <CabeceraBloque
            titulo="Sobre el puesto"
            descripcion="Lo que lee quien la encuentra en el portal de empleo."
            accion={onEditar ? { etiqueta: 'Editar el puesto', icono: PencilEdit02Icon, onClick: () => onEditar(1, 'puesto') } : undefined}
          />
          <FramePanel className="flex flex-col gap-3">
            {/* Tantas líneas como ocupará cada párrafo (unas 110 letras por línea a ancho de lectura). */}
            {(parrafos.length ? parrafos : ['']).map((parrafo, i) => (
              <div key={i} className="flex max-w-prose flex-col">
                {Array.from({ length: Math.max(1, Math.ceil(parrafo.length / 110)) }, (_, linea, lineas = Math.max(1, Math.ceil(parrafo.length / 110))) => (
                  <LineaEsqueleto key={linea} className="h-6" ancho={linea === lineas - 1 ? 'w-3/5' : 'w-full'} />
                ))}
              </div>
            ))}
          </FramePanel>
          <FramePanel>
            <div className="flex flex-col gap-3">
              <Text as="span" variant="muted" size="sm">
                Quién la trabaja
              </Text>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {vacante.equipo.map((miembro) => (
                  <div key={miembro.correo} className="flex min-w-0 items-center gap-2.5">
                    <AvatarEsqueleto size="sm" />
                    <div className="flex w-32 flex-col">
                      <LineaEsqueleto ancho="w-4/5" />
                      <LineaEsqueleto tamano="chico" ancho="w-3/5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FramePanel>
        </Frame>

        <Frame>
          <CabeceraBloque
            titulo={vacante.requisitos.length ? `Lo que se pide · ${vacante.requisitos.length} ${vacante.requisitos.length === 1 ? 'requisito' : 'requisitos'}` : 'Lo que se pide'}
            descripcion={
              <span className="flex items-center gap-1.5">
                <IconoIA />
                La IA mide con ellos a cada persona: cambiarlos cambia el «cumple 2 de 4» de todas.
              </span>
            }
            accion={onEditar ? { etiqueta: 'Editar requisitos', icono: PencilEdit02Icon, onClick: () => onEditar(1, 'requisitos') } : undefined}
          />
          <FramePanel className="flex flex-col divide-y py-0!">
            {vacante.requisitos.map((requisito, indice) => (
              <div key={requisito} className="grid items-center gap-x-5 gap-y-2 py-4 @2xl:grid-cols-[1.5rem_minmax(0,1fr)_minmax(10rem,16rem)_8rem]">
                <Text as="span" variant="muted" size="sm" className="tabular-nums max-@2xl:hidden">
                  {indice + 1}
                </Text>
                <LineaEsqueleto className="h-6" ancho="w-3/5" />
                <Skeleton className="h-2 w-full" />
                <LineaEsqueleto tamano="chico" ancho="w-4/5" />
              </div>
            ))}
            {n && vacante.requisitos.length ? (
              <div className="flex items-center justify-between gap-3 py-3">
                <LineaEsqueleto ancho="w-80 max-w-1/2" />
                <LineaEsqueleto ancho="w-48 max-w-1/3" />
              </div>
            ) : null}
          </FramePanel>
        </Frame>

        <Frame>
          <CabeceraBloque
            titulo={`El proceso · ${vacante.etapas.length} etapas`}
            descripcion="Las etapas propias de esta vacante, en el orden en que las recorre cada persona."
            accion={onEditar ? { etiqueta: 'Cambiar las etapas', icono: Settings01Icon, onClick: () => onEditar(2, 'etapas') } : undefined}
          />
          <FilaEtapas cuantas={vacante.etapas.length}>
            {vacante.etapas.map((etapa, indice) => (
              <div key={etapa.id} className={CELDA_ETAPA}>
                <div className="flex min-w-0 items-center gap-1.5">
                  <Text as="span" variant="muted" size="sm" className="tabular-nums">
                    {indice + 1}
                  </Text>
                  <LineaEsqueleto ancho="w-3/4" />
                </div>
                <span className="flex h-7 items-center">
                  <Skeleton className="h-5 w-16" />
                </span>
                <Skeleton className="h-2 w-full" />
                <div className="flex flex-col">
                  <LineaEsqueleto tamano="chico" ancho="w-full" />
                  <LineaEsqueleto tamano="chico" ancho="w-2/3" />
                </div>
                {indice === acumula || etapa.origen === 'propia' ? <Skeleton className="h-4 w-24" /> : null}
              </div>
            ))}
          </FilaEtapas>
        </Frame>
      </Esqueleto>
    )
  }

  return (
    <div className="@container flex flex-col gap-5 p-5">
      {/* 1 · Las condiciones, en cifras. */}
      <Frame>
        <FramePanel className="grid gap-5 @lg:grid-cols-2 @4xl:grid-cols-4 @4xl:gap-0 @4xl:divide-x">
          {condiciones.map((condicion) => (
            <div key={condicion.etiqueta} className="flex min-w-0 items-start gap-3 @4xl:px-5 @4xl:first:ps-0 @4xl:last:pe-0">
              <IconTile variant="soft" size="sm" className="shrink-0">
                <HugeiconsIcon icon={condicion.icono} aria-hidden="true" />
              </IconTile>
              <div className="flex min-w-0 flex-col gap-0.5">
                <Text as="span" variant="muted" size="sm">
                  {condicion.etiqueta}
                </Text>
                <Text as="span" size="lg" weight="semibold" className="tabular-nums">
                  {condicion.valor}
                </Text>
                {condicion.detalle ? (
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Text as="span" variant="muted" size="xs">
                      {condicion.detalle}
                    </Text>
                    {/* Quien pide más de lo que paga la vacante: un dato que cambia la conversación, en ámbar. */}
                    {condicion.aviso ? (
                      <Badge variant="warning-light" className="tabular-nums">
                        {condicion.aviso}
                      </Badge>
                    ) : null}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </FramePanel>
      </Frame>

      {/* 2 · El puesto y, debajo, quién lo trabaja. */}
      <Frame>
        <CabeceraBloque
          titulo="Sobre el puesto"
          descripcion="Lo que lee quien la encuentra en el portal de empleo."
          accion={onEditar ? { etiqueta: 'Editar el puesto', icono: PencilEdit02Icon, onClick: () => onEditar(1, 'puesto') } : undefined}
        />
        <FramePanel className="flex flex-col gap-3">
          {vacante.descripcion.length ? (
            <>
              {parrafos.map((parrafo, i) => (
                <Text key={`${i}-${parrafo.slice(0, 24)}`} as="p" className="max-w-prose text-pretty">
                  {parrafo}
                </Text>
              ))}
              {recortable ? (
                <Button variant="link" size="sm" className="h-auto! w-fit p-0!" aria-expanded={todoElTexto} onClick={() => setTodoElTexto(!todoElTexto)}>
                  {todoElTexto ? 'Ver menos' : 'Ver todo'}
                  <HugeiconsIcon icon={todoElTexto ? ArrowUp01Icon : ArrowDown01Icon} size={14} />
                </Button>
              ) : null}
            </>
          ) : (
            <Text as="p" variant="muted">
              Todavía no tiene descripción. Se escribe desde «Editar el puesto».
            </Text>
          )}
        </FramePanel>
        <FramePanel>
          <section className="flex flex-col gap-3" aria-label="Quién la trabaja">
            <Text as="span" variant="muted" size="sm">
              Quién la trabaja
            </Text>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {vacante.equipo.map((miembro) => (
                <div key={miembro.correo} className="flex min-w-0 items-center gap-2.5">
                  <Avatar size="sm">
                    <AvatarFallback>{miembro.iniciales}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    <Text as="span" size="sm" weight="medium" className="truncate">
                      {miembro.nombre}
                    </Text>
                    <Text as="span" variant="muted" size="xs" className="truncate">
                      {miembro.permiso}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </FramePanel>
      </Frame>

      {/* 3 · Lo que se pide, y cómo lo cumple la gente según la IA. */}
      <Frame>
        <CabeceraBloque
          titulo={vacante.requisitos.length ? `Lo que se pide · ${vacante.requisitos.length} ${vacante.requisitos.length === 1 ? 'requisito' : 'requisitos'}` : 'Lo que se pide'}
          descripcion={
            <span className="flex items-center gap-1.5">
              <IconoIA />
              La IA mide con ellos a cada persona: cambiarlos cambia el «cumple 2 de 4» de todas.
            </span>
          }
          accion={onEditar ? { etiqueta: 'Editar requisitos', icono: PencilEdit02Icon, onClick: () => onEditar(1, 'requisitos') } : undefined}
        />
        <FramePanel className="flex flex-col divide-y py-0!">
          {porRequisito.length ? (
            porRequisito.map(({ requisito, cuenta }, indice) => (
              <div
                key={requisito}
                className="grid items-center gap-x-5 gap-y-2 py-4 @2xl:grid-cols-[1.5rem_minmax(0,1fr)_minmax(10rem,16rem)_8rem]"
              >
                <Text as="span" variant="muted" size="sm" className="tabular-nums max-@2xl:hidden">
                  {indice + 1}
                </Text>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Text as="span" weight="medium">
                    {requisito}
                  </Text>
                  {indice === dificil ? (
                    <Badge variant="warning-light">
                      El que menos se cumple
                    </Badge>
                  ) : n && cuenta.cumple === n ? (
                    <Badge variant="success-light">
                      Lo cumplen todos
                    </Badge>
                  ) : null}
                </div>
                {n ? (
                  <div aria-hidden="true">
                    <BarraSegmentada
                      segmentos={VEREDICTOS.filter(({ id }) => cuenta[id]).map(({ id, nombre, color }) => ({
                        id,
                        etiqueta: nombre,
                        valor: cuenta[id],
                        color,
                      }))}
                    />
                  </div>
                ) : (
                  <Text as="span" variant="muted" size="sm">
                    Sin gente para medir
                  </Text>
                )}
                {n ? (
                  <div className="flex items-baseline gap-1.5 whitespace-nowrap @2xl:justify-end">
                    <Text as="span" weight="semibold" className="tabular-nums">
                      {cuenta.cumple} de {n}
                    </Text>
                    <Text as="span" variant="muted" size="xs">
                      {cuenta.cumple === 1 ? 'cumple' : 'cumplen'}
                    </Text>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            // No todas las vacantes los tienen (29 sep, reunión con Elkin: es un caso de uso más, no un error).
            <PrimeraVez
              className="py-8"
              icono="glass-paper-plus"
              titulo="Esta vacante no tiene requisitos"
              descripcion="Sin ellos la IA no puede decir cuánto se ajusta cada persona a la vacante."
              accion={onEditar ? { texto: 'Agregar requisitos', icono: PlusSignIcon, onClick: () => onEditar(1, 'requisitos') } : undefined}
            />
          )}
          {/* Qué quiere decir cada color y sobre cuánta gente se mide, como pie del mismo bloque. */}
          {n && porRequisito.length ? (
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <TrafficLight
                data={{
                  label: 'Qué quiere decir cada color',
                  items: VEREDICTOS.map(({ nombre, color }) => ({ label: nombre, value: '', color })),
                }}
              />
              <Text as="span" variant="muted" size="sm">
                Sobre {personasEn(n)} en proceso
              </Text>
            </div>
          ) : null}
        </FramePanel>
      </Frame>

      {/* 4 · El proceso: las etapas en fila, con cuánta gente hay en cada una. */}
      <Frame>
        <CabeceraBloque
          titulo={`El proceso · ${vacante.etapas.length} etapas`}
          descripcion="Las etapas propias de esta vacante, en el orden en que las recorre cada persona."
          accion={onEditar ? { etiqueta: 'Cambiar las etapas', icono: Settings01Icon, onClick: () => onEditar(2, 'etapas') } : undefined}
        />
        <FilaEtapas cuantas={vacante.etapas.length}>
          {vacante.etapas.map((etapa, indice) => (
            <div key={etapa.id} className={CELDA_ETAPA}>
              <div className="flex min-w-0 items-start gap-1.5">
                <Text as="span" variant="muted" size="sm" className="tabular-nums">
                  {indice + 1}
                </Text>
                {/* Las etapas que hace la IA llevan su icono. */}
                {etapa.ia ? (
                  <span className="flex h-5 shrink-0 items-center">
                    <IconoIA />
                  </span>
                ) : null}
                <Text as="span" size="sm" weight="medium" className="line-clamp-2" title={etapa.titulo}>
                  {etapa.titulo}
                </Text>
              </div>
              <div className="flex items-baseline gap-1.5">
                <Text as="span" size="xl" weight="semibold" className="tabular-nums">
                  {enEtapa[indice]}
                </Text>
                <Text as="span" variant="muted" size="xs">
                  {enEtapa[indice] === 1 ? 'persona' : 'personas'}
                </Text>
              </div>
              {/* Qué parte de la gente en proceso está en esta etapa: el embudo, leído de izquierda a derecha. */}
              <Progress
                value={n ? (enEtapa[indice] / n) * 100 : 0}
                aria-label={`${enEtapa[indice]} de ${n} personas en ${etapa.titulo}`}
              />
              <Text as="p" variant="muted" size="xs" className="line-clamp-2">
                {etapa.descripcion}
              </Text>
              {/* Lo que distingue a la etapa, solo cuando aplica: dónde se acumula la gente y cuál es propia. */}
              {indice === acumula || etapa.origen === 'propia' ? (
                <div className="flex flex-wrap gap-1.5">
                  {indice === acumula ? (
                    <Badge variant="secondary">
                      Aquí se acumula
                    </Badge>
                  ) : null}
                  {etapa.origen === 'propia' ? (
                    <Badge variant="outline">
                      Propia de esta vacante
                    </Badge>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </FilaEtapas>
      </Frame>
    </div>
  )
}

const RUTA = '/admin/seleccion/exploraciones/uno'

// Vacantes donde ya se abrió Orbit Flow en esta visita: su punto de «algo nuevo» no vuelve a salir (OF-47).
const vistosPorAgente = new Set<string>()

// Los filtros puestos, dichos en palabras para el agente: «esperan respuesta · LinkedIn».
const textoDeFiltros = (filtros: Tablero['filtros']) =>
  [
    filtros.soloEspera ? 'esperan respuesta' : null,
    filtros.soloExEmpleados ? 'ex empleados' : null,
    filtros.lote ? `lote ${filtros.lote.nombre}` : null,
    filtros.minCumple !== null ? `cumplen ${filtros.minCumple} o más` : null,
    filtros.busqueda ? `«${filtros.busqueda}»` : null,
  ]
    .filter(Boolean)
    .join(' · ')

// Tarjetas por columna antes de abrir el resto en la misma columna (con 31 personas en una etapa, el tablero de la
// vacante de backend no se podía recorrer).
const TOPE_TABLERO = 10

// Hueco del marco general para Orbit Flow, debajo del header (ver RootLayout).
const sinSuscripcion = () => () => {}
function useHuecoDerecho() {
  return useSyncExternalStore(sinSuscripcion, () => document.getElementById('agent-panel-slot'))
}

// La edición por pasos (la creación de Elkin en modo edición) vive colgada de la exploración 1, también para la 4.
const RUTA_EDITAR = (id: string) => `${RUTA}/${id}/editar`

// En qué paso de la creación se cambia cada sección de «La vacante»: 1 Información (condiciones y requisitos), 2
// Descripción (el puesto), 3 Proceso de selección (las etapas).
const PASO_DE: Record<SeccionVacante, 1 | 2 | 3> = { condiciones: 1, requisitos: 1, puesto: 2, etapas: 3 }

// Dentro de una vacante, como la trabaja la exploración 1. La usan dos pantallas: «Vacantes 1» y la vacante abierta desde
// «Reclutamiento» (exploración 4), que cuelga de otra sección y suma el puente con la base junto a las pestañas.
//
// Llega con:
// - `?persona=<candidatura>`: abre el tablero con la ficha de esa persona (desde el inicio, «Lo que necesita tu
//   atención»). `?pestana=vacante|cvs` abre esa pestaña.
// - `state.publicada`: se acaba de publicar desde la creación; avisa y abre «Compartir», con el enlace.
type PropsVacante = {
  ruta: string
  seccion?: string
  extraPestanas?: (vacante: VacanteUI) => ReactNode
}

// Un enlace viejo, una notificación o una vacante recién eliminada: si la vacante no existe, se dice, en vez de abrir
// otra (VA-04). Antes caía en la primera de la lista y se podía trabajar ahí creyendo que era otra.
export function VacanteConTablero(props: PropsVacante) {
  const { vacanteId } = useParams()
  const guardada = buscarVacanteUI(vacanteId)
  if (!guardada) return <VacanteQueNoExiste ruta={props.ruta} seccion={props.seccion} />
  return <VacanteAbierta key={guardada.id} {...props} guardada={guardada} />
}

function VacanteQueNoExiste({ ruta, seccion = 'Vacantes' }: { ruta: string; seccion?: string }) {
  const navigate = useNavigate()
  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', path: '/admin' }, { label: 'Selección' }, { label: seccion, path: ruta }, { label: 'Vacante no encontrada' }]}
        back={{ label: seccion, to: ruta, variant: 'icon' }}
        title="Vacante no encontrada"
      />
      <PageContent>
        <Frame spacing="sm">
          <FramePanel>
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={FolderRemoveIcon} size={22} />
                </EmptyMedia>
                <EmptyTitle>Esta vacante no existe o fue eliminada</EmptyTitle>
                <EmptyDescription>
                  El enlace puede ser viejo, o alguien del equipo la eliminó. Sus candidatos siguen en Mis candidatos.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => navigate(ruta)}>Ir a {seccion}</Button>
              </EmptyContent>
            </Empty>
          </FramePanel>
        </Frame>
      </PageContent>
    </PageShell>
  )
}

function VacanteAbierta({ ruta, seccion, extraPestanas, guardada }: PropsVacante & { guardada: VacanteUI }) {
  const navigate = useNavigate()
  const location = useLocation()
  // La vacante se lleva en estado: desde la cabecera se publica, se esconde del portal y se elimina.
  const [vacante, setVacante] = useState<VacanteUI>(guardada)
  // El tablero a pantalla completa (8 oct): «Ampliar» en su barra; «Reducir» o Escape vuelven.
  const [ampliado, setAmpliado] = useState(false)
  // La X del tablero ampliado, arriba a la derecha (8 oct, Nicolás: «un cerrar a la derecha arriba en vez del reducir»).
  const cerrarAmpliado = (
    <Hint label="Cerrar (Esc)" side="bottom">
      <BotonIcono size="icon" aria-label="Cerrar el tablero ampliado" onClick={() => setAmpliado(false)}>
        <HugeiconsIcon icon={Cancel01Icon} size={18} aria-hidden="true" />
      </BotonIcono>
    </Hint>
  )
  // Si se entra a otra vacante sin recargar (o vuelve de editarse), se cambia la que se está mirando. Se ajusta durante
  // el render (el patrón de React para esto) en vez de con un efecto, que provocaría un segundo render con los datos
  // viejos.
  const [mirada, setMirada] = useState(guardada)
  if (mirada !== guardada) {
    setMirada(guardada)
    setVacante(guardada)
  }
  // Lo que cambia de la vacante (estado, portal, etapas, equipo, desenlace) se escribe también en la vacante compartida
  // de la sesión: al volver a la lista, a «Editar» o al Dashboard, se ve igual (VA-01).
  const cambiarVacante = (cambio: Partial<VacanteUI>) => {
    Object.assign(guardada, cambio)
    setVacante((actual) => ({ ...actual, ...cambio }))
    estadoInicio.tocar()
  }

  // Mover, rechazar, devolver y sumar gente: lo mismo en el tablero, la ficha y el agente (y en las otras
  // exploraciones). Mover se ve pasar: «Pasando a…», después «Pasó a…», y el aviso con «Deshacer».
  const proceso = useProceso(vacante, cambiarVacante)
  const tablero = useTablero(vacante, proceso)
  const { dentro } = proceso

  const [pestana, setPestana] = useState<Pestana>('candidatos')
  const [abiertaId, setAbiertaId] = useState<string | null>(null)
  const [marcadas, setMarcadas] = useState<string[]>([])
  const [agregando, setAgregando] = useState<string | null>(null)

  // Lo que pide la dirección se atiende en el render (como los lotes de `useImportaciones`) y la dirección se limpia
  // después, para que «atrás» o recargar no vuelvan a abrir lo mismo.
  const [parametros, setParametros] = useSearchParams()
  const personaPedida = parametros.get('persona')
  const pestanaPedida = parametros.get('pestana')
  const [pedidoAtendido, setPedidoAtendido] = useState<string | null>(null)
  const pedido = personaPedida || pestanaPedida ? `${personaPedida ?? ''}|${pestanaPedida ?? ''}` : null
  if (pedido !== pedidoAtendido) {
    setPedidoAtendido(pedido)
    if (personaPedida) {
      setPestana('candidatos')
      setAbiertaId(personaPedida)
    } else if (pestanaPedida === 'vacante' || pestanaPedida === 'cvs') setPestana(pestanaPedida)
  }
  // La pestaña pedida se atiende una vez y sale de la dirección. La ficha abierta, en cambio, queda en la dirección
  // (`?persona=`): se puede copiar el enlace para un colega, y recargar o volver la deja abierta (CA-20).
  useEffect(() => {
    if (!pestanaPedida) return
    setParametros(
      (antes) => {
        const siguientes = new URLSearchParams(antes)
        siguientes.delete('pestana')
        return siguientes
      },
      { replace: true },
    )
  }, [pestanaPedida, setParametros])

  // Recién publicada: «Compartir» abierto con el enlace, para mandarlo de una vez (29 sep, reunión con Elkin: al
  // publicar se llega a la vacante que se construyó, con su ventana de compartir).
  const llegada = location.state as { publicada?: boolean; invitaciones?: { personas: number; etapa: string } } | null
  const recienPublicada = Boolean(llegada?.publicada)
  // Las invitaciones de IA que esperaban en el borrador y salieron al publicar (VA-45): van en el mismo aviso.
  const invitaciones = llegada?.invitaciones
  const [compartiendo, setCompartiendo] = useState(recienPublicada)
  const avisoPublicada = useRef(false)
  useEffect(() => {
    if (!recienPublicada || avisoPublicada.current) return
    avisoPublicada.current = true
    setCompartiendo(true)
    const detalle = invitaciones
      ? `${invitaciones.personas === 1 ? 'A quien agregaste le llega' : `A las ${invitaciones.personas} que agregaste les llega`} la invitación a «${invitaciones.etapa}».`
      : 'Comparte el enlace para empezar.'
    notify(`Publicamos «${vacante.titulo}»`, detalle, 'success')
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [recienPublicada, invitaciones, vacante.titulo, navigate, location.pathname, location.search])

  // Editar = la creación por pasos de Elkin, abierta en el paso que toca; al guardar vuelve aquí (contrato con la
  // creación: `state.paso` y `state.volverA`).
  const editar = (paso: 1 | 2 | 3 = 1) => navigate(RUTA_EDITAR(vacante.id), { state: { paso, volverA: location.pathname } })

  // El agente de la vacante («Gestionar vacante con IA»), a la derecha y debajo del header: se abre con «Orbit Flow» y
  // la página se angosta; el header no se mueve.
  const [agente, setAgente] = useState(false)
  const hueco = useHuecoDerecho()
  const permisoAgente = permisoEn(vacante)
  // Algo urgente que el agente todavía no contó en esta visita (OF-47): punto azul en «Orbit Flow» hasta abrirlo.
  const [agenteVisto, setAgenteVisto] = useState(() => vistosPorAgente.has(vacante.id))
  const urgente = !agenteVisto && dentro.some((c) => c.candidato.accion && c.dias >= 5)
  const abrirAgente = () => {
    vistosPorAgente.add(vacante.id)
    setAgenteVisto(true)
    setAgente(true)
  }
  useEffect(() => {
    setRightPanelOpen(agente)
    return () => setRightPanelOpen(false)
  }, [agente])

  const abrirFicha = (candidaturaId: string) => {
    setPestana('candidatos')
    setAbiertaId(candidaturaId)
  }

  // Importar hojas de vida: la lectura sigue aunque se cambie de pestaña o se salga de la vacante. Quien entra cae en
  // la primera columna del tablero, marcada como nueva. La pestaña de lotes es solo el registro de las cargas (29 sep,
  // reunión con Elkin: «como un log de lo que usted cargó… sin lo de la IA»): «Ver a quiénes» de un lote trae aquí al
  // tablero, filtrado por ese lote (1 oct, Nicolás: «para eso está la vista de kanban»).
  const importaciones = useImportaciones({
    vacante,
    activas: dentro,
    rechazadas: proceso.rechazadas,
    bloqueo: proceso.bloqueo,
    onVerEntraron: (loteId) => {
      const lote = importaciones.lotes.find((uno) => uno.id === loteId)
      tablero.verLote({ id: loteId, nombre: lote?.nombre ?? 'importado' })
      setMarcadas([])
      setPestana('candidatos')
    },
    dondeVerEntraron: 'el tablero',
    onAbrirFicha: abrirFicha,
    onReconsiderar: (candidaturaId) => {
      const rechazada = proceso.rechazadaDe(candidaturaId)
      if (rechazada) proceso.reconsiderar(rechazada)
    },
    onIrALotes: () => setPestana('cvs'),
  })

  const fuera = useMemo(() => proceso.rechazadas.map((r) => r.candidatura), [proceso.rechazadas])
  const abierta = dentro.find((c) => c.id === abiertaId) ?? fuera.find((c) => c.id === abiertaId) ?? null
  // La dirección sigue a la ficha abierta. Si pide a alguien que no está en esta vacante, se avisa y no se abre nada.
  useEffect(() => {
    if (abiertaId && !abierta) {
      notify('No encontramos a esa persona en esta vacante', 'Puede que la hayan eliminado.', 'warning')
      setAbiertaId(null)
      return
    }
    if ((parametros.get('persona') ?? null) === abiertaId) return
    setParametros(
      (antes) => {
        const siguientes = new URLSearchParams(antes)
        if (abiertaId) siguientes.set('persona', abiertaId)
        else siguientes.delete('persona')
        return siguientes
      },
      { replace: true },
    )
  }, [abiertaId, abierta, parametros, setParametros])
  const rechazadaAbierta = abierta ? proceso.rechazadaDe(abierta.id) : null
  // La ficha se recorre en el orden del tablero, columna por columna.
  // El orden del recorrido de fichas se fija al abrir la primera (CA-29): si se mueve a alguien, «Siguiente» sigue
  // siendo quien venía detrás, no quien quedó después en el tablero. Al cerrar, vuelve a tomar el del tablero.
  const [ordenFicha, setOrdenFicha] = useState<string[] | null>(null)
  if (abiertaId && !ordenFicha) setOrdenFicha(tablero.enOrden.map((c) => c.id))
  if (!abiertaId && ordenFicha) setOrdenFicha(null)
  const recorrido = useMemo(() => {
    if (!ordenFicha) return tablero.enOrden
    const porId = new Map(tablero.enOrden.map((c) => [c.id, c]))
    const fijos = ordenFicha.map((id) => porId.get(id)).filter((c): c is Candidatura => c !== undefined)
    return [...fijos, ...tablero.enOrden.filter((c) => !ordenFicha.includes(c.id))]
  }, [ordenFicha, tablero.enOrden])
  const indiceAbierta = recorrido.findIndex((c) => c.id === abiertaId)
  // Solo cuenta lo marcado que se ve: si un filtro o la búsqueda esconde a alguien marcado, deja de estar marcado y
  // ninguna acción cae sobre quien no está a la vista (VA-15).
  const visiblesIds = useMemo(() => new Set(recorrido.map((c) => c.id)), [recorrido])
  const marcadasCompletas = dentro.filter((c) => marcadas.includes(c.id) && visiblesIds.has(c.id))
  useEffect(() => {
    setMarcadas((actuales) => (actuales.every((id) => visiblesIds.has(id)) ? actuales : actuales.filter((id) => visiblesIds.has(id))))
  }, [visiblesIds])

  // Mover a cualquier etapa, adelante o atrás: el proceso no siempre es lineal. Se ve pasar y se puede deshacer.
  const moverA = (candidatura: Candidatura, destino: string) => proceso.pedirMover([{ candidatura, destino }])
  const moverVarias = (cambios: Cambio[]) =>
    proceso.pedirMover(cambios, { alMover: () => setMarcadas([]), quedaron: marcadasCompletas.length - cambios.length })
  const elegirVarias = () => proceso.elegirEtapa(marcadasCompletas, { alMover: () => setMarcadas([]) })
  const rechazar = (candidaturas: Candidatura[]) =>
    proceso.pedirRechazo(candidaturas, () => {
      const ids = candidaturas.map((c) => c.id)
      setMarcadas((actuales) => actuales.filter((id) => !ids.includes(id)))
    })

  const pestanas = (
    <BarraPestanas
      pestana={pestana}
      onPestana={setPestana}
      candidatos={dentro.length}
      lotes={importaciones.lotes.length}
      tableroPrimero
      extra={extraPestanas?.(vacante)}
    />
  )
  // Mover, rechazar o reabrir pedidos desde la ficha se abren dentro de ella, como drawer anidado; desde el tablero o el
  // agente, en la ventana de siempre (8 oct, Nicolás: desde un panel no se abre una ventana encima).
  const ventanasEnFicha = useVentanasEnPanel(proceso.ocupado, abierta !== null)
  // La etapa de la persona abierta, para decir en el panel de qué recorrido es y en qué pestaña abre su ficha.
  const etapaAbierta = abierta ? vacante.etapas.find((etapa) => etapa.id === abierta.etapa) : undefined

  return (
    <PageShell>
      <CabeceraVacante
        ruta={ruta}
        seccion={seccion}
        vacante={vacante}
        onCambio={cambiarVacante}
        onImportar={() => importaciones.abrir()}
        onEditar={() => editar(1)}
        onTerminar={(paso) => editar(paso === 2 || paso === 3 ? paso : 1)}
        compartir={{ abierto: compartiendo, onAbierto: setCompartiendo }}
        // «Orbit Flow» siempre el último de la fila, a la derecha del primario; con el panel abierto no aparece. Va compacto,
        // solo el orbe: la cabecera ya tiene más de dos llamados a la acción (War Room, acuerdo «orbit-flow-compacto»).
        extra={agente ? null : <ReopenAgentButton compact pending={urgente} onClick={abrirAgente} />}
      />

      <PageContent className="min-h-0 gap-4">
        {/* El tablero de la vacante, lo primero que se ve al abrirla: corta en diez por columna y abre el resto ahí
            mismo; la tarjeta abre la ficha en el panel lateral. Una sola pieza: pestañas, filtros, columnas y pie. */}
        {pestana === 'candidatos' ? (
          <TableroAmpliable vacante={vacante} ampliado={ampliado} onReducir={() => setAmpliado(false)}>
          <MarcoTablero ampliado={ampliado}>
            {ampliado ? null : (
              <>
                {pestanas}
                <Separator />
              </>
            )}
            {/* Cerrada, el tablero queda de consulta: nadie cambia de etapa hasta reabrirla. */}
            <AvisoVacanteCerrada
              vacante={vacante}
              onReabrir={proceso.bloqueo?.onReabrir}
              siguen={dentro.filter((c) => c.etapa !== vacante.etapas[vacante.etapas.length - 1]?.id).length}
              onRechazarQuienesSiguen={() => rechazar(dentro.filter((c) => c.etapa !== vacante.etapas[vacante.etapas.length - 1]?.id))}
            />
            {/* Con «Solo ver» (o sin estar en el equipo): se dice arriba del tablero, una vez, y a quién pedir acceso. */}
            {vacante.estado !== 'Cerrada' && proceso.bloqueo ? (
              <div className="px-5 pt-4">
                <Alert>
                  <HugeiconsIcon icon={ViewIcon} size={16} />
                  <AlertTitle>{proceso.bloqueo.titulo}</AlertTitle>
                  <AlertDescription>{proceso.bloqueo.texto}</AlertDescription>
                </Alert>
              </div>
            ) : null}
            <BarraTablero
              vacante={vacante}
              proceso={proceso}
              tablero={tablero}
              onAgregar={permisoEn(vacante).trabaja ? () => setAgregando(primeraEtapaDe(vacante.etapas)) : undefined}
              inicio={
                ampliado ? (
                  // En el teléfono los filtros bajan a otras filas: la X se queda arriba, junto al nombre.
                  <div className="me-3 flex w-full min-w-0 items-start justify-between gap-3 sm:w-auto">
                    <div className="flex min-w-0 flex-col">
                      <Heading as="h2" level={5} className="truncate">
                        {vacante.titulo}
                      </Heading>
                      <Text as="span" variant="muted" size="xs">
                        {vacante.etapas.length} etapas · {dentro.length} en proceso
                      </Text>
                    </div>
                    <span className="flex sm:hidden">{cerrarAmpliado}</span>
                  </div>
                ) : undefined
              }
              fin={ampliado ? <span className="hidden sm:flex">{cerrarAmpliado}</span> : undefined}
            />
            <Separator />
            <div className={cn('relative', ampliado ? 'min-h-0 flex-1' : 'min-h-[24rem] lg:h-[calc(100svh-24rem)]')}>
              <TableroColumnas
                ampliado={ampliado}
                vacante={vacante}
                proceso={proceso}
                tablero={tablero}
                marcadas={marcadas}
                onMarcadas={setMarcadas}
                abiertaId={abiertaId}
                onAbrir={(candidatura) => setAbiertaId(candidatura.id)}
                onAgregar={(etapa) => {
                  if (proceso.bloqueo) return
                  setAgregando(etapa ?? primeraEtapaDe(vacante.etapas))
                }}
                onImportar={() => importaciones.abrir()}
                onEditarEtapas={() => editar(3)}
                tope={{ cuantos: TOPE_TABLERO, etiqueta: (resto) => `Ver ${resto} más` }}
              />
              {/* «Ampliar» flota en la esquina del propio tablero, como el control de pantalla completa de un mapa o de
                  Figma (8 oct, Nicolás: en la barra de filtros no se asociaba al kanban). Con tarjetas marcadas se
                  esconde: abajo va la barra de acciones en lote. */}
              {marcadas.length || !dentro.length || ampliado ? null : (
                <Button variant="outline" size="sm" className="absolute right-5 bottom-5 z-10 shadow-md" onClick={() => setAmpliado(true)}>
                  <HugeiconsIcon icon={FullScreenIcon} size={16} aria-hidden="true" />
                  Ampliar tablero
                </Button>
              )}
            </div>
            {dentro.length || proceso.rechazadas.length ? <PieTablero vacante={vacante} /> : null}
            {/* Actuar sobre varias: flota dentro de esta tarjeta, sobre el tablero. */}
            {marcadas.length ? (
              <BarraEnLote
                vacante={vacante}
                marcadas={marcadasCompletas}
                onLimpiar={() => setMarcadas([])}
                onMover={moverVarias}
                onElegirEtapa={elegirVarias}
                onRechazar={rechazar}
                bloqueo={proceso.bloqueo}
              />
            ) : null}
          </MarcoTablero>
          </TableroAmpliable>
        ) : null}

        {pestana === 'vacante' ? (
          <Card className="gap-0! overflow-hidden py-0!">
            {pestanas}
            <Separator />
            <PestanaVacante vacante={vacante} dentro={dentro} onEditar={(_, seccionVacante) => editar(PASO_DE[seccionVacante])} />
          </Card>
        ) : null}

        {/* Todo lo que pasó en la vacante, de lo más nuevo a lo más viejo: quién, qué y con quién (VA-35). */}
        {pestana === 'actividad' ? (
          <Card className="gap-0! overflow-hidden py-0!">
            {pestanas}
            <Separator />
            <ActividadVacante vacante={vacante} personas={[...dentro, ...fuera]} />
          </Card>
        ) : null}

        {/* El registro de lo que se cargó: cuándo, qué archivo, cómo quedó y cuántas hojas de vida traía. */}
        {pestana === 'cvs' ? (
          <Card className="gap-0! overflow-hidden py-0!">
            {pestanas}
            <Separator />
            <PestanaCvs importaciones={importaciones} vacante={vacante} />
          </Card>
        ) : null}
      </PageContent>

      {/* La ficha, en panel lateral: se trabaja una persona sin perder el tablero y se pasa a la siguiente. Abre en la
          pestaña que sirve para la etapa en la que está (29 sep: si es de IA, lo que dejó esa etapa; si es revisar la
          CV, el CV). */}
      <DrawerShell
        open={abierta !== null}
        onOpenChange={(abiertoAhora) => {
          if (abiertoAhora) return
          if (ventanasEnFicha) proceso.cerrarVentanas()
          setAbiertaId(null)
        }}
        // Con el agente abierto, la ficha va a la izquierda y no bloquea: los dos se usan a la vez, uno al lado del otro,
        // sin un panel encima del otro (CA-10).
        direction={agente ? 'left' : 'right'}
        modal={agente ? false : undefined}
        size="lg"
        // En el celular, todo el ancho menos el margen: antes ocupaba tres cuartos (CA-33). Desde 640 px manda `size`.
        style={ANCHO_EN_CELULAR}
        title="Candidatura"
        description={vacante.titulo}
        headerExtra={
          indiceAbierta >= 0 ? (
            <NavegacionPanel
              indice={indiceAbierta}
              total={recorrido.length}
              donde={tablero.activos ? 'con estos filtros' : 'del tablero'}
              anterior={indiceAbierta > 0 ? recorrido[indiceAbierta - 1].candidato.nombre : undefined}
              siguiente={indiceAbierta < recorrido.length - 1 ? recorrido[indiceAbierta + 1].candidato.nombre : undefined}
              onAnterior={() => setAbiertaId(recorrido[indiceAbierta - 1].id)}
              onSiguiente={() => setAbiertaId(recorrido[indiceAbierta + 1].id)}
            />
          ) : undefined
        }
      >
        {abierta ? (
          // La ficha trae su propio aire y su pie fijo: se anula el relleno del cuerpo del panel (solo posición).
          <div className="-mx-5 -my-4 h-[calc(100%+2rem)]">
            <FichaPersona
              key={abierta.id}
              candidatura={abierta}
              etapas={vacante.etapas}
              pestanaInicial={etapaAbierta && !rechazadaAbierta ? pestanaParaEtapa(etapaAbierta) : undefined}
              // Su otra candidatura, en la otra vacante, con la ficha abierta (CA-08).
              onIrA={(id) => navigate(`${RUTA}/${id.slice(id.lastIndexOf('@') + 1)}?persona=${encodeURIComponent(id)}`)}
              onElegirEtapa={() => proceso.elegirEtapa([abierta])}
              bloqueo={proceso.bloqueo}
              rechazada={rechazadaAbierta}
              onReconsiderar={rechazadaAbierta ? () => proceso.reconsiderar(rechazadaAbierta) : undefined}
              onEscribirRechazo={rechazadaAbierta ? () => proceso.escribirRechazo(rechazadaAbierta) : undefined}
              onAvanzar={() => {
                const destino = siguienteEtapaDe(vacante.etapas, abierta.etapa)
                if (destino) moverA(abierta, destino)
              }}
              onRechazar={() => rechazar([abierta])}
            />
          </div>
        ) : null}
        {ventanasEnFicha ? proceso.dialogos : null}
      </DrawerShell>

      {importaciones.dialogos}
      <AgregarCandidatos
        abierto={agregando !== null}
        onOpenChange={(abiertoAhora) => !abiertoAhora && setAgregando(null)}
        vacante={vacante}
        etapaInicial={agregando ?? primeraEtapaDe(vacante.etapas)}
        yaEstan={new Set([...dentro, ...fuera].map((c) => c.personaId))}
        rechazadas={
          new Map(
            fuera.map((c) => [
              c.personaId,
              () => {
                const rechazada = proceso.rechazadaDe(c.id)
                if (rechazada) proceso.reconsiderar(rechazada)
              },
            ]),
          )
        }
        onAgregar={(nuevas) => proceso.agregar(nuevas, 'Nadie recibe correo.')}
        onImportar={() => importaciones.abrir()}
      />
      {ventanasEnFicha ? null : proceso.dialogos}

      {/* Montado siempre: `AgentDock` lo deja entrar y salir deslizándose en vez de aparecer y desaparecer de golpe. */}
      {hueco
        ? createPortal(
            <AgentDock open={agente}>
              <AgenteVacante
                vacante={vacante}
                dentro={dentro}
                rechazadas={proceso.rechazadas}
                onClose={() => setAgente(false)}
                // Abrir a alguien desde el agente abre su ficha sobre el tablero.
                onAbrir={abrirFicha}
                // La ficha abierta: el agente sabe a quién estás mirando y sugiere preguntar por ella o compararla con
                // quien sigue (CA-50, CA-48).
                revisando={abierta ? { actual: abierta, siguiente: indiceAbierta >= 0 ? (recorrido[indiceAbierta + 1] ?? null) : null } : null}
                // Lo que se aprueba desde el agente pasa por las mismas ventanas del tablero y queda en el historial que lo
                // propuso Orbit Flow (OF-55).
                onMover={(candidatura, destino, porAgente) => proceso.pedirMover([{ candidatura, destino }], { porAgente })}
                onMoverVarias={(cambios, porAgente) => proceso.pedirMover(cambios, { porAgente })}
                onRechazar={(candidaturas, porAgente) =>
                  proceso.pedirRechazo(
                    candidaturas,
                    () => setMarcadas((actuales) => actuales.filter((id) => !candidaturas.some((c) => c.id === id))),
                    undefined,
                    porAgente,
                  )
                }
                onReconsiderar={(rechazada) => proceso.reconsiderar(rechazada)}
                onAgregar={(nuevas) => proceso.agregar(nuevas, 'Nadie recibe correo.')}
                // Lo que el agente sabe de la pantalla (OF-36 a OF-40): lo marcado, los filtros, la pestaña y el permiso.
                marcadas={marcadasCompletas}
                filtradas={tablero.activos ? { ids: tablero.enOrden.map((c) => c.id), texto: textoDeFiltros(tablero.filtros) } : null}
                pestana={pestana}
                puede={{ cambiar: permisoAgente.trabaja, porque: permisoAgente.porque, pedirA: permisoAgente.duena?.nombre ?? 'la dueña del proceso', salarios: permisoAgente.trabaja }}
                lotes={importaciones.lotes}
                onFiltrar={(filtro) => {
                  setPestana('candidatos')
                  tablero.cambiar(filtro)
                }}
                onVerEtapa={(etapa) => {
                  setPestana('candidatos')
                  window.setTimeout(() => document.querySelector(`[data-etapa="${etapa}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }), 60)
                }}
                onImportar={() => importaciones.abrir()}
                onVerLote={(loteId) => importaciones.ver(loteId)}
                onEditar={() => editar(1)}
                onReabrir={proceso.bloqueo?.onReabrir}
              />
            </AgentDock>,
            hueco,
          )
        : null}
    </PageShell>
  )
}

export function Component() {
  return <VacanteConTablero ruta={RUTA} />
}

Component.displayName = 'SeleccionExploracionUnoVacantePage'
