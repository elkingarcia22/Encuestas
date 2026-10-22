import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowDataTransferHorizontalIcon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  Copy01Icon,
  FileImportIcon,
  LockIcon,
  Mail01Icon,
  MoreHorizontalIcon,
  Search01Icon,
  Settings01Icon,
  Tick02Icon,
  UserMultipleIcon,
  UserRemove01Icon,
  UserSwitchIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
  ScrollArea,
  ScrollBar,
  Skeleton,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  cn,
  Separator,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { notify } from '@/shared/components/notify'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import {
  ESPERA_AL_CANDIDATO,
  ESPERANDO_ACCION,
  ESPERA_RESPUESTA,
  primeraEtapaDe,
  siguienteEtapaDe,
  tituloEtapa,
  type Candidatura,
  type EtapaVacante,
  type Rechazada,
  type VacanteUI,
  CANDIDATURAS,
} from '../datos'
import { quienDe } from '../rechazos'
import { QUIEN_MUEVE, movimientosDe, useMovimientos, useSinInvitacion } from '../movimientos'
import { simulado } from '../simular'
import { diasDesdeQueAplico, resumenDeEvaluaciones } from '../perfil-candidato'
import { delLote } from '../importacion'
import { FiltroChip } from '@/modules/design-system/navegacion/filtro-chip'
import type { Proceso, Transito } from './use-proceso'
import { ErrorDeCarga, Esqueleto, LineaEsqueleto, useCargaConError } from '@/modules/design-system/estados/carga'
import { CifraAnimada } from './cifra-animada'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { CURVA, entrada } from './movimiento'
import { Flotar, POP, RESORTE } from './animacion'
import { ImagenGlass } from '@/shared/components/ImagenGlass'

// «Candidatos › Tablero Kanban de candidatos», completo, para las tres exploraciones (24 sep, Nicolás: «completa
// tooodo el flujo… que lo que haya alrededor, casos de uso y demás, queden construidos»).
//
// Parte del producto de hoy (pestaña Candidatos: buscar, el filtro de ex empleados y una columna por etapa con
// «Activos» y «Rechazados») y del `Kanban` del DS, armado como la plantilla Dashboard RRHH (Frame por columna,
// FramePanel por tarjeta). Lo que pasa alrededor del tablero:
//
// - **Buscar y filtrar**: por nombre, cargo o empresa; quién espera una respuesta; quién trabajó antes en la empresa
//   (el único filtro que tiene hoy); y de dónde llegó. Las columnas dicen «2 de 5» mientras se filtra.
// - **Mover**: arrastrando la tarjeta, o desde su menú «⋯» (avanzar a la siguiente o a cualquier otra) para quien
//   no arrastra o usa teclado. Se ve pasar («Pasando a…» → «Pasó a…») y se deshace desde el aviso.
// - **Rechazar** desde el menú, con motivo y correo; la persona queda al pie de su columna, plegada, y se puede
//   **volver a considerar**.
// - **Elegir varias** (casilla por tarjeta o «Seleccionar a las N» de una columna) para la barra de acciones.
// - **Sumar gente** a una etapa desde la base («Mis candidatos») o importando hojas de vida.
// - **Vacante cerrada**: el tablero queda de consulta, con un aviso y el botón para reabrirla.
// - **Vacía** o **sin coincidencias**: su propio estado, con la salida a mano.
//
// Las piezas van sueltas (barra, columnas, pie, aviso) porque cada exploración las compone a su manera: la 1 lo usa
// como su única vista de candidatos (corta a diez por columna y abre el resto ahí mismo), la 2 lo corta a diez y lo
// conecta con su pipeline, la 3 abre el expediente en un panel y manda a revisar a quien espera.

type Columnas = Record<string, Candidatura[]>

// 29 sep, reunión con Elkin: los filtros del tablero tenían demasiadas opciones (ex empleados con tres caminos, origen
// con casillas). El origen se fue el 8 oct (VP de producto: no se sabe por dónde llega cada persona).
// 13 oct (reunión con la PM y el TL): tres vistas del embudo, como pestañas del propio tablero —«Candidatos» (todos),
// «Esperando acción» (lo que tiene que mover el equipo) y «En proceso» (lo que le falta hacer a la persona: la entrevista
// con Serena, la psicométrica)— y la búsqueda. Sin «Ex empleados» («no es un filtro que me interese tener») ni «Cualquier
// requisito» (la evaluación de CV da un puntaje, no cuenta requisitos) ni «Agregar candidatos»: a una vacante solo se
// importan CVs; a alguien de la base se le postula desde Mis candidatos, donde están los filtros para buscarlo.
// `lote`: quienes entraron con un lote de hojas de vida (1 oct, Nicolás: la gente de un lote se ve aquí, en el
// tablero, no en la pestaña «CVs importados», que es solo el registro de las cargas). Llega desde «Ver a quiénes» del
// lote y se quita con su chip.
export type VistaTablero = 'todos' | 'espera' | 'proceso'
type Filtros = {
  busqueda: string
  vista: VistaTablero
  lote: { id: string; nombre: string } | null
}

const SIN_FILTROS: Filtros = { busqueda: '', vista: 'todos', lote: null }

const EN_VISTA: Record<VistaTablero, (c: Candidatura) => boolean> = {
  todos: () => true,
  espera: ESPERANDO_ACCION,
  proceso: ESPERA_AL_CANDIDATO,
}

// Cómo se ordena cada columna (VA-24). Por defecto, primero quien espera y después quien lleva más días: la prioridad del
// tablero. Con mucha gente sirve más empezar por el mejor puntaje (15 oct: el que dice la tarjeta; antes, cuántos
// requisitos cumplía) o por quien llegó último.
export type OrdenColumna = 'prioridad' | 'ajuste' | 'recientes'
const ORDENES: { valor: OrdenColumna; texto: string }[] = [
  { valor: 'prioridad', texto: 'Primero quien espera' },
  { valor: 'ajuste', texto: 'Mayor puntaje' },
  { valor: 'recientes', texto: 'Aplicaron más recientemente' },
]
// El puntaje de la tarjeta, para ordenar: quien no tiene evaluaciones con puntaje va al final.
const puntajeDe = (c: Candidatura) => resumenDeEvaluaciones(c, movimientosDe(c.id)).promedio ?? -1

const personas = (n: number) => `${n} ${n === 1 ? 'persona' : 'personas'}`

// Quien espera una respuesta va arriba de su columna, y entre iguales, quien más lleva en la etapa.
const prioridad = (a: Candidatura, b: Candidatura) => Number(ESPERA_RESPUESTA(b)) - Number(ESPERA_RESPUESTA(a)) || b.dias - a.dias

// ══════════════════════════════════════════════════════════════════════════════════════════════════════
// El estado del tablero: filtros, orden que dejó la persona y columnas
// ══════════════════════════════════════════════════════════════════════════════════════════════════════

// Para los anuncios del tablero: el nombre de la persona y la etapa donde está, a partir del id de su tarjeta.
const nombreDe = (id: string) => CANDIDATURAS.find((c) => c.id === id)?.candidato.nombre ?? 'la persona'
const etapaDeId = (columnas: Record<string, { id: string }[]>, id: string) => {
  const etapa = Object.keys(columnas).find((una) => una === id || columnas[una]?.some((c) => c.id === id))
  return etapa ? tituloEtapa(etapa) : ''
}

