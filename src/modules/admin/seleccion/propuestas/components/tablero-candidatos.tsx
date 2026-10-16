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
  MoreHorizontalIcon,
  Search01Icon,
  Settings01Icon,
  Tick02Icon,
  UserAccountIcon,
  UserAdd01Icon,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Spinner,
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
  ESPERA_RESPUESTA,
  cumplidosDe,
  fueEmpleado,
  pasoPorLaEmpresa,
  primeraEtapaDe,
  siguienteEtapaDe,
  tituloEtapa,
  type Candidatura,
  type EtapaVacante,
  type Rechazada,
  type VacanteUI,
  CANDIDATURAS,
} from '../datos'
import { plural } from '@/modules/design-system/patrones/formato'
import { quienDe } from '../rechazos'
import { QUIEN_MUEVE, useMovimientos } from '../movimientos'
import { simulado } from '../simular'
import { diasDesdeQueAplico, resumenDeEvaluaciones } from '../perfil-candidato'
import { delLote } from '../importacion'
import { FiltroChip } from './filtro-chip'
import type { Proceso, Transito } from './use-proceso'
import { ErrorDeCarga, Esqueleto, LineaEsqueleto, useCargaConError } from './carga'

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
// con casillas). Quedan búsqueda, «Esperan respuesta» y «Ex empleados» como chip de encender y apagar. El origen se
// fue el 8 oct (VP de producto: no se sabe por dónde llega cada persona).
// `lote`: quienes entraron con un lote de hojas de vida (1 oct, Nicolás: la gente de un lote se ve aquí, en el
// tablero, no en la pestaña «CVs importados», que es solo el registro de las cargas). Llega desde «Ver a quiénes» del
// lote y se quita con su chip.
// `minCumple`: cuántos requisitos tiene que cumplir como mínimo (VA-24: con 300 en una etapa se empieza por las que más
// cumplen). Null = cualquiera.
type Filtros = {
  busqueda: string
  soloEspera: boolean
  soloExEmpleados: boolean
  lote: { id: string; nombre: string } | null
  minCumple: number | null
}

const SIN_FILTROS: Filtros = { busqueda: '', soloEspera: false, soloExEmpleados: false, lote: null, minCumple: null }

// Cómo se ordena cada columna (VA-24). Por defecto, primero quien espera y después quien lleva más días: la prioridad del
// tablero. Con mucha gente sirve más empezar por quien más cumple o por quien llegó último.
export type OrdenColumna = 'prioridad' | 'ajuste' | 'recientes'
const ORDENES: { valor: OrdenColumna; texto: string }[] = [
  { valor: 'prioridad', texto: 'Primero quien espera' },
  { valor: 'ajuste', texto: 'Más requisitos cumplidos' },
  { valor: 'recientes', texto: 'Aplicaron más recientemente' },
]