export function useTablero(vacante: VacanteUI, proceso: Proceso) {
  const [filtros, setFiltros] = useState<Filtros>(SIN_FILTROS)
  // El orden en que la persona dejó las tarjetas al soltarlas: si no, al soltar una en la mitad de otra columna
  // saltaría a su sitio «de prioridad» y parecería que el tablero no hizo caso.
  const [orden, setOrden] = useState<Record<string, string[]>>({})
  const [criterio, setCriterio] = useState<Record<string, OrdenColumna>>({})

  const activos = Boolean(filtros.busqueda) || filtros.vista !== 'todos' || filtros.lote !== null

  const { dentro, enTransito, recien, nuevas } = proceso

  const columnas = useMemo(() => {
    const pasa = (c: Candidatura) => {
      if (!EN_VISTA[filtros.vista](c)) return false
      if (filtros.lote && !delLote(filtros.lote.id)(c)) return false
      if (filtros.busqueda) {
        const texto = `${c.candidato.nombre} ${c.candidato.cargo} ${c.candidato.empresa}`.toLowerCase()
        if (!texto.includes(filtros.busqueda.toLowerCase())) return false
      }
      return true
    }
    const ids = new Set(vacante.etapas.map((etapa) => etapa.id))
    const primera = primeraEtapaDe(vacante.etapas)
    const grupos: Columnas = Object.fromEntries(vacante.etapas.map((etapa) => [etapa.id, []]))
    for (const c of dentro) {
      // Quien se está moviendo sigue a la vista aunque ya no pase el filtro: si desapareciera no se vería que pasó.
      const moviendo = enTransito.get(c.id)
      if (!moviendo && !recien.has(c.id) && !pasa(c)) continue
      // En el tablero la columna es la etapa: quien se está moviendo ya se ve en la de destino, con «Pasando a…».
      const donde = moviendo?.destino ?? c.etapa
      grupos[ids.has(donde) ? donde : primera].push(c)
    }
    for (const [etapa, gente] of Object.entries(grupos)) {
      const manual = orden[etapa] ?? []
      const lugar = (c: Candidatura) => (nuevas.has(c.id) ? -1 : manual.includes(c.id) ? manual.indexOf(c.id) : manual.length)
      const como = criterio[etapa] ?? 'prioridad'
      const porCriterio = (a: Candidatura, b: Candidatura) =>
        como === 'ajuste'
          ? puntajeDe(b) - puntajeDe(a) || prioridad(a, b)
          : como === 'recientes'
            ? diasDesdeQueAplico(a) - diasDesdeQueAplico(b) || prioridad(a, b)
            : prioridad(a, b)
      gente.sort((a, b) => lugar(a) - lugar(b) || porCriterio(a, b))
    }
    return grupos
  }, [dentro, enTransito, recien, nuevas, filtros, orden, criterio, vacante.etapas])

  // Todas las tarjetas en el orden en que se leen (columna por columna): para pasar a la siguiente con el teclado o
  // con las flechas de la ficha.
  const enOrden = useMemo(() => vacante.etapas.flatMap((etapa) => columnas[etapa.id] ?? []), [columnas, vacante.etapas])

  return {
    filtros,
    cambiar: (cambio: Partial<Filtros>) => setFiltros((antes) => ({ ...antes, ...cambio })),
    limpiar: () => setFiltros(SIN_FILTROS),
    // Solo la gente de un lote, sin los demás filtros: se llega a verla a ella.
    verLote: (lote: { id: string; nombre: string }) => setFiltros({ ...SIN_FILTROS, lote }),
    activos,
    columnas,
    enOrden,
    ordenar: (etapa: string, ids: string[]) => setOrden((antes) => ({ ...antes, [etapa]: ids })),
    criterioDe: (etapa: string): OrdenColumna => criterio[etapa] ?? 'prioridad',
    // Elegir un orden olvida el que dejó la persona arrastrando en esa columna: si no, parecería que no hizo caso.
    ordenarPor: (etapa: string, como: OrdenColumna) => {
      setCriterio((antes) => ({ ...antes, [etapa]: como }))
      setOrden((antes) => ({ ...antes, [etapa]: [] }))
    },
  }
}

export type Tablero = ReturnType<typeof useTablero>

// ══════════════════════════════════════════════════════════════════════════════════════════════════════
// La barra: buscar, filtrar y sumar gente
// ══════════════════════════════════════════════════════════════════════════════════════════════════════

export function BarraTablero({
  proceso,
  tablero,
  inicio,
  fin,
  enMarco = false,
  vistas = true,
}: {
  proceso: Proceso
  tablero: Tablero
  // En la cabecera gris del marco «Candidatos»: sin el relleno propio, que ya lo pone el marco.
  enMarco?: boolean
  // Sin las vistas: en la página van arriba del marco, junto al cambio Lista/Tablero (`VistasTablero`), y aquí queda la
  // búsqueda. A pantalla completa la barra lleva todo.
  vistas?: boolean
  // A pantalla completa la barra es la única franja de arriba: el nombre de la vacante al principio y «Cerrar» al final
  // (8 oct, Nicolás: «ya ampliado no debería estar encerrado… un cerrar a la derecha arriba»).
  inicio?: ReactNode
  fin?: ReactNode
}) {
  const { filtros, cambiar } = tablero
  const { dentro } = proceso
  const visibles = tablero.enOrden.length

  // Sin nadie en el proceso no hay qué buscar ni filtrar (VA-43): a pantalla completa queda la franja con el nombre.
  if (!dentro.length && !proceso.rechazadas.length)
    return inicio || fin ? (
      <div className="flex flex-wrap items-center gap-2 px-5 py-3">
        {inicio}
        <div className="ml-auto flex items-center gap-2">{fin}</div>
      </div>
    ) : null

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2', !enMarco && 'px-5 py-3')}>
      {inicio}
      {vistas ? <VistasTablero proceso={proceso} tablero={tablero} /> : null}
      <InputGroup className={cn('w-full sm:w-52', !vistas && 'order-last sm:w-64')}>
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} size={16} />
        </InputGroupAddon>
        <InputGroupInput
          value={filtros.busqueda}
          onChange={(evento) => cambiar({ busqueda: evento.target.value })}
          placeholder="Buscar en el tablero"
          aria-label="Buscar candidatos en el tablero"
        />
      </InputGroup>

      {/* El lote solo sale cuando se llegó desde «Ver a quiénes»: prendido, con su «×» para volver a todo el tablero. */}
      {filtros.lote ? (
        <FiltroChip
          activo
          onCambiar={(valor) => (valor ? undefined : cambiar({ lote: null }))}
          icono={FileImportIcon}
          texto={`Lote «${filtros.lote.nombre}»`}
          cuenta={dentro.filter(delLote(filtros.lote.id)).length}
          ayuda="Ver a todo el tablero, no solo a quienes entraron con este lote"
        />
      ) : null}

      {/* Cuántas quedan solo mientras se busca o se mira un lote: las pestañas ya dicen cuántas hay en cada vista. Sin las
          vistas, la cuenta va a la izquierda del marco, como en la tabla del sistema. */}
      {filtros.busqueda || filtros.lote ? (
        <>
          <Button variant="ghost" onClick={tablero.limpiar}>
            Quitar filtros
          </Button>
          {vistas ? (
            <Text as="span" role="status" variant="muted" size="sm" className="tabular-nums">
              {visibles} de {personas(dentro.length)}
            </Text>
          ) : null}
        </>
      ) : null}
      {fin ? <div className="ml-auto flex items-center gap-2">{fin}</div> : null}
    </div>
  )
}