const CUALQUIERA = 'cualquiera'

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

  const activos =
    Boolean(filtros.busqueda) || filtros.soloEspera || filtros.soloExEmpleados || filtros.lote !== null || filtros.minCumple !== null

  const { dentro, enTransito, recien, nuevas } = proceso

  const columnas = useMemo(() => {
    const pasa = (c: Candidatura) => {
      if (filtros.soloEspera && !ESPERA_RESPUESTA(c)) return false
      if (filtros.soloExEmpleados && !fueEmpleado(c)) return false
      if (filtros.lote && !delLote(filtros.lote.id)(c)) return false
      if (filtros.minCumple !== null && cumplidosDe(c.criterios) < filtros.minCumple) return false
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
          ? cumplidosDe(b.criterios) - cumplidosDe(a.criterios) || prioridad(a, b)
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
  vacante,
  proceso,
  tablero,
  onAgregar,
  inicio,
  fin,
}: {
  vacante: VacanteUI
  proceso: Proceso
  tablero: Tablero
  // Sin permiso para sumar gente (VA-11) no se pasa y el botón no aparece.
  onAgregar?: () => void
  // A pantalla completa la barra es la única franja de arriba: el nombre de la vacante al principio y «Cerrar» al final
  // (8 oct, Nicolás: «ya ampliado no debería estar encerrado… un cerrar a la derecha arriba»).
  inicio?: ReactNode
  fin?: ReactNode
}) {
  const { filtros, cambiar } = tablero
  const { dentro } = proceso
  const esperan = dentro.filter(ESPERA_RESPUESTA).length
  const exEmpleados = dentro.filter(fueEmpleado).length
  const visibles = tablero.enOrden.length
  // Cuántos requisitos pide la vacante (el máximo que tiene alguien evaluado) y cuántas personas cumplen al menos N.
  const requisitos = Math.max(0, ...dentro.map((c) => c.criterios.length))
  const alMenos = (n: number) => dentro.filter((c) => cumplidosDe(c.criterios) >= n).length

  // Sin nadie en el proceso no hay qué buscar ni filtrar: solo la acción de sumar gente (VA-43).
  if (!dentro.length && !proceso.rechazadas.length)
    return vacante.estado !== 'Cerrada' && onAgregar ? (
      <div className="flex flex-wrap items-center gap-2 px-5 py-3">
        {inicio}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={onAgregar}>
            <HugeiconsIcon icon={UserAdd01Icon} size={16} />
            Agregar candidatos
          </Button>
          {fin}
        </div>
      </div>
    ) : null

  return (
    <div className="flex flex-wrap items-center gap-2 px-5 py-3">
      {inicio}
      <InputGroup className="w-full sm:w-52">
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

      <FiltroChip
        activo={filtros.soloEspera}
        onCambiar={(valor) => cambiar({ soloEspera: valor })}
        icono={Alert02Icon}
        texto="Esperan respuesta"
        cuenta={esperan}
        ayuda="Ver solo a quien espera una respuesta"
      />

      {/* El filtro que ya tiene la pestaña de hoy («Candidatos que han trabajado en la compañía anteriormente»), como
          chip: prendido muestra solo a quien trabajó aquí. Si nadie en la vacante trabajó aquí, no aparece. */}
      {exEmpleados || filtros.soloExEmpleados ? (
        <FiltroChip
          activo={filtros.soloExEmpleados}
          onCambiar={(valor) => cambiar({ soloExEmpleados: valor })}
          icono={UserAccountIcon}
          texto="Ex empleados"
          cuenta={exEmpleados}
          ayuda="Ver solo a quien ya trabajó en la empresa"
        />
      ) : null}

      {/* Sin filtro de origen (8 oct, VP de producto): todos aplican por el portal de empleo; de dónde vio cada persona
          la vacante no se sabe y no se va a saber. */}

      {/* Con mucha gente se empieza por quien más cumple (VA-24): «Cumplen los 4», «Al menos 3 de 4»… */}
      {requisitos > 1 ? (
        <Select
          value={filtros.minCumple === null ? CUALQUIERA : String(filtros.minCumple)}
          onValueChange={(valor) => cambiar({ minCumple: valor === CUALQUIERA ? null : Number(valor) })}
        >
          <SelectTrigger className="w-52" aria-label="Cuántos requisitos cumplen">
            <SelectValue>
              {(valor: string) =>
                valor === CUALQUIERA ? 'Cualquier requisito' : Number(valor) === requisitos ? `Cumplen los ${requisitos}` : `Cumplen ${valor} de ${requisitos} o más`
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CUALQUIERA}>Cualquier requisito</SelectItem>
            {Array.from({ length: requisitos }, (_, i) => requisitos - i).map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n === requisitos ? `Cumplen los ${requisitos}` : `Cumplen ${n} de ${requisitos} o más`} · {alMenos(n)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

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

      {tablero.activos ? (
        <Button variant="ghost" onClick={tablero.limpiar}>
          Quitar filtros
        </Button>
      ) : null}

      {/* Cuántas quedan solo mientras se filtra: sin filtros, cada columna ya dice las suyas. */}
      {tablero.activos ? (
        <Text as="span" role="status" variant="muted" size="sm" className="tabular-nums">
          {visibles} de {personas(dentro.length)}
        </Text>
      ) : null}
      {/* El secundario, a la derecha. «Ampliar» ya no va aquí: flota en la esquina del propio tablero (8 oct). */}
      <div className="ml-auto flex items-center gap-2">
        {vacante.estado !== 'Cerrada' && onAgregar ? (
          <Button variant="outline" onClick={onAgregar}>
            <HugeiconsIcon icon={UserAdd01Icon} size={16} />
            Agregar candidatos
          </Button>
        ) : null}
        {fin}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════
// El aviso de vacante cerrada y el pie con cómo se usa
// ══════════════════════════════════════════════════════════════════════════════════════════════════════

export function AvisoVacanteCerrada({
  vacante,
  onReabrir,
  siguen = 0,
  onRechazarQuienesSiguen,
}: {
  vacante: VacanteUI
  onReabrir?: () => void
  // Quienes siguen en el proceso de la vacante cerrada: se les cierra con un rechazo y su correo (VA-10).
  siguen?: number
  onRechazarQuienesSiguen?: () => void
}) {
  if (vacante.estado !== 'Cerrada') return null
  return (
    <div className="px-5 pt-4">
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
  onAgregar,
  onImportar,
  accionesColumna,
  accionEsperan,
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
  onAgregar: (etapa?: string) => void
  onImportar: () => void
  // Lo propio de cada exploración en el menú de la columna («Ver en el pipeline», «Revisar a quien espera»…).
  accionesColumna?: (etapa: EtapaVacante, gente: Candidatura[]) => ReactNode
  // Junto a «N esperan una respuesta»: el atajo para ir a resolverlo (la 3 manda a Revisar).
  accionEsperan?: { etiqueta: string; onClick: (etapa: string) => void }
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
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={UserMultipleIcon} size={24} />
          </EmptyMedia>
          <EmptyTitle>Todavía no hay nadie en el proceso</EmptyTitle>
          <EmptyDescription>
            {vacante.estado === 'Borrador'
              ? 'Mientras esté en borrador no recibe aplicaciones. Puedes traer gente de tu base o de un lote de CVs.'
              : vacante.estado === 'Cerrada'
                ? 'La vacante se cerró sin nadie en el proceso.'
                : `Las aplicaciones entran a «${tituloEtapa(primeraEtapaDe(vacante.etapas))}». También puedes traer gente de tu base o de un lote de CVs.`}
          </EmptyDescription>
        </EmptyHeader>
        {!soloLectura ? (
          <EmptyContent className="flex-row! justify-center gap-2">
            <Button variant="outline" onClick={() => onAgregar()}>
              <HugeiconsIcon icon={UserAdd01Icon} size={16} />
              Agregar desde Mis candidatos
            </Button>
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
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Search01Icon} size={24} />
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
      onAgregar={onAgregar}
      accionesColumna={accionesColumna}
      accionEsperan={accionEsperan}
      tope={tope}
      entera={enteras.includes(etapa.id)}
      onAlternarEntera={() => alternarEntera(etapa.id)}
      onEditarEtapas={onEditarEtapas}
    />
  ))

  return (
    // Con desplazamiento propio en las dos direcciones: cinco o seis etapas no caben siempre, y una columna llena no
    // puede empujar la página entera (la barra horizontal quedaría lejísimos).
    <ScrollArea className="h-full w-full">
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
            onDragEnd={() => setArrastre(null)}
            onDragCancel={() => setArrastre(null)}
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
  onAgregar,
  accionesColumna,
  accionEsperan,
  tope,
  entera,
  onAlternarEntera,
  onEditarEtapas,
}: {
  vacante: VacanteUI
  proceso: Proceso
  etapa: EtapaVacante
  indice: number
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
  onAgregar: (etapa?: string) => void
  accionesColumna?: (etapa: EtapaVacante, gente: Candidatura[]) => ReactNode
  accionEsperan?: { etiqueta: string; onClick: (etapa: string) => void }
  tope?: Tope
  onEditarEtapas?: () => void
}) {
  const esperan = gente.filter(ESPERA_RESPUESTA).length
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
    gente.map((candidatura) => (
      <Tarjeta
        key={candidatura.id}
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
    ))
  ) : (
    // La columna vacía sigue siendo un lugar donde soltar: lo dice, sin dibujar una caja aparte.
    <div className="flex min-h-24 flex-col items-center justify-center gap-1 px-3 text-center">
      <Text as="span" variant="muted" size="sm">
        {filtrando && enProceso ? 'Nadie con esos filtros' : 'Nadie en esta etapa'}
      </Text>
      {arrastrable ? (
        <Text as="span" variant="muted" size="xs">
          Suelta aquí una tarjeta para moverla
        </Text>
      ) : null}
    </div>
  )

  const cuerpo = (
    // `data-etapa`: Orbit Flow trae esta columna a la vista con «Ver» (OF-19).
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
          {total}
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
              {arrastrable ? (
                <DropdownMenuItem onClick={() => onAgregar(etapa.id)}>
                  <HugeiconsIcon icon={UserAdd01Icon} size={16} />
                  Agregar candidatos a esta etapa
                </DropdownMenuItem>
              ) : null}
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

      {/* Cuántos esperan en la etapa: dice dónde se atasca el proceso sin contar tarjetas. */}
      {esperan ? (
        <div className="mx-3 -mt-1 mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Badge variant="warning-light" className="tabular-nums">
            {esperan} {esperan === 1 ? 'espera' : 'esperan'}
          </Badge>
          {accionEsperan ? (
            <Button variant="link" size="sm" className="h-auto! p-0!" onClick={() => accionEsperan.onClick(etapa.id)}>
              {accionEsperan.etiqueta}
            </Button>
          ) : null}
        </div>
      ) : null}

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

// Cuatro líneas, siempre las mismas en todas las tarjetas para que la columna se lea pareja: quién es, qué hace hoy,
// cuánto cumple (y si espera o es nueva), y cuánto lleva en la etapa. Mientras se mueve, la última dice «Pasando a…»
// y después «Pasó a…».
// La silueta de la tarjeta: las mismas cuatro líneas en los mismos altos (quién es y qué hace hoy, cuánto cumple, sus
// evaluaciones y el pie), dentro del mismo marco. Si la tarjeta cambia de forma, esto cambia con ella.
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
        <div className="flex h-6 items-center">
          <Skeleton className="h-5 w-24" />
        </div>
        <LineaEsqueleto ancho="w-3/5" />
        <div className="-mb-1 flex min-h-6 flex-col justify-center">
          <LineaEsqueleto tamano="chico" ancho="w-4/5" />
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
}: {
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
  const { candidato, criterios, dias } = candidatura
  const cumple = cumplidosDe(criterios)
  // El ajuste con color, como en la lista de la 1: verde si cumple todo, ámbar desde la mitad, neutro por debajo.
  const ajuste = cumple === criterios.length ? 'success-light' : cumple * 2 >= criterios.length ? 'warning-light' : 'outline'
  const espera = ESPERA_RESPUESTA(candidatura)
  const moviendo = transito?.tipo === 'moviendo'
  // Sus evaluaciones en esta vacante (las mismas cifras de su ficha) y cuándo aplicó.
  const movimientos = useMovimientos(candidatura.id)
  const evaluaciones = useMemo(() => resumenDeEvaluaciones(candidatura, movimientos), [candidatura, movimientos])
  const aplico = diasDesdeQueAplico(candidatura)
  const cuandoAplico =
    candidatura.importada || candidatura.postulada ? 'Entró hoy' : aplico === 1 ? 'Aplicó ayer' : `Aplicó hace ${aplico} días`

  // La tarjeta abierta se trae a la vista: al recorrer con J/K o con las flechas de la ficha puede estar en una
  // columna que no se ve.
  const caja = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (abierta) caja.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [abierta])

  const panel = (
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
        </div>

        <div className="flex h-6 items-center gap-1.5">
          {/* Cuántos requisitos de la vacante cumple, según la IA al leer su hoja de vida: lleva el icono de IA y lo dice
              con palabras («4/4» solo no se entendía, 24 sep; «Cumple 0/4» tampoco decía qué contaba, 1 oct: «¿qué es
              eso?»). El color: verde si cumple todos, ámbar desde la mitad, gris por debajo. El detalle, al pasar el
              cursor. */}
          <Hint
            label={
              criterios.length
                ? `Cumple ${cumple} de ${criterios.length} requisitos de la vacante, según la IA. En su ficha está la evidencia de cada uno.`
                : 'La vacante no tiene requisitos: la IA no tiene contra qué medir. Se agregan desde «Editar».'
            }
            side="top"
          >
            {/* Una vacante sin requisitos no tiene contra qué medir: se dice en gris, no «0 de 0» en verde (VA-42). */}
            {criterios.length ? (
              <Badge variant={ajuste} className="shrink-0 tabular-nums" aria-label={`Cumple ${cumple} de ${criterios.length} requisitos, según la IA`}>
                <IconoIA />
                {cumple} de {criterios.length} {plural(criterios.length, 'requisito', 'requisitos')}
              </Badge>
            ) : (
              <Badge variant="secondary" className="shrink-0">
                Sin requisitos para medir
              </Badge>
            )}
          </Hint>
          {nueva ? (
            <Badge variant="info-light" className="min-w-0 truncate">
              {nueva === 'volvio' ? 'Volvió' : 'Nueva'}
            </Badge>
          ) : espera ? (
            <Hint label={candidato.accion} side="top">
              <Badge variant="warning-light" className="min-w-0 truncate">
                Espera
              </Badge>
            </Hint>
          ) : null}
        </div>

        {/* Sus evaluaciones: el promedio de las que tienen puntaje y cuántas lleva. El detalle, al pasar el cursor. */}
        <Hint
          label={
            evaluaciones.puntajes.length
              ? `Promedio de ${evaluaciones.puntajes.map((uno) => `${uno.etapa} (${uno.puntaje})`).join(', ')}. El detalle está en cada etapa, en el «Resumen» de su ficha.`
              : evaluaciones.cuantas
                ? 'Sus evaluaciones no tienen puntaje sobre 100. El detalle está en cada etapa, en el «Resumen» de su ficha.'
                : 'Todavía no tiene evaluaciones en esta vacante.'
          }
          side="top"
        >
          {/* Sin cortar: en columnas angostas baja a una segunda línea antes que esconder la mitad. */}
          <Text as="span" variant="muted" size="sm" className="block w-fit max-w-full tabular-nums">
            {/* Cada dato entero: si no cabe, baja completo a la segunda línea. */}
            {evaluaciones.promedio !== null ? (
              <>
                <span className="whitespace-nowrap">Promedio {evaluaciones.promedio}/100</span> ·{' '}
              </>
            ) : null}
            <span className="whitespace-nowrap">
              {evaluaciones.cuantas === 0 ? 'Sin evaluaciones todavía' : evaluaciones.cuantas === 1 ? '1 evaluación' : `${evaluaciones.cuantas} evaluaciones`}
            </span>
          </Text>
        </Hint>

        {/* El pie: cuándo aplicó y cuánto lleva aquí (o «Pasando a…» / «Pasó a…» mientras se mueve) y el menú. */}
        <div className="-mb-1 flex min-h-6 min-w-0 items-center gap-1 text-xs">
          <span className="flex min-w-0 flex-1 items-center">
            {moviendo ? (
              <span role="status" className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <Spinner />
                <span className="truncate">Pasando a {tituloEtapa(transito.destino)}…</span>
              </span>
            ) : transito?.tipo === 'fallo' ? (
              // No se guardó: sigue en esta columna, y la tarjeta lo dice mientras el aviso ofrece «Reintentar».
              <span role="status" className="flex min-w-0 items-center">
                <Badge variant="destructive-outline" className="min-w-0">
                  <HugeiconsIcon icon={Alert02Icon} size={12} aria-hidden />
                  <span className="truncate">No se pudo mover</span>
                </Badge>
              </span>
            ) : transito?.tipo === 'movida' ? (
              <span role="status" className="flex min-w-0 items-center">
                {/* La movió otra persona del equipo (VA-23): se dice quién, para que nadie la mueva encima sin saberlo. */}
                <Badge variant={transito.por ? 'info-light' : 'success-light'} className="min-w-0 animate-in fade-in zoom-in-95 duration-300">
                  <HugeiconsIcon icon={transito.por ? UserSwitchIcon : Tick02Icon} size={12} aria-hidden />
                  <span className="truncate">
                    {transito.por ? `${transito.por} la movió a` : transito.atras ? 'Volvió a' : 'Pasó a'} {tituloEtapa(transito.destino)}
                  </span>
                </Badge>
              </span>
            ) : (
              <Text as="span" variant="muted" size="xs" className="min-w-0">
                {fueEmpleado(candidatura) ? (
                  <>
                    <span className="whitespace-nowrap">
                      {pasoPorLaEmpresa(candidatura.personaId, candidatura.candidato.cargo)?.tipo === 'interno' ? 'Interno' : 'Ex empleado'}
                    </span>{' '}
                    ·{' '}
                  </>
                ) : null}
                <span className="whitespace-nowrap">{cuandoAplico}</span>
                {candidatura.importada || candidatura.postulada ? null : (
                  <>
                    {' '}·{' '}
                    <span className="whitespace-nowrap">{dias === 0 ? 'llegó hoy aquí' : `${dias} ${dias === 1 ? 'día' : 'días'} aquí`}</span>
                  </>
                )}
              </Text>
            )}
          </span>
          <MenuTarjeta vacante={vacante} proceso={proceso} candidatura={candidatura} arrastrable={arrastrable} onAbrir={onAbrir} />
        </div>
      </FramePanel>
    </Frame>
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
      aria-label={`${candidatura.candidato.nombre}, ${tituloEtapa(candidatura.etapa)}${candidatura.criterios.length ? `, cumple ${cumplidosDe(candidatura.criterios)} de ${candidatura.criterios.length} requisitos` : ''}${espera && candidato.accion ? `, espera: ${candidato.accion}` : ''}. Enter abre su ficha; barra espaciadora para moverla.`}
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
function MenuTarjeta({
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