// Las tres caras del embudo, como pestañas: todo, lo que espera al equipo y lo que espera a la persona. En el celular se
// deslizan en vez de cortarse (VA-22). Sirven igual para el tablero y para la lista.
export function VistasTablero({ proceso, tablero }: { proceso: Proceso; tablero: Tablero }) {
  const cuantos = (vista: VistaTablero) => proceso.dentro.filter(EN_VISTA[vista]).length
  return (
    <Tabs value={tablero.filtros.vista} onValueChange={(valor) => tablero.cambiar({ vista: valor as VistaTablero })} className="min-w-0 max-w-full">
      <TabsList variant="view" className="max-w-full overflow-x-auto">
        {VISTAS.map((vista) => (
          <TabsTrigger key={vista.valor} value={vista.valor}>
            {vista.texto}
            <Badge variant="secondary" className="tabular-nums">
              <CifraAnimada valor={cuantos(vista.valor)} duracion={0.6} />
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

const VISTAS: { valor: VistaTablero; texto: string }[] = [
  // «Todos» y no «Candidatos»: el marco ya se llama así (15 oct).
  { valor: 'todos', texto: 'Todos' },
  { valor: 'espera', texto: 'Esperando acción' },
  { valor: 'proceso', texto: 'En proceso' },
]

// ══════════════════════════════════════════════════════════════════════════════════════════════════════
// El aviso de vacante cerrada y el pie con cómo se usa
// ══════════════════════════════════════════════════════════════════════════════════════════════════════

export function AvisoVacanteCerrada({
  vacante,
  onReabrir,
  siguen = 0,
  onRechazarQuienesSiguen,
  sinMargen = false,
}: {
  vacante: VacanteUI
  onReabrir?: () => void
  // Fuera del marco del tablero (en la vista «Lista»), sin el margen que lo separa del borde del marco.
  sinMargen?: boolean
  // Quienes siguen en el proceso de la vacante cerrada: se les cierra con un rechazo y su correo (VA-10).
  siguen?: number
  onRechazarQuienesSiguen?: () => void
}) {
  if (vacante.estado !== 'Cerrada') return null
  return (
    <div className={sinMargen ? undefined : 'px-5 pt-4'}>
      <Alert>
        <HugeiconsIcon icon={LockIcon} size={16} />
        <AlertTitle>La vacante está cerrada</AlertTitle>
        <AlertDescription>
          {vacante.desenlace ? `${vacante.desenlace}. ` : ''}Queda de consulta: nadie cambia de etapa ni entra gente nueva hasta
          reabrirla.
        </AlertDescription>
        {onReabrir || (siguen > 0 && onRechazarQuienesSiguen) ? (
          <AlertAction className="flex flex-wrap gap-2">
            {siguen > 0 && onRechazarQuienesSiguen ? (
              <Button variant="outline" size="sm" onClick={onRechazarQuienesSiguen}>
                {siguen === 1 ? 'Rechazar a quien sigue' : `Rechazar a las ${siguen} que siguen`}
              </Button>
            ) : null}
            {onReabrir ? (
              <Button variant="outline" size="sm" onClick={onReabrir}>
                Reabrir la vacante
              </Button>
            ) : null}
          </AlertAction>
        ) : null}
      </Alert>
    </div>
  )
}

// Cómo se usa, a la vista (Nicolás no quiere controles que haya que descubrir): arrastrar o «⋯», qué manda correo y qué
// se deshace. Cada exploración puede sumar lo suyo (los atajos de la 1).
// Debajo del tablero, solo lo que avisa algo que no se ve: que la vacante está cerrada o que otra persona del equipo la
// está trabajando ahora mismo (VA-23). Las instrucciones («arrastra una tarjeta…», «al entrar a Serena le llega la
// invitación», «rechazar puede enviarle un correo») se fueron el 8 oct (Nicolás: «esos textos de abajo no son
// necesarios»): el menú «⋯» está en cada tarjeta y cada movimiento lo dice en su aviso, con «Deshacer». Sin nada que
// avisar, no ocupa espacio.
export function PieTablero({ vacante, children }: { vacante: VacanteUI; children?: ReactNode }) {
  const otraPersona = simulado('otra-reclutadora') ? (vacante.equipo.find((miembro) => miembro.nombre !== QUIEN_MUEVE)?.nombre ?? 'Sara Gómez') : null
  const cerrada = vacante.estado === 'Cerrada'
  if (!cerrada && !otraPersona && !children) return null
  return (
    <>
      <Separator />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3">
        {cerrada ? (
          <Text as="span" variant="muted" size="sm">
            Vacante cerrada: el tablero es de consulta.
          </Text>
        ) : otraPersona ? (
          <Text as="span" variant="muted" size="sm" className="flex items-center gap-1.5">
            <HugeiconsIcon icon={UserMultipleIcon} size={14} aria-hidden />
            {otraPersona} también está en esta vacante ahora: lo que mueva se ve aquí al momento.
          </Text>
        ) : null}
        {children}
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════
// Las columnas
// ══════════════════════════════════════════════════════════════════════════════════════════════════════

// Sin `onVer`, el resto se abre en la misma columna (la 1 no tiene otra vista adonde mandarlo) y se vuelve a cerrar.
type Tope = { cuantos: number; etiqueta: (resto: number) => string; onVer?: (etapa: string) => void }

export function TableroColumnas({
  vacante,
  proceso,
  tablero,
  marcadas,
  onMarcadas,
  abiertaId,
  onAbrir,
  onImportar,
  accionesColumna,
  tope,
  onEditarEtapas,
  ampliado = false,
}: {
  vacante: VacanteUI
  proceso: Proceso
  tablero: Tablero
  // A pantalla completa las columnas se angostan un poco para que quepan todas las etapas a la vista.
  ampliado?: boolean
  marcadas: string[]
  onMarcadas: (ids: string[]) => void
  // La tarjeta cuya ficha está abierta: se marca en gris.
  abiertaId?: string | null
  onAbrir: (candidatura: Candidatura) => void
  onImportar: () => void
  // Lo propio de cada exploración en el menú de la columna («Ver en el pipeline», «Revisar a quien espera»…).
  accionesColumna?: (etapa: EtapaVacante, gente: Candidatura[]) => ReactNode
  // Cuántas tarjetas se ven por columna antes de mandar al resto (la 2 corta en diez, como Greenhouse).
  tope?: Tope
  // Las columnas son las etapas de la vacante (decisión 11: se configuran por vacante): se cambian desde aquí.
  onEditarEtapas?: () => void
}) {
  const soloLectura = vacante.estado === 'Cerrada'
  // Las tarjetas cargan al abrir la pestaña y cada vez que cambian los filtros; las columnas (las etapas de la vacante)
  // se quedan con su título, su cuenta y su menú.
  // Si no carga (`?simular=error`, VA-50), el tablero lo dice y deja reintentar; la barra y las pestañas siguen ahí.
  const { cargando, falla, reintentar } = useCargaConError(tablero.filtros)
  // Mientras se arrastra, el tablero lleva sus propias columnas; al soltar vuelve a leer las del proceso.
  const [arrastre, setArrastre] = useState<Columnas | null>(null)
  // Freno para el vaivén entre columnas (25 sep, Nicolás arrastrando en la 2: la página se cayó con «Maximum update
  // depth exceeded»). Al pasar una tarjeta por el borde entre dos columnas, la librería la cambia a una; eso corre a las
  // demás tarjetas, y con el nuevo orden le parece que va en la otra, la devuelve, y así en bucle en milésimas. Después
  // de cambiar de columna, la tarjeta se queda ahí al menos 120 ms: corta el bucle y nadie cruza una columna tan rápido.
  const arrastrada = useRef<string | null>(null)
  const ultimoCambioDeColumna = useRef(0)
  // La que se acaba de soltar no vuela: el tablero ya la dejó en su lugar. Medio segundo después, vuelve a volar (si una
  // ventana pide decidir antes de moverla, al confirmar sí vuela a su etapa).
  const [soltada, setSoltada] = useState<string | null>(null)
  useEffect(() => {
    if (!soltada) return
    const pausa = window.setTimeout(() => setSoltada(null), 600)
    return () => window.clearTimeout(pausa)
  }, [soltada])
  const volar = (id: string) => arrastre === null && soltada !== id
  const { dentro, rechazadas } = proceso
  // Las columnas que se abrieron enteras con «Ver N más» (cuando el tope no manda a otra vista).
  const [enteras, setEnteras] = useState<string[]>([])

  const recortadas = useMemo(
    () =>
      tope
        ? Object.fromEntries(
            Object.entries(tablero.columnas).map(([etapa, gente]) => [etapa, enteras.includes(etapa) ? gente : gente.slice(0, tope.cuantos)]),
          )
        : tablero.columnas,
    [tablero.columnas, tope, enteras],
  )
  const alternarEntera = (etapa: string) =>
    setEnteras((antes) => (antes.includes(etapa) ? antes.filter((otra) => otra !== etapa) : [...antes, etapa]))

  // Nadie en el proceso, ni activo ni rechazado: la vacante empieza aquí.
  if (!dentro.length && !rechazadas.length) {
    return (
      <Empty className="h-full py-14">
        <EmptyHeader>
          <EmptyMedia variant="default">
            <Flotar>
              <ImagenGlass nombre="glass-profile" />
            </Flotar>
          </EmptyMedia>
          <EmptyTitle>Todavía no hay nadie en el proceso</EmptyTitle>
          <EmptyDescription>
            {vacante.estado === 'Borrador'
              ? 'Mientras esté en borrador no recibe aplicaciones. Puedes importar CVs de gente que no está en tu base.'
              : vacante.estado === 'Cerrada'
                ? 'La vacante se cerró sin nadie en el proceso.'
                : `Las aplicaciones entran a «${tituloEtapa(primeraEtapaDe(vacante.etapas))}». También puedes importar CVs; a alguien de tu base se le postula desde Mis candidatos.`}
          </EmptyDescription>
        </EmptyHeader>
        {!soloLectura ? (
          <EmptyContent className="flex-row! justify-center gap-2">
            <Button onClick={onImportar}>
              <HugeiconsIcon icon={FileImportIcon} size={16} />
              Importar CVs
            </Button>
          </EmptyContent>
        ) : null}
      </Empty>
    )
  }

  // Hay gente, pero nadie pasa los filtros.
  if (tablero.activos && !tablero.enOrden.length && !cargando) {
    return (
      <Empty className="h-full py-14">
        <EmptyHeader>
          <EmptyMedia variant="default">
            <Flotar>
              <ImagenGlass nombre="glass-search" />
            </Flotar>
          </EmptyMedia>
          <EmptyTitle>Nadie coincide con lo que buscas</EmptyTitle>
          <EmptyDescription>Prueba con otra palabra o quita algún filtro.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={tablero.limpiar}>
            Quitar filtros
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  if (falla) return <ErrorDeCarga que="el tablero de candidatos" onReintentar={reintentar} />

  const valor = arrastre ?? recortadas
  // Columnas anchas, con desplazamiento hacia la derecha como cualquier Kanban (8 oct, VP de producto: «las cards más
  // grandecitas para que la información no se vea apeñuscada… que se alargue y yo haga el scroll para la derecha»). Cada
  // empresa crea sus propias etapas: con siete u ocho no caben en el ancho y no tienen por qué caber.
  // Mientras se arrastra, las columnas se juntan hasta caber todas a la vista (8 oct, Nicolás: «si yo quiero arrastrar una
  // card de la primera a la última de la derecha no deja, es súper difícil»): cualquier etapa queda a un movimiento, sin
  // tener que llevar la tarjeta al borde para que el tablero se desplace. Al soltar vuelven a su ancho.
  const rejilla = {
    gridTemplateColumns: arrastre
      ? `repeat(${vacante.etapas.length}, minmax(0, 1fr))`
      : `repeat(${vacante.etapas.length}, minmax(${ampliado ? '16rem' : '18.5rem'}, 1fr))`,
  }

  const columnas = vacante.etapas.map((etapa, indice) => (
    <Columna
      key={etapa.id}
      vacante={vacante}
      proceso={proceso}
      etapa={etapa}
      indice={indice}
      gente={valor[etapa.id] ?? []}
      todas={tablero.columnas[etapa.id] ?? []}
      criterio={tablero.criterioDe(etapa.id)}
      onCriterio={(como) => tablero.ordenarPor(etapa.id, como)}
      cargando={cargando}
      total={tablero.columnas[etapa.id]?.length ?? 0}
      enProceso={dentro.filter((c) => c.etapa === etapa.id).length}
      filtrando={tablero.activos}
      arrastrable={!soloLectura}
      marcadas={marcadas}
      onMarcadas={onMarcadas}
      abiertaId={abiertaId ?? null}
      onAbrir={onAbrir}
      accionesColumna={accionesColumna}
      tope={tope}
      entera={enteras.includes(etapa.id)}
      onAlternarEntera={() => alternarEntera(etapa.id)}
      onEditarEtapas={onEditarEtapas}
      volar={volar}
    />
  ))

  return (
    // Con desplazamiento propio en las dos direcciones: cinco o seis etapas no caben siempre, y una columna llena no
    // puede empujar la página entera (la barra horizontal quedaría lejísimos).
    <ScrollArea className="h-full w-full">
      {/* Un solo grupo para que una tarjeta pueda volar de una columna a otra. */}
      <LayoutGroup id={`tablero-${vacante.id}`}>
      <div className="p-5">
        {soloLectura ? (
          <div className="grid items-start gap-3" style={rejilla}>
            {columnas}
          </div>
        ) : (
          <Kanban
            // Lo que oye quien usa lector de pantalla o teclado: en español y con el nombre de la persona y la etapa, no
            // el código interno ni las instrucciones en inglés de la librería (VA-20).
            accessibility={{
              screenReaderInstructions: {
                draggable:
                  'Para mover a esta persona de etapa con el teclado, pulsa la barra espaciadora, cambia de columna con las flechas y vuelve a pulsar la barra para soltarla. Escape cancela.',
              },
              announcements: {
                onDragStart: ({ active }) => `Tomaste a ${nombreDe(String(active.id))}, en ${etapaDeId(valor, String(active.id))}.`,
                onDragOver: ({ active, over }) =>
                  over ? `${nombreDe(String(active.id))} está sobre ${etapaDeId(valor, String(over.id)) || tituloEtapa(String(over.id))}.` : `${nombreDe(String(active.id))} no está sobre ninguna etapa.`,
                onDragEnd: ({ active, over }) =>
                  over ? `Soltaste a ${nombreDe(String(active.id))} en ${etapaDeId(valor, String(over.id)) || tituloEtapa(String(over.id))}.` : `Soltaste a ${nombreDe(String(active.id))} donde estaba.`,
                onDragCancel: ({ active }) => `Se canceló. ${nombreDe(String(active.id))} sigue en ${etapaDeId(valor, String(active.id))}.`,
              },
            }}
            value={valor}
            onValueChange={(siguientes) => {
              const id = arrastrada.current
              const columnaDe = (columnas: Columnas) => Object.keys(columnas).find((etapa) => columnas[etapa]?.some((c) => c.id === id))
              if (id && columnaDe(valor) !== columnaDe(siguientes)) {
                const ahora = performance.now()
                if (ahora - ultimoCambioDeColumna.current < 120) return
                ultimoCambioDeColumna.current = ahora
              }
              setArrastre(siguientes)
            }}
            getItemValue={(candidatura) => candidatura.id}
            onDragStart={(evento) => {
              arrastrada.current = String(evento.active.id)
              ultimoCambioDeColumna.current = 0
              setArrastre(recortadas)
            }}
            onDragEnd={() => {
              setSoltada(arrastrada.current)
              setArrastre(null)
            }}
            onDragCancel={() => {
              setSoltada(arrastrada.current)
              setArrastre(null)
            }}
            onValueCommit={(soltadas, meta) => {
              if (meta.kind !== 'item') return
              tablero.ordenar(meta.overContainer, (soltadas[meta.overContainer] ?? []).map((c) => c.id))
              if (meta.activeContainer === meta.overContainer) return
              const movida = dentro.find((c) => c.id === String(meta.event.active.id))
              if (movida) proceso.pedirMover([{ candidatura: movida, destino: meta.overContainer }])
            }}
          >
            <KanbanBoard className="items-start gap-3" style={rejilla}>
              {columnas}
            </KanbanBoard>
            <KanbanOverlay />
          </Kanban>
        )}
      </div>
      </LayoutGroup>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

function Columna({
  vacante,
  proceso,
  etapa,
  indice,
  gente,
  todas,
  criterio,
  onCriterio,
  cargando,
  total,
  enProceso,
  filtrando,
  arrastrable,
  marcadas,
  onMarcadas,
  abiertaId,
  onAbrir,
  accionesColumna,
  tope,
  entera,
  onAlternarEntera,
  onEditarEtapas,
  volar,
}: {
  vacante: VacanteUI
  proceso: Proceso
  etapa: EtapaVacante
  indice: number
  // Qué tarjetas vuelan al cambiar de etapa (todas menos la que se está arrastrando o se acaba de soltar).
  volar: (id: string) => boolean
  // Abierta entera con «Ver N más» (solo cuando el tope no manda a otra vista).
  entera: boolean
  onAlternarEntera: () => void
  // Las tarjetas que se ven (ya recortadas si hay tope).
  gente: Candidatura[]
  // Todas las de la etapa que pasan los filtros, también las que no caben: «Seleccionar a las N» las elige a todas (VA-24).
  todas: Candidatura[]
  criterio: OrdenColumna
  onCriterio: (como: OrdenColumna) => void
  // Mientras cargan, cada tarjeta es su silueta (las mismas que llegarán, para que nada salte).
  cargando: boolean
  // Cuántas pasan los filtros en esta etapa, y cuántas hay en proceso sin filtros.
  total: number
  enProceso: number
  filtrando: boolean
  arrastrable: boolean
  marcadas: string[]
  onMarcadas: (ids: string[]) => void
  abiertaId: string | null
  onAbrir: (candidatura: Candidatura) => void
  accionesColumna?: (etapa: EtapaVacante, gente: Candidatura[]) => ReactNode
  tope?: Tope
  onEditarEtapas?: () => void
}) {
  const fuera = proceso.rechazadas.filter((r) => r.candidatura.etapa === etapa.id)
  const todasMarcadas = todas.length > 0 && todas.every((c) => marcadas.includes(c.id))
  const resto = total - gente.length

  const tarjetas = cargando && gente.length ? (
    <Esqueleto etiqueta={`Cargando a las personas de ${etapa.titulo}`} className="flex flex-col gap-2">
      {gente.map((candidatura) => (
        <TarjetaCargando key={candidatura.id} conCasilla={arrastrable} />
      ))}
    </Esqueleto>
  ) : gente.length ? (
    // Las que ya no pasan un filtro se van con su salida; las demás se reacomodan.
    <AnimatePresence initial={false}>
    {gente.map((candidatura, puesto) => (
      <Tarjeta
        key={candidatura.id}
        volar={volar(candidatura.id)}
        // Entran en diagonal: columna por columna y, dentro de cada una, de arriba abajo.
        orden={indice + puesto}
        vacante={vacante}
        proceso={proceso}
        candidatura={candidatura}
        arrastrable={arrastrable}
        abierta={candidatura.id === abiertaId}
        marcada={marcadas.includes(candidatura.id)}
        transito={proceso.transitoDe(candidatura.id)}
        nueva={proceso.nuevas.get(candidatura.id)}
        onAbrir={() => onAbrir(candidatura)}
        onMarcar={(marcada) =>
          onMarcadas(marcada ? [...marcadas, candidatura.id] : marcadas.filter((id) => id !== candidatura.id))
        }
      />
    ))}
    </AnimatePresence>
  ) : (
    // La columna vacía sigue siendo un lugar donde soltar: lo dice, sin dibujar una caja aparte.
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1, ease: CURVA }}
      className="flex min-h-24 flex-col items-center justify-center gap-1 px-3 text-center"
    >
      <Text as="span" variant="muted" size="sm">
        {filtrando && enProceso ? 'Nadie con esos filtros' : 'Nadie en esta etapa'}
      </Text>
      {arrastrable ? (
        <Text as="span" variant="muted" size="xs">
          Suelta aquí una tarjeta para moverla
        </Text>
      ) : null}
    </motion.div>
  )

  const cuerpo = (
    // Las columnas entran de izquierda a derecha, en el orden del proceso; las tarjetas las siguen en diagonal.
    <motion.div
      className="h-full"
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: Math.min(indice, 8) * 0.05, ease: CURVA }}
    >
    {/* `data-etapa`: Orbit Flow trae esta columna a la vista con «Ver» (OF-19). */}
    <Frame spacing="sm" className="h-full" data-etapa={etapa.id}>
      <FrameHeader className="flex flex-row items-center gap-2">
        <Text as="span" variant="muted" size="sm" className="tabular-nums">
          {indice + 1}
        </Text>
        {/* Las etapas que hace la IA llevan su icono (reglas de IA, 23 sep). */}
        {etapa.ia ? <IconoIA /> : null}
        {/* El nombre de la etapa baja a dos líneas en vez de cortarse («Antecedentes judiciales», VA-41). */}
        <FrameTitle className="min-w-0 line-clamp-2" title={etapa.titulo}>
          {etapa.titulo}
        </FrameTitle>
        {/* Mientras se filtra cuenta lo que se ve; cuántas hay en total lo dice la barra («2 de 9 personas»). */}
        <Badge
          variant={total ? 'secondary' : 'outline'}
          className="ms-auto shrink-0 tabular-nums"
          aria-label={filtrando ? `${total} de ${enProceso} en esta etapa` : `${total} en esta etapa`}
        >
          {/* Cuenta hacia arriba o hacia abajo cuando alguien entra o sale de la etapa. */}
          <CifraAnimada valor={total} duracion={0.45} />
        </Badge>
        <DropdownMenu>
          <Hint label="Acciones de la etapa" side="top">
            <DropdownMenuTrigger render={<BotonIcono size="icon-xs" aria-label={`Acciones de la etapa ${etapa.titulo}`} />}>
              <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
            </DropdownMenuTrigger>
          </Hint>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{etapa.titulo}</DropdownMenuLabel>
              <DropdownMenuItem
                disabled={!todas.length || !arrastrable}
                onClick={() =>
                  onMarcadas(
                    todasMarcadas
                      ? marcadas.filter((id) => !todas.some((c) => c.id === id))
                      : [...new Set([...marcadas, ...todas.map((c) => c.id)])],
                  )
                }
              >
                <HugeiconsIcon icon={Tick02Icon} size={16} />
                {todasMarcadas ? 'Quitar la selección de esta etapa' : `Seleccionar a ${todas.length === 1 ? 'la persona' : `las ${todas.length}`} de esta etapa`}
              </DropdownMenuItem>
              {accionesColumna?.(etapa, gente)}
            </DropdownMenuGroup>
            {todas.length > 1 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Ordenar la etapa</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={criterio} onValueChange={(valor) => onCriterio(valor as OrdenColumna)}>
                    {ORDENES.map((opcion) => (
                      <DropdownMenuRadioItem key={opcion.valor} value={opcion.valor}>
                        {opcion.texto}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </>
            ) : null}
            {onEditarEtapas && arrastrable ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={onEditarEtapas}>
                    <HugeiconsIcon icon={Settings01Icon} size={16} />
                    Cambiar las etapas de la vacante
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </FrameHeader>

      {/* Sin «N esperan» bajo el nombre de la etapa (13 oct, información repetida): quien espera ya se marca en su
          tarjeta y se filtra con «Esperan respuesta». */}

      {arrastrable ? (
        <KanbanColumnContent value={etapa.id} className="flex min-h-24 flex-col gap-2 p-0.5">
          {tarjetas}
        </KanbanColumnContent>
      ) : (
        <div className="flex min-h-24 flex-col gap-2 p-0.5">{tarjetas}</div>
      )}

      {/* Más de las que caben: el resto, a un clic (Greenhouse corta en diez y manda a la tabla). Sin otra vista adonde
          mandarlo, se abre aquí mismo y se puede volver a recoger. */}
      {tope && resto > 0 ? (
        tope.onVer ? (
          <Button variant="ghost" size="sm" className="mx-0.5 mt-1" onClick={() => tope.onVer?.(etapa.id)}>
            {tope.etiqueta(resto)}
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="mx-0.5 mt-1" onClick={onAlternarEntera}>
            {tope.etiqueta(resto)}
            <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
          </Button>
        )
      ) : tope && !tope.onVer && entera && total > tope.cuantos ? (
        <Button variant="ghost" size="sm" className="mx-0.5 mt-1" onClick={onAlternarEntera}>
          Ver menos
          <HugeiconsIcon icon={ArrowUp01Icon} size={16} />
        </Button>
      ) : null}

      <Rechazados etapa={etapa} fuera={fuera} abiertaId={abiertaId} onAbrir={(rechazada) => onAbrir(rechazada.candidatura)} />
    </Frame>
    </motion.div>
  )

  return arrastrable ? <KanbanColumn value={etapa.id}>{cuerpo}</KanbanColumn> : <div>{cuerpo}</div>
}

// Pie de la columna: a quién se rechazó en esta etapa, como en el producto de hoy («Rechazados: N»). Plegado, porque lo
// que se trabaja son los activos, y sin arrastre: volver a meter a alguien no es mover una tarjeta (quizá ya le llegó el
// correo), así que tiene su propia ventana.
//
// Toda la fila abre la ficha en el panel lateral, como una tarjeta: arriba dice dónde se quedó, el motivo, quién decidió,
// quién lo registró y si le llegó el correo (`BloqueRechazo`), y abajo «Volver a considerar». Del 29 sep (reunión con
// Elkin) al 1 oct el nombre abría un globo con eso mismo; Nicolás prefirió el panel («prefiero que al dar clic se abra el
// drawer y no ese modal… y que se pueda dar clic en la zona completa»). El nombre sigue siendo el enlace para el teclado:
// su clic sube a la fila.
function Rechazados({
  etapa,
  fuera,
  abiertaId,
  onAbrir,
}: {
  etapa: EtapaVacante
  fuera: Rechazada[]
  abiertaId: string | null
  onAbrir: (rechazada: Rechazada) => void
}) {
  const [todos, setTodos] = useState(false)
  if (!fuera.length) {
    return (
      <Text as="p" variant="muted" size="xs" className="px-3 pt-1 pb-2">
        Rechazados · 0
      </Text>
    )
  }
  const mostrar = todos ? fuera : fuera.slice(0, 5)
  return (
    <Collapsible className="flex flex-col gap-2">
      <CollapsibleTrigger
        render={<Button variant="ghost" size="sm" className="group w-full justify-between px-3!" />}
        aria-label={`Rechazados en ${etapa.titulo}: ${fuera.length}`}
      >
        <span className="tabular-nums">Rechazados · {fuera.length}</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={16}
          aria-hidden="true"
          className="transition-transform group-data-[panel-open]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-1.5 p-0.5">
        {mostrar.map((rechazada) => (
          <Item
            key={rechazada.candidatura.id}
            size="xs"
            variant="muted"
            // Se oscurece al pasar y se queda así mientras su ficha está abierta, como las tarjetas. Las tarjetas son blancas
            // y pasan a gris; esta fila ya es gris (y en claro `accent` es el mismo gris), así que lleva el velo de los
            // botones sin borde. Con `!` porque el gris del `Item` le gana a la clase.
            className={cn(
              'cursor-pointer items-start! transition-colors',
              rechazada.candidatura.id === abiertaId ? 'bg-foreground/10!' : 'hover:bg-foreground/6!',
            )}
            onClick={() => onAbrir(rechazada)}
          >
            <ItemContent className="min-w-0!">
              <ItemTitle className="w-full!">
                <Button variant="link" size="sm" className="h-auto! max-w-full cursor-pointer justify-start! p-0!">
                  <span className="truncate">{rechazada.candidatura.candidato.nombre}</span>
                </Button>
              </ItemTitle>
              <ItemDescription className="truncate">
                {quienDe(rechazada) === 'candidato' ? 'Se retiró: ' : ''}
                {rechazada.motivo}
              </ItemDescription>
            </ItemContent>
          </Item>
        ))}
        {fuera.length > 5 ? (
          <Button variant="ghost" size="sm" onClick={() => setTodos(!todos)}>
            {todos ? 'Ver menos' : `Ver a los ${fuera.length}`}
          </Button>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  )
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════
// La tarjeta
// ══════════════════════════════════════════════════════════════════════════════════════════════════════

// Lo que va dentro de la tarjeta no la agarra ni la abre: la casilla y el menú se quedan con su clic y su teclado.
// Y muestran la mano de clic, no la de agarrar: toda la tarjeta tiene el puntero de arrastre y sobre la casilla no
// tenía sentido (24 sep, Nicolás).
const soloAqui = {
  onClick: (evento: { stopPropagation: () => void }) => evento.stopPropagation(),
  onPointerDown: (evento: { stopPropagation: () => void }) => evento.stopPropagation(),
  onKeyDown: (evento: { stopPropagation: () => void }) => evento.stopPropagation(),
}

// La silueta de la tarjeta: las mismas líneas en los mismos altos (quién es y qué hace hoy, y el puntaje con los días en
// la etapa), dentro del mismo marco. Si la tarjeta cambia de forma, esto cambia con ella (15 oct: de cinco líneas a tres).
function TarjetaCargando({ conCasilla }: { conCasilla: boolean }) {
  return (
    <Frame variant="ghost" spacing="sm" className="p-0">
      <FramePanel className="flex flex-col gap-2.5 p-3.5">
        <div className="flex items-start gap-2">
          {conCasilla ? (
            <span className="flex pt-1">
              <Skeleton className="size-4 rounded-sm" />
            </span>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <LineaEsqueleto ancho="w-3/4" className="h-5.5" />
            <LineaEsqueleto tamano="chico" ancho="w-full" />
          </div>
        </div>
        <div className="-mb-1 flex min-h-6 flex-col justify-center">
          <LineaEsqueleto ancho="w-1/2" />
        </div>
      </FramePanel>
    </Frame>
  )
}

function Tarjeta({
  vacante,
  proceso,
  candidatura,
  arrastrable,
  abierta,
  marcada,
  transito,
  nueva,
  onAbrir,
  onMarcar,
  orden = 0,
  volar = true,
}: {
  // En qué turno entra al aparecer (13 oct, PM: más movimiento): las tarjetas entran una tras otra.
  orden?: number
  // Si vuela a su nueva etapa al moverse. No mientras se arrastra ni justo al soltar: de eso se encarga el tablero, y
  // las dos cosas a la vez se pelean.
  volar?: boolean
  vacante: VacanteUI
  proceso: Proceso
  candidatura: Candidatura
  arrastrable: boolean
  abierta: boolean
  marcada: boolean
  transito?: Transito
  nueva?: 'nueva' | 'volvio'
  onAbrir: () => void
  onMarcar: (marcada: boolean) => void
}) {
  const { candidato, dias } = candidatura
  // Solo lo que espera al equipo: lo que le falta hacer a la persona (agendar con Serena) se ve en «En proceso».
  const espera = ESPERANDO_ACCION(candidatura)
  const moviendo = transito?.tipo === 'moviendo'
  // Su puntaje en esta vacante: el promedio de sus evaluaciones, con las mismas cifras de su ficha.
  const movimientos = useMovimientos(candidatura.id)
  const evaluaciones = useMemo(() => resumenDeEvaluaciones(candidatura, movimientos), [candidatura, movimientos])
  const cuantoAqui =
    candidatura.importada || candidatura.postulada ? 'Entró hoy' : dias === 0 ? 'Llegó hoy aquí' : `${dias} ${dias === 1 ? 'día' : 'días'} aquí`

  // La tarjeta abierta se trae a la vista: al recorrer con J/K o con las flechas de la ficha puede estar en una
  // columna que no se ve.
  const caja = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (abierta) caja.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [abierta])

  const aparece = entrada(orden, 8)
  const panel = (
    <motion.div
      initial={aparece.initial}
      animate={aparece.animate}
      // Cuando cambia de etapa con el menú, desde su ficha, en lote o con Orbit Flow, la tarjeta vuela de una columna a la
      // otra y las demás se corren para hacerle sitio (15 oct, glow up de movimiento): se ve a dónde se fue.
      layout={volar ? 'position' : false}
      layoutId={volar ? `tarjeta-${candidatura.id}` : undefined}
      transition={{ ...aparece.transition, layout: RESORTE }}
      // Al filtrar, la que ya no entra se encoge y se va; las demás suben a ocupar su lugar.
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.16, ease: CURVA } }}
      // Se levanta un poco al pasar el cursor y cede al apretar: se siente que se puede tomar.
      whileHover={arrastrable ? { y: -2, transition: { duration: 0.18, ease: CURVA } } : undefined}
      whileTap={{ scale: 0.985, transition: { duration: 0.12 } }}
    >
    <Frame ref={caja} variant="ghost" spacing="sm" className="p-0">
      <FramePanel
        aria-busy={moviendo || undefined}
        // La abierta, en gris como la fila elegida de la bandeja. Rellena de azul, la casilla, la cara y las etiquetas
        // quedaban como parches blancos encima (24 sep, Nicolás).
        className={cn('flex flex-col gap-2.5 p-3.5 transition-colors', abierta ? 'bg-accent' : 'hover:bg-accent/60')}
      >
        <div className="flex items-start gap-2">
          {/* Con la vacante cerrada no hay nada que hacer con varias a la vez: sin casilla. */}
          {arrastrable ? (
            <span {...soloAqui} className="flex cursor-pointer pt-1">
              <Checkbox checked={marcada} onCheckedChange={(valor) => onMarcar(valor === true)} aria-label={`Elegir a ${candidato.nombre}`} />
            </span>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <Button
              variant="link"
              className="h-auto! w-fit max-w-full cursor-pointer justify-start! p-0!"
              onClick={(evento) => {
                evento.stopPropagation()
                onAbrir()
              }}
              // Enter abre la ficha; sin esto subiría a la tarjeta y la tomaría para arrastrarla.
              onKeyDown={(evento) => evento.stopPropagation()}
            >
              <span className={cn('truncate', abierta && 'dark:text-foreground')}>{candidato.nombre}</span>
            </Button>
            {moviendo ? (
              <Skeleton className="my-0.5 h-3 w-28 max-w-full" />
            ) : (
              <Text as="span" variant="muted" size="sm" className="line-clamp-2">
                {candidato.cargo} · {candidato.empresa}
              </Text>
            )}
          </div>
          {/* El menú arriba, junto al nombre: abajo queda solo cómo va. */}
          <MenuTarjeta vacante={vacante} proceso={proceso} candidatura={candidatura} arrastrable={arrastrable} onAbrir={onAbrir} />
        </div>

        {/* 15 oct, Nicolás: «esto tiene demasiada información». La tarjeta dice quién es, de dónde viene y cómo va; lo
            demás está en su ficha. Salieron el «N de 4 requisitos» (13 oct, la PM: «la rúbrica que vota la evaluación
            de CV no es Camila cumple 5 de los 10 requerimientos»: da un puntaje), cuántas evaluaciones lleva, cuándo
            aplicó y si fue empleado. Lo único con color de aviso sigue siendo «Esperando acción». */}
        {/* Aparecen con un pequeño rebote cuando llegan (se movió y ahora espera algo, o acaba de entrar). */}
        <AnimatePresence initial={false}>
          {moviendo || transito?.tipo === 'fallo' || transito?.tipo === 'movida' ? null : nueva ? (
            <motion.span key="nueva" {...POP} className="flex w-fit max-w-full origin-left">
              <Badge variant="info-light" className="max-w-full truncate">
                {nueva === 'volvio' ? 'Volvió' : 'Nueva'}
              </Badge>
            </motion.span>
          ) : espera ? (
            <motion.span key="espera" {...POP} className="flex w-fit max-w-full origin-left">
              <Hint label={candidato.accion} side="top">
                <Badge variant="warning-light" className="max-w-full truncate">
                  Esperando acción
                </Badge>
              </Hint>
            </motion.span>
          ) : null}
        </AnimatePresence>

        {/* Cómo va: su puntaje y cuánto lleva en la etapa (o «Pasando a…» / «Pasó a…» mientras se mueve). */}
        <div className="-mb-1 flex min-h-6 min-w-0 items-center text-xs">
          <span className="flex min-w-0 flex-1 items-center">
            {moviendo ? (
              <span role="status" className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <Spinner />
                <span className="truncate">Pasando a {tituloEtapa(transito.destino)}…</span>
              </span>
            ) : transito?.tipo === 'fallo' ? (
              // No se guardó: sigue en esta columna, y la tarjeta lo dice mientras el aviso ofrece «Reintentar».
              <motion.span role="status" {...POP} className="flex min-w-0 origin-left items-center">
                <Badge variant="destructive-outline" className="min-w-0">
                  <HugeiconsIcon icon={Alert02Icon} size={12} aria-hidden />
                  <span className="truncate">No se pudo mover</span>
                </Badge>
              </motion.span>
            ) : transito?.tipo === 'movida' ? (
              <motion.span role="status" {...POP} className="flex min-w-0 origin-left items-center">
                {/* La movió otra persona del equipo (VA-23): se dice quién, para que nadie la mueva encima sin saberlo. */}
                <Badge variant={transito.por ? 'info-light' : 'success-light'} className="min-w-0">
                  <HugeiconsIcon icon={transito.por ? UserSwitchIcon : Tick02Icon} size={12} aria-hidden />
                  <span className="truncate">
                    {transito.por ? `${transito.por} la movió a` : transito.atras ? 'Volvió a' : 'Pasó a'} {tituloEtapa(transito.destino)}
                  </span>
                </Badge>
              </motion.span>
            ) : (
              <Text as="span" variant="muted" size="sm" className="min-w-0 tabular-nums">
                {/* El puntaje, con de qué sale al pasar el cursor; sin evaluaciones con puntaje, se dice así. */}
                <Hint
                  label={
                    evaluaciones.puntajes.length
                      ? `Promedio de ${evaluaciones.puntajes.map((uno) => `${uno.etapa} (${uno.puntaje})`).join(', ')}. El detalle está en cada etapa, en el «Resumen» de su ficha.`
                      : 'Todavía no tiene evaluaciones con puntaje en esta vacante.'
                  }
                  side="top"
                >
                  <span className="whitespace-nowrap">
                    {evaluaciones.promedio !== null ? (
                      <>
                        Puntaje{' '}
                        <Text as="span" size="sm" weight="medium">
                          {/* Sube hasta su valor al llegar, como las cifras de arriba (13 oct, PM: «que esos numeritos se muevan»). */}
                          <CifraAnimada valor={evaluaciones.promedio} duracion={0.7} />
                        </Text>
                      </>
                    ) : (
                      'Sin puntaje'
                    )}
                  </span>
                </Hint>{' '}
                · <span className="whitespace-nowrap">{cuantoAqui}</span>
              </Text>
            )}
          </span>
        </div>
      </FramePanel>
    </Frame>
    </motion.div>
  )

  if (!arrastrable) {
    return (
      <div className="cursor-pointer" onClick={onAbrir}>
        {panel}
      </div>
    )
  }
  // Toda la tarjeta se agarra (el arrastre arranca a los 10px, así que un clic la abre); con teclado, el nombre abre la
  // ficha y el menú «⋯» la mueve.
  return (
    // Un nombre corto para el lector de pantalla (persona, etapa y cuánto cumple), no todo el texto de la tarjeta, y
    // Enter abre la ficha como el clic; la barra espaciadora la toma para moverla (VA-21).
    <KanbanItem
      value={candidatura.id}
      /* Con «Espera», también qué espera (VA-40): el globo solo abre con el cursor. */
      aria-label={`${candidatura.candidato.nombre}, ${tituloEtapa(candidatura.etapa)}${evaluaciones.promedio !== null ? `, puntaje ${evaluaciones.promedio}` : ''}${espera && candidato.accion ? `, espera: ${candidato.accion}` : ''}. Enter abre su ficha; barra espaciadora para moverla.`}
      onKeyDown={(evento) => {
        if (evento.key === 'Enter') {
          evento.preventDefault()
          evento.stopPropagation()
          onAbrir()
        }
      }}
    >
      <KanbanItemHandle onClick={onAbrir}>{panel}</KanbanItemHandle>
    </KanbanItem>
  )
}

// El menú de la tarjeta: todo lo que se puede hacer con una persona sin abrir su ficha, y la forma de moverla sin
// arrastrar.
// También es el «⋯» de cada fila en la vista «Lista» de la vacante (`lista-candidatos.tsx`).
export function MenuTarjeta({
  vacante,
  proceso,
  candidatura,
  arrastrable,
  onAbrir,
}: {
  vacante: VacanteUI
  proceso: Proceso
  candidatura: Candidatura
  arrastrable: boolean
  onAbrir: () => void
}) {
  const { candidato } = candidatura
  const siguiente = siguienteEtapaDe(vacante.etapas, candidatura.etapa)
  const moviendo = proceso.enTransito.has(candidatura.id)
  const moverA = (destino: string) => proceso.pedirMover([{ candidatura, destino }])
  // Entró a una etapa con IA sin invitación («Solo moverla» o sin créditos): se le envía desde aquí (13 oct, PM).
  const sinInvitacion = useSinInvitacion(candidatura)

  return (
    <span {...soloAqui} className="-mr-1 flex shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<BotonIcono size="icon-xs" className="cursor-pointer" aria-label={`Acciones para ${candidato.nombre}`} />}
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="truncate">{candidato.nombre}</DropdownMenuLabel>
            <DropdownMenuItem onClick={onAbrir}>
              <HugeiconsIcon icon={ViewIcon} size={16} />
              Ver ficha
            </DropdownMenuItem>
            {arrastrable && sinInvitacion ? (
              <DropdownMenuItem disabled={moviendo} onClick={() => proceso.pedirInvitacion(candidatura)}>
                <HugeiconsIcon icon={Mail01Icon} size={16} />
                Enviar la invitación…
              </DropdownMenuItem>
            ) : null}
            {arrastrable && siguiente ? (
              <DropdownMenuItem disabled={moviendo} onClick={() => moverA(siguiente)}>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                Avanzar a {tituloEtapa(siguiente)}
              </DropdownMenuItem>
            ) : null}
            {arrastrable ? (
              // La misma ventana de la ficha: elegir la etapa, ver qué pasa con eso, escribirle y comentar.
              <DropdownMenuItem disabled={moviendo} onClick={() => proceso.elegirEtapa([candidatura])}>
                <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} size={16} />
                Mover a otra etapa…
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => {
                void navigator.clipboard?.writeText(candidato.correo)
                notify('Copiaste el correo', candidato.correo, 'success')
              }}
            >
              <HugeiconsIcon icon={Copy01Icon} size={16} />
              Copiar correo
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {arrastrable ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem disabled={moviendo} onClick={() => proceso.pedirRechazo([candidatura])}>
                  <HugeiconsIcon icon={UserRemove01Icon} size={16} />
                  Rechazar…
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  )
}
