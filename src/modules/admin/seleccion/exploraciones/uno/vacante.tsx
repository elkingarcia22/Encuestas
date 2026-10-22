import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Cancel01Icon,
  FullScreenIcon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  ArrowUp01Icon,
  Briefcase06Icon,
  FileImportIcon,
  KanbanIcon,
  ListViewIcon,
  ViewIcon,
  PencilEdit02Icon,
  PlusSignIcon,
  UserAdd01Icon,
  UserRemove01Icon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Button,
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
  Heading,
  Separator,
  Skeleton,
  Text,
  ToggleGroup,
  ToggleGroupItem,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { notify } from '@/shared/components/notify'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { useVentanasEnPanel } from '@/modules/design-system/drawers/components/drawer-anidado'
import { pesos } from '../../vacantes/detalle/components/data'
import { PageContent, PageHeader, PageSection, PageShell } from '@/shared/components/PageShell'
import { setRightPanelOpen } from '@/shared/components/right-panel-store'
import { AgentDock, ReopenAgentButton } from '@/modules/design-system/agente-contextual/components/agent-kit'
import {
  siguienteEtapaDe,
  VACANTES_UI,
  buscarVacanteUI,
  type Candidatura,
  type Rechazada,
  type VacanteUI,
} from '../../propuestas/datos'
import { AccionesVacante, EstadoVacante } from '../../propuestas/components/acciones-vacante'
import { eliminarVacantes } from './inicio/acciones'
import { estadoInicio } from './inicio/estado'
import { QUIEN_MUEVE, cambiosDeEtapa, registroDeMovimientos } from '../../propuestas/movimientos'
import { permisoEn } from '../../propuestas/permisos'
import { AgenteVacante } from '../../propuestas/components/agente-vacante'
import { FichaPersona, pestanaParaEtapa } from '../../propuestas/components/ficha-persona'
import { PestanaCvs, useImportaciones } from '../../propuestas/components/importar-cvs'
import { useProceso, type Cambio } from '../../propuestas/components/use-proceso'
import { AvisoVacanteCerrada, BarraTablero, PieTablero, TableroColumnas, VistasTablero, useTablero, type Tablero } from '../../propuestas/components/tablero-candidatos'
import { ListaCandidatos } from '../../propuestas/components/lista-candidatos'
import { SaldoCreditos } from '../../propuestas/components/saldo-creditos'
import { BarraEnLote } from './acciones-en-lote'
import { CaraCandidato } from '../../propuestas/components/cara-candidato'
import { ubicacionDe } from '../../propuestas/base'
import { quienDe } from '../../propuestas/rechazos'
import { diasDesdeQueAplico } from '../../propuestas/perfil-candidato'
import { CURVA, entrada } from '../../propuestas/components/movimiento'
import { Deslizar, Fundido, POP, RESORTE, Revelar, celda } from '../../propuestas/components/animacion'
import { AvatarEsqueleto, Esqueleto, LineaEsqueleto, useCarga } from '@/modules/design-system/estados/carga'
import { ImagenGlass } from '@/shared/components/ImagenGlass'

// Exploración 1 — dentro de la vacante.
//
// 29 sep, reunión con Elkin: los candidatos se trabajan en el TABLERO KANBAN. La bandeja (lista con la ficha siempre
// abierta al lado y el teclado J/K/A/R) mostraba demasiado a la vez; en el tablero la acción es la que más se hace,
// mover de etapa, y la ficha se abre en un panel solo cuando se necesita («Sí, esa es como la mejor»). El panel abre
// en la pestaña que sirve para la etapa en la que está la persona (lo decide `pestanaParaEtapa`, de la ficha).
//
// Una sola página, como un tablero de control (13 oct, reunión con la PM y el TL: «va a estar afuera la información de la
// vacante, también CVs importados, actividad, y dentro de eso mismo una tabla que no va a estar como dentro de una tab»;
// 14 oct, Nicolás: «una sola página… como si fuera un dashboard completo»). Sin pestañas: primero el tablero, donde se
// pasa el 90 % del tiempo; debajo el proceso (el embudo de sus etapas); después la vacante (condiciones, lo que se pide
// y el puesto) con la actividad al lado, y al final los CVs importados. Arriba quedan las tres acciones que más se usan
// (Compartir, Importar CVs, Orbit Flow); editar está en «⋯» y lleva a la creación por pasos de Elkin, en modo edición.

// Las partes de la página, para llegar a ellas desde un enlace (`?pestana=vacante|cvs|actividad`, como antes eran
// pestañas), desde el agente o desde un lote.
const SECCION = { tablero: 'tablero', vacante: 'la-vacante', actividad: 'actividad', cvs: 'cvs-importados' } as const
const irASeccion = (id: string) => window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)

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
// tablero) y arriba se veía apretada. Queda una sola línea —área y días abierta—; las aplicaciones ya las cuenta el
// tablero y quién la trabaja se ve en las caras de «Compartir». Sin sede ni modalidad (13 oct, PM: «eso no me dice
// absolutamente nada y es ruido»): siguen en «La vacante». Sin pestañas debajo: la página es una sola (14 oct).
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
  // Eliminar la saca de verdad de la lista de la sesión (Vacantes, el Dashboard y Mis candidatos dejan de verla). Es
  // definitivo: sin «Deshacer» (13 oct, PM).
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
          <span>{vacante.estado === 'Borrador' ? 'Sin publicar' : vacante.diasAbierta === 0 ? 'Abierta hoy' : vacante.diasAbierta === 1 ? '1 día abierta' : `${vacante.diasAbierta} días abierta`}</span>
        </>
      }
      actions={
        <>
          {/* Los créditos de Selección, primero de la fila: mover a una etapa con IA los gasta (16 oct). */}
          <SaldoCreditos />
          <AccionesVacante
            vacante={vacante}
            onCambio={onCambio}
            onEliminar={() => {
              eliminarVacantes(VACANTES_UI.filter((una) => una.id === vacante.id))
              navigate(ruta)
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

// La actividad de la vacante (VA-35), como la columna de un tablero de control (14 oct, Nicolás: una sola página con la
// vacante, los CVs importados, la actividad y el tablero). Lo de esta visita va arriba, con la hora; debajo, lo que ya
// había pasado, sacado de dónde está cada persona: cuándo aplicó o entró, a qué etapa llegó y quién la llevó, y quién
// quedó fuera o se retiró. Tocar el nombre abre su ficha. Lo que se deshace sale de aquí: lo deshecho no pasó.
type Suceso = {
  id: string
  persona: Candidatura
  que: string
  quien: string
  cuando: string
  hace: number
  ms: number
  tipo: 'movio' | 'entro' | 'fuera' | 'ia'
  detalle?: string
}

const ICONO_SUCESO: Record<Exclude<Suceso['tipo'], 'ia'>, IconSvgElement> = {
  movio: ArrowRight02Icon,
  entro: UserAdd01Icon,
  fuera: UserRemove01Icon,
}

// Se ven los primeros; el resto, con «Ver toda la actividad».
const VISIBLES_ACTIVIDAD = 8

const haceTexto = (dias: number) => (dias <= 0 ? 'Hoy' : dias === 1 ? 'Ayer' : `Hace ${dias} días`)
const grupoDe = (dias: number) => (dias <= 0 ? 'Hoy' : dias === 1 ? 'Ayer' : dias <= 7 ? 'Esta semana' : 'Antes')
const agrupar = (lista: Suceso[]) =>
  lista.reduce<[string, Suceso[]][]>((grupos, suceso) => {
    const nombre = grupoDe(suceso.hace)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo[0] === nombre) ultimo[1].push(suceso)
    else grupos.push([nombre, [suceso]])
    return grupos
  }, [])
const quienEs = (nombre: string) => (nombre === QUIEN_MUEVE ? 'Tú' : nombre)

function ActividadVacante({
  vacante,
  dentro,
  rechazadas,
  onAbrir,
}: {
  vacante: VacanteUI
  dentro: Candidatura[]
  rechazadas: Rechazada[]
  onAbrir: (candidaturaId: string) => void
}) {
  const registro = useSyncExternalStore(registroDeMovimientos.suscribir, registroDeMovimientos.leer)
  const [todo, setTodo] = useState(false)
  // El comienzo de hoy, para contar en días de calendario lo que tiene fecha (un rechazo de ayer dice «Ayer», como su ficha).
  const [hoy] = useState(() => new Date().setHours(0, 0, 0, 0))
  const sucesos = useMemo(() => {
    const diasDesde = (ms: number) => Math.max(0, Math.round((hoy - new Date(ms).setHours(0, 0, 0, 0)) / 86_400_000))
    const porId = new Map([...dentro, ...rechazadas.map((r) => r.candidatura)].map((c) => [c.id, c]))
    const deLaVisita = registro.filter((movimiento) => porId.has(movimiento.candidaturaId))
    const conVisita = new Set(deLaVisita.map((movimiento) => movimiento.candidaturaId))
    const equipo = vacante.reclutador.nombre || 'El equipo'
    const lista: Suceso[] = deLaVisita.map((movimiento) => {
      const persona = porId.get(movimiento.candidaturaId)!
      const cambio = cambiosDeEtapa(persona, vacante.etapas, [movimiento])[0]
      return {
        id: movimiento.id,
        persona,
        que: cambio.titulo.charAt(0).toLowerCase() + cambio.titulo.slice(1),
        quien: cambio.quien,
        cuando: cambio.cuando,
        hace: 0,
        ms: movimiento.cuando,
        tipo: movimiento.tipo === 'rechazo' || movimiento.tipo === 'retiro' ? 'fuera' : movimiento.tipo === 'entra' ? 'entro' : 'movio',
        detalle: [...cambio.marcas.map((marca) => marca.texto), cambio.comentario ? `«${cambio.comentario}»` : ''].filter(Boolean).join(' · ') || undefined,
      }
    })
    // Lo de antes de la visita: a qué etapa llegó (y quién la llevó) o cómo entró.
    for (const persona of dentro) {
      if (conVisita.has(persona.id)) continue
      const indice = vacante.etapas.findIndex((etapa) => etapa.id === persona.etapa)
      if (indice > 0) {
        const previa = vacante.etapas[indice - 1]
        lista.push({
          id: `${persona.id}-llego`,
          persona,
          que: `pasó a ${vacante.etapas[indice].titulo}`,
          quien: previa.id === 'cv' ? 'La IA' : previa.ia ? `${previa.titulo}, al terminar` : equipo,
          cuando: haceTexto(persona.dias),
          hace: persona.dias,
          ms: 0,
          tipo: previa.id === 'cv' || previa.ia ? 'ia' : 'movio',
        })
        continue
      }
      const hace = diasDesdeQueAplico(persona)
      lista.push({
        id: `${persona.id}-entro`,
        persona,
        que: persona.importada ? `entró con el lote «${persona.importada.lote}»` : persona.postulada ? 'entró desde Mis candidatos' : 'aplicó por el portal de empleo',
        quien: persona.importada ? quienEs(persona.importada.quien) : persona.postulada ? quienEs(persona.postulada.quien) : '',
        cuando: haceTexto(hace),
        hace,
        ms: 0,
        tipo: 'entro',
      })
    }
    // Quien quedó fuera o se retiró antes de la visita.
    for (const rechazada of rechazadas) {
      if (conVisita.has(rechazada.candidatura.id)) continue
      const retiro = quienDe(rechazada) === 'candidato'
      const etapa = vacante.etapas.find((una) => una.id === rechazada.candidatura.etapa)
      // Como su ficha (BloqueRechazo): el de la visita tiene su fecha; el de antes, «ayer» o los días que lleva.
      const hace = rechazada.cuando ? diasDesde(rechazada.cuando) : Math.max(1, rechazada.candidatura.dias)
      lista.push({
        id: `${rechazada.candidatura.id}-fuera`,
        persona: rechazada.candidatura,
        que: `${retiro ? 'se retiró' : 'quedó fuera'} en ${etapa?.titulo ?? 'el proceso'}`,
        quien: retiro ? '' : rechazada.por ? quienEs(rechazada.por) : equipo,
        cuando: haceTexto(hace),
        hace,
        ms: rechazada.cuando ?? 0,
        tipo: 'fuera',
        detalle: `Motivo: ${rechazada.motivo}`,
      })
    }
    return lista.sort((a, b) => a.hace - b.hace || b.ms - a.ms)
  }, [registro, dentro, rechazadas, vacante, hoy])

  // En pantalla ancha el bloque mide lo mismo que la columna de la vacante y la lista se desplaza dentro: antes, más
  // larga, dejaba un hueco blanco debajo de «Sobre el puesto» (15 oct, Nicolás: «ese espacio tan horrible»). En el
  // celular va completa, cortada en las primeras con «Ver toda la actividad».
  const enLista = new Set(sucesos.slice(0, VISIBLES_ACTIVIDAD).map((suceso) => suceso.id))
  return (
    <Frame className="flex flex-col lg:absolute lg:inset-0">
      <CabeceraBloque titulo="Actividad" descripcion="Lo último que pasó, con quién lo hizo." />
      <FramePanel className="flex min-h-0 flex-1 flex-col gap-5 lg:overflow-y-auto">
        {sucesos.length ? (
          <>
            {agrupar(sucesos).map(([grupo, delGrupo]) => (
              <section key={grupo} aria-label={grupo} className={cn('flex flex-col gap-3', !todo && !delGrupo.some((suceso) => enLista.has(suceso.id)) && 'max-lg:hidden')}>
                <Text as="span" variant="muted" size="xs" weight="medium">
                  {grupo}
                </Text>
                <ol className="flex flex-col gap-3.5">
                  {delGrupo.map((suceso, indice) => (
                    // Lo que pasa mientras se mira la vacante (mover, rechazar) entra arriba y lo demás baja con suavidad.
                    <motion.li
                      key={suceso.id}
                      {...entrada(indice)}
                      layout="position"
                      transition={{ ...entrada(indice).transition, layout: RESORTE }}
                      className={cn('flex min-w-0 items-start gap-3', !todo && !enLista.has(suceso.id) && 'max-lg:hidden')}
                    >
                      <IconTile variant="soft" size="sm" className="shrink-0">
                        {suceso.tipo === 'ia' ? <IconoIA /> : <HugeiconsIcon icon={ICONO_SUCESO[suceso.tipo]} aria-hidden="true" />}
                      </IconTile>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <Text as="p" size="sm" className="text-pretty">
                          {/* El nombre abre su ficha: un enlace en la frase, sin alto ni relleno de botón
                              (diferencias.json › button-enlace-en-linea). */}
                          <Button variant="link" size="sm" className="h-auto! p-0! align-baseline text-sm!" onClick={() => onAbrir(suceso.persona.id)}>
                            {suceso.persona.candidato.nombre}
                          </Button>{' '}
                          {suceso.que}
                        </Text>
                        <Text as="p" variant="muted" size="xs" className="text-pretty">
                          {[suceso.cuando, suceso.quien, suceso.detalle].filter(Boolean).join(' · ')}
                        </Text>
                      </div>
                    </motion.li>
                  ))}
                </ol>
              </section>
            ))}
            {sucesos.length > VISIBLES_ACTIVIDAD ? (
              <Button variant="outline" size="sm" className="self-start lg:hidden" aria-expanded={todo} onClick={() => setTodo(!todo)}>
                {todo ? 'Ver menos' : `Ver toda la actividad (${sucesos.length})`}
              </Button>
            ) : null}
          </>
        ) : (
          // Con su ilustración glass, como todo estado vacío (Cristian, 9 oct).
          <PrimeraVez
            className="py-8"
            icono="glass-clock"
            titulo="Todavía no pasa nada aquí"
            descripcion="Cuando alguien aplique, se mueva o quede fuera, queda aquí con quién lo hizo y cuándo."
          />
        )}
      </FramePanel>
    </Frame>
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
// 4. El proceso: las etapas en fila, como un embudo: cuántos llegaron a cada una, qué parte pasa y cuánto llevan ahí.
// Cada bloque trae su acción con nombre, que abre el editor en su paso. La comparten las tres exploraciones: la
// vacante es el mismo objeto en todas. En la 1 editar lleva a la creación por pasos de Elkin (29 sep), por eso cada
// acción dice además qué sección se quiere cambiar: la pantalla decide a qué paso va.

export type SeccionVacante = 'condiciones' | 'puesto' | 'requisitos' | 'etapas'

// Más allá de cinco párrafos o de unas 700 letras, el texto se recorta y se abre con «Ver todo».
const LETRAS_SIN_RECORTE = 700


// «El proceso» (el embudo por etapa) salió de la vacante el 15 oct: Javi, 13 oct, «eso se ve muy confuso… diría que es
// en los AI Insights». Lo que conviene de él (dónde se frena la gente) lo cuenta Orbit Flow.

const DESCRIPCION_REQUISITOS = (
  <span className="flex items-center gap-1.5">
    <IconoIA />
    Con ellos la IA le da un puntaje a cada CV.
  </span>
)

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
    // Se abre creciendo un poco desde el centro, con la curva de todo el movimiento de Selección.
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Tablero de ${vacante.titulo}`}
      data-tablero=""
      className="fixed inset-0 z-40 flex flex-col bg-background"
      initial={{ opacity: 0, scale: 0.975 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.32, ease: CURVA }}
    >
      {/* Sin marco ni caja: la barra del tablero es la franja de arriba (con el nombre y «Cerrar») y las columnas
          ocupan todo lo demás (8 oct, Nicolás: «ya ampliado no debería estar encerrado»). */}
      {children}
    </motion.div>,
    document.body,
  )
}

// El marco del tablero. En la página, con la forma de la tabla del sistema, que es su otra vista (16 oct, cambio
// Lista/Tablero): en lo gris, cuántas personas a la izquierda y la búsqueda a la derecha; el título, las vistas y el
// cambio de vista van arriba del marco, compartidos por las dos.
// A pantalla completa, nada: la barra es la franja de arriba y las columnas van sobre el fondo.
// `flotante`: la barra de acciones en lote. En la página se pega al borde de abajo de la ventana mientras el tablero se
// ve (antes flotaba al pie del tablero y, con las condiciones arriba, quedaba debajo del borde de la pantalla).
function MarcoTablero({
  ampliado,
  conteo,
  avisos,
  barra,
  flotante,
  children,
}: {
  ampliado: boolean
  conteo: string
  avisos: ReactNode
  barra: ReactNode
  flotante: ReactNode
  children: ReactNode
}) {
  if (ampliado)
    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        {avisos}
        {barra}
        <Separator />
        {children}
        <div className="absolute bottom-4 left-1/2 z-20 max-w-[calc(100%-2rem)] -translate-x-1/2">{flotante}</div>
      </div>
    )
  return (
    <Frame>
      <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <FrameDescription role="status" className="tabular-nums">
          {conteo}
        </FrameDescription>
        {barra}
      </FrameHeader>
      <FramePanel className="relative overflow-hidden [--frame-panel-px:0px] [--frame-panel-py:0px]">
        {avisos}
        {children}
      </FramePanel>
      {/* Una línea sin alto, pegada 16 px sobre el borde de la ventana: la barra va encima de ella. Cuando el pie del
          tablero entra a la vista, se queda en el pie. */}
      <div className="pointer-events-none sticky bottom-4 z-20 h-0">
        <div className="pointer-events-auto absolute bottom-3 left-1/2 max-w-[calc(100%-2rem)] -translate-x-1/2">{flotante}</div>
      </div>
    </Frame>
  )
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

export function LaVacante({
  vacante,
  dentro,
  onEditar,
  secciones,
}: {
  vacante: VacanteUI
  dentro: Candidatura[]
  // Abre el editor de la vacante en un paso del editor de siempre (1 el puesto y los requisitos, 2 las etapas) y dice
  // qué sección se quiere cambiar, para la creación por pasos de la 1.
  onEditar?: (paso: number, seccion: SeccionVacante) => void
  // Qué bloques se ponen (en la página van repartidos: las condiciones arriba, a todo el ancho, y el resto abajo). Sin
  // esto, los tres.
  secciones?: SeccionVacante[]
}) {
  const ver = (seccion: SeccionVacante) => !secciones || secciones.includes(seccion)
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
  // Una franja de cuatro cifras, como la de «Tablero con vistas» de Cristian: rótulo, cifra y una línea, sin iconos ni
  // insignias (15 oct, Nicolás: «demasiada información»).
  const condiciones: { etiqueta: string; valor: string; detalle?: string }[] = [
    {
      etiqueta: 'Salario al mes',
      valor: `${pesos(minimo)} a ${pesos(maximo)}`,
      detalle: n ? `${enRango} de ${n} piden dentro del rango` : 'Nadie en proceso todavía',
    },
    { etiqueta: 'Experiencia', valor: vacante.experiencia, detalle: vacante.seniority },
    { etiqueta: 'Contrato', valor: vacante.contrato, detalle: `Modalidad ${vacante.modalidad.toLowerCase()}` },
    {
      etiqueta: 'Idioma',
      valor: vacante.idioma,
      detalle: vacante.idioma === 'No requerido' ? 'No es requisito' : 'Entra en los requisitos',
    },
  ]

  // La pestaña carga al abrirla. Mientras tanto, los cuatro bloques ya tienen su título, sus botones de editar y sus
  // rótulos fijos (qué es cada cosa no depende de los datos); lo que viene de la vacante y de la gente va en gris, en su
  // mismo lugar: las cuatro condiciones, el texto y el equipo del puesto, una fila por requisito y una columna por etapa.
  const cargando = useCarga()
  if (cargando) {
    return (
      <Esqueleto etiqueta="Cargando la vacante" className="@container flex flex-col gap-5">
        {ver('condiciones') ? (
        <Frame>
          <CabeceraBloque
            titulo="Condiciones"
            descripcion="Lo que ofrece y lo que pide de entrada."
            accion={onEditar ? { etiqueta: 'Editar condiciones', icono: PencilEdit02Icon, onClick: () => onEditar(1, 'condiciones') } : undefined}
          />
          <FramePanel className="grid gap-5 @lg:grid-cols-2 @3xl:grid-cols-4 @3xl:gap-0 @3xl:divide-x">
            {condiciones.map((condicion) => (
              <div key={condicion.etiqueta} className="flex min-w-0 flex-col @3xl:px-5 @3xl:first:ps-0 @3xl:last:pe-0">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Text as="span" variant="muted" size="sm">
                    {condicion.etiqueta}
                  </Text>
                  <span className="flex h-7 items-center">
                    <Skeleton className="h-5 w-4/5" />
                  </span>
                  <LineaEsqueleto tamano="chico" ancho="w-3/5" />
                </div>
              </div>
            ))}
          </FramePanel>
        </Frame>
        ) : null}

        {ver('puesto') ? (
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
        ) : null}

        {ver('requisitos') ? (
        <Frame>
          <CabeceraBloque
            titulo={vacante.requisitos.length ? `Lo que se pide · ${vacante.requisitos.length} ${vacante.requisitos.length === 1 ? 'requisito' : 'requisitos'}` : 'Lo que se pide'}
            descripcion={DESCRIPCION_REQUISITOS}
            accion={onEditar ? { etiqueta: 'Editar requisitos', icono: PencilEdit02Icon, onClick: () => onEditar(1, 'requisitos') } : undefined}
          />
          <FramePanel className="flex flex-col divide-y py-0!">
            {vacante.requisitos.map((requisito, indice) => (
              <div key={requisito} className="flex items-center gap-4 py-3.5">
                <Text as="span" variant="muted" size="sm" className="w-4 shrink-0 tabular-nums">
                  {indice + 1}
                </Text>
                <LineaEsqueleto className="h-6" ancho="w-3/5" />
              </div>
            ))}
          </FramePanel>
        </Frame>
        ) : null}
      </Esqueleto>
    )
  }

  return (
    <div className="@container flex flex-col gap-5">
      {/* 1 · Las condiciones, en cifras. */}
      {ver('condiciones') ? (
      <Frame>
        <CabeceraBloque
          titulo="Condiciones"
          descripcion="Lo que ofrece y lo que pide de entrada."
          accion={onEditar ? { etiqueta: 'Editar condiciones', icono: PencilEdit02Icon, onClick: () => onEditar(1, 'condiciones') } : undefined}
        />
        <FramePanel className="grid gap-5 @lg:grid-cols-2 @3xl:grid-cols-4 @3xl:gap-0 @3xl:divide-x">
          {condiciones.map((condicion, indice) => (
            // Entran una tras otra, de izquierda a derecha.
            <motion.div key={condicion.etiqueta} {...celda(indice)} className="flex min-w-0 flex-col @3xl:px-5 @3xl:first:ps-0 @3xl:last:pe-0">
              <div className="flex min-w-0 flex-col gap-0.5">
                <Text as="span" variant="muted" size="sm">
                  {condicion.etiqueta}
                </Text>
                <Text as="span" size="lg" weight="semibold" className="tabular-nums">
                  {condicion.valor}
                </Text>
                {condicion.detalle ? (
                  <Text as="span" variant="muted" size="xs">
                    {condicion.detalle}
                  </Text>
                ) : null}
              </div>
            </motion.div>
          ))}
        </FramePanel>
      </Frame>
      ) : null}

      {/* 2 · El puesto y, debajo, quién lo trabaja. */}
      {ver('puesto') ? (
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
      ) : null}

      {/* 3 · Lo que se pide: la lista, sin contar quién lo cumple (15 oct). La PM, 13 oct: «la rúbrica que vota la
          evaluación de CV no es Camila cumple 5 de los 10 requerimientos»; la IA da un puntaje, que va en cada tarjeta. */}
      {ver('requisitos') ? (
      <Frame>
        <CabeceraBloque
          titulo={vacante.requisitos.length ? `Lo que se pide · ${vacante.requisitos.length} ${vacante.requisitos.length === 1 ? 'requisito' : 'requisitos'}` : 'Lo que se pide'}
          descripcion={DESCRIPCION_REQUISITOS}
          accion={onEditar ? { etiqueta: 'Editar requisitos', icono: PencilEdit02Icon, onClick: () => onEditar(1, 'requisitos') } : undefined}
        />
        <FramePanel className="flex flex-col divide-y py-0!">
          {vacante.requisitos.length ? (
            vacante.requisitos.map((requisito, indice) => (
              <div key={requisito} className="flex items-baseline gap-4 py-3.5">
                <Text as="span" variant="muted" size="sm" className="w-4 shrink-0 tabular-nums">
                  {indice + 1}
                </Text>
                <Text as="span" weight="medium">
                  {requisito}
                </Text>
              </div>
            ))
          ) : (
            // No todas las vacantes los tienen (29 sep, reunión con Elkin: es un caso de uso más, no un error). Con su
            // ilustración glass, como todo estado vacío (Cristian, 9 oct).
            <PrimeraVez
              className="py-8"
              icono="glass-paper-plus"
              titulo="Esta vacante no tiene requisitos"
              descripcion="Sin ellos la IA no tiene con qué darle un puntaje a cada CV."
              accion={onEditar ? { texto: 'Agregar requisitos', icono: PlusSignIcon, onClick: () => onEditar(1, 'requisitos') } : undefined}
            />
          )}
        </FramePanel>
      </Frame>
      ) : null}
    </div>
  )
}

const RUTA = '/admin/seleccion/exploraciones/uno'

// Vacantes donde ya se abrió Orbit Flow en esta visita: su punto de «algo nuevo» no vuelve a salir (OF-47).
const vistosPorAgente = new Set<string>()

// Los filtros puestos, dichos en palabras para el agente: «esperan respuesta · LinkedIn».
const textoDeFiltros = (filtros: Tablero['filtros']) =>
  [
    filtros.vista === 'espera' ? 'esperando acción' : filtros.vista === 'proceso' ? 'en proceso' : null,
    filtros.lote ? `lote ${filtros.lote.nombre}` : null,
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
//   atención»). `?pestana=vacante|cvs|actividad` trae esa parte de la página a la vista.
// - `state.publicada`: se acaba de publicar desde la creación; avisa y abre «Compartir», con el enlace.
type PropsVacante = {
  ruta: string
  seccion?: string
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
                <EmptyMedia variant="default">
                  <ImagenGlass nombre="glass-folder" />
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

function VacanteAbierta({ ruta, seccion, guardada }: PropsVacante & { guardada: VacanteUI }) {
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

  const [abiertaId, setAbiertaId] = useState<string | null>(null)
  const [marcadas, setMarcadas] = useState<string[]>([])
  // Los candidatos en tablero (por etapa) o en lista (la tabla del sistema), como «Tablero con vistas» de Cristian (16 oct).
  const [modo, setModo] = useState<'tablero' | 'lista'>('tablero')
  const cambiarModo = (nuevo: 'tablero' | 'lista') => {
    // Cada vista trae su buscador y su forma de elegir: al cambiar, se empieza sin búsqueda ni elegidas.
    setMarcadas([])
    tablero.cambiar({ busqueda: '' })
    setModo(nuevo)
  }

  // Lo que pide la dirección se atiende en el render (como los lotes de `useImportaciones`) y la dirección se limpia
  // después, para que «atrás» o recargar no vuelvan a abrir lo mismo.
  const [parametros, setParametros] = useSearchParams()
  const personaPedida = parametros.get('persona')
  const pestanaPedida = parametros.get('pestana')
  const [pedidoAtendido, setPedidoAtendido] = useState<string | null>(null)
  const pedido = personaPedida || pestanaPedida ? `${personaPedida ?? ''}|${pestanaPedida ?? ''}` : null
  if (pedido !== pedidoAtendido) {
    setPedidoAtendido(pedido)
    if (personaPedida) setAbiertaId(personaPedida)
  }
  // La parte pedida (`?pestana=vacante|cvs|actividad`, de cuando eran pestañas) se trae a la vista una vez y sale de la
  // dirección. La ficha abierta, en cambio, queda en la dirección (`?persona=`): se puede copiar el enlace para un colega,
  // y recargar o volver la deja abierta (CA-20).
  useEffect(() => {
    if (!pestanaPedida) return
    if (pestanaPedida === 'vacante' || pestanaPedida === 'cvs' || pestanaPedida === 'actividad') irASeccion(SECCION[pestanaPedida])
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
    notify(
      `Publicamos «${vacante.titulo}»`,
      invitaciones
        ? `${invitaciones.personas === 1 ? 'A quien agregaste le llega' : `A las ${invitaciones.personas} que agregaste les llega`} la invitación a «${invitaciones.etapa}».`
        : 'Comparte el enlace para empezar.',
      'success',
    )
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [recienPublicada, invitaciones, vacante.titulo, navigate, location.pathname, location.search])

  // Editar = la creación por pasos de Elkin, abierta en el paso que toca; al guardar vuelve aquí (contrato con la
  // creación: `state.paso` y `state.volverA`).
  const editar = (paso: 1 | 2 | 3 = 1) => navigate(RUTA_EDITAR(vacante.id), { state: { paso, volverA: location.pathname } })
  const editarSeccion = (_: number, seccionVacante: SeccionVacante) => editar(PASO_DE[seccionVacante])

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

  const abrirFicha = (candidaturaId: string) => setAbiertaId(candidaturaId)

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
      irASeccion(SECCION.tablero)
    },
    dondeVerEntraron: 'el tablero',
    onAbrirFicha: abrirFicha,
    onReconsiderar: (candidaturaId) => {
      const rechazada = proceso.rechazadaDe(candidaturaId)
      if (rechazada) proceso.reconsiderar(rechazada)
    },
    onIrALotes: () => irASeccion(SECCION.cvs),
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
  // Hacia dónde se pasó de ficha: con «Siguiente» la nueva entra desde la derecha; con «Anterior», desde la izquierda; al
  // abrir una desde el tablero, sube en su sitio. Se ajusta durante el render, como la vacante mirada.
  const [paseFicha, setPaseFicha] = useState<{ id: string | null; indice: number; direccion: number }>({ id: null, indice: -1, direccion: 0 })
  if (paseFicha.id !== abiertaId) {
    const venia = paseFicha.id !== null && paseFicha.indice >= 0 && indiceAbierta >= 0
    setPaseFicha({ id: abiertaId, indice: indiceAbierta, direccion: venia ? Math.sign(indiceAbierta - paseFicha.indice) : 0 })
  }
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

  // Mover, rechazar o reabrir pedidos desde la ficha se abren dentro de ella, como drawer anidado; desde el tablero o el
  // agente, en la ventana de siempre (8 oct, Nicolás: desde un panel no se abre una ventana encima).
  const ventanasEnFicha = useVentanasEnPanel(proceso.ocupado, abierta !== null)
  // La etapa de la persona abierta, para decir en el panel de qué recorrido es y en qué pestaña abre su ficha.
  const etapaAbierta = abierta ? vacante.etapas.find((etapa) => etapa.id === abierta.etapa) : undefined

  return (
    // Con «reducir movimiento» en el sistema, las animaciones de Selección se quedan quietas.
    <MotionConfig reducedMotion="user">
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

      <PageContent className="min-h-0 gap-6">
        {/* 1 · Lo que ofrece la vacante, en una franja de cuatro cifras: arriba y afuera del tablero, como lo pidió Javi
            (13 oct: «arriba sí dejas la vacante, porque es la información de la vacante»). */}
        <Revelar id={SECCION.vacante} className="scroll-mt-4">
          <LaVacante vacante={vacante} dentro={dentro} onEditar={editarSeccion} secciones={['condiciones']} />
        </Revelar>

        {/* 2 · Los candidatos, en tablero o en lista (16 oct, Nicolás: sí al cambio Lista/Tablero de «Tablero con vistas» de
            Cristian). Arriba, para las dos, el título, las vistas (todos, esperando acción, en proceso) y el cambio, como
            en ese patrón y como pide la tabla del sistema (el título va fuera de su marco). Debajo, el tablero —corta en
            diez por columna y abre el resto ahí mismo— o la tabla. Las dos abren la ficha en el panel lateral. */}
        <Revelar id={SECCION.tablero} orden={1} className="scroll-mt-4">
          <PageSection
            title="Candidatos"
            description="Quién va en cada etapa del proceso."
            actions={
              dentro.length || proceso.rechazadas.length ? (
                <div className="flex flex-wrap items-center gap-3">
                  <VistasTablero proceso={proceso} tablero={tablero} />
                  <ToggleGroup
                    aria-label="Cambio de vista"
                    value={[modo]}
                    onValueChange={(valor) => valor.length && cambiarModo(valor[0] as 'tablero' | 'lista')}
                    variant="outline"
                    size="sm"
                  >
                    <ToggleGroupItem value="lista" aria-label="Lista" className="gap-1.5 px-3">
                      <HugeiconsIcon icon={ListViewIcon} size={16} />
                      Lista
                    </ToggleGroupItem>
                    <ToggleGroupItem value="tablero" aria-label="Tablero" className="gap-1.5 px-3">
                      <HugeiconsIcon icon={KanbanIcon} size={16} />
                      Tablero
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              ) : null
            }
          >
          {/* Cambiar de vista funde una en la otra: la de antes sube y se va, la nueva llega desde abajo. */}
          <Fundido clave={modo === 'lista' && !ampliado ? 'lista' : 'tablero'}>
          {modo === 'lista' && !ampliado ? (
            <div className="flex flex-col gap-3">
              <AvisoVacanteCerrada
                vacante={vacante}
                sinMargen
                onReabrir={proceso.bloqueo?.onReabrir}
                siguen={dentro.filter((c) => c.etapa !== vacante.etapas[vacante.etapas.length - 1]?.id).length}
                onRechazarQuienesSiguen={() => rechazar(dentro.filter((c) => c.etapa !== vacante.etapas[vacante.etapas.length - 1]?.id))}
              />
              {vacante.estado !== 'Cerrada' && proceso.bloqueo ? (
                <Alert>
                  <HugeiconsIcon icon={ViewIcon} size={16} />
                  <AlertTitle>{proceso.bloqueo.titulo}</AlertTitle>
                  <AlertDescription>{proceso.bloqueo.texto}</AlertDescription>
                </Alert>
              ) : null}
              <ListaCandidatos
                vacante={vacante}
                proceso={proceso}
                tablero={tablero}
                abiertaId={abiertaId}
                onAbrir={(candidatura) => setAbiertaId(candidatura.id)}
                onImportar={() => importaciones.abrir()}
              />
            </div>
          ) : (
          <TableroAmpliable vacante={vacante} ampliado={ampliado} onReducir={() => setAmpliado(false)}>
          <MarcoTablero
            ampliado={ampliado}
            conteo={
              tablero.enOrden.length === dentro.length
                ? `${dentro.length} ${dentro.length === 1 ? 'persona' : 'personas'}`
                : `${tablero.enOrden.length} de ${dentro.length} personas`
            }
            avisos={
              <>
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
              </>
            }
            // Actuar sobre varias: sube con resorte al elegir a la primera y baja al soltar a la última.
            flotante={
              <AnimatePresence>
                {marcadas.length ? (
                  <BarraEnLote
                    key="en-lote"
                    vacante={vacante}
                    marcadas={marcadasCompletas}
                    onLimpiar={() => setMarcadas([])}
                    onMover={moverVarias}
                    onElegirEtapa={elegirVarias}
                    onRechazar={rechazar}
                    bloqueo={proceso.bloqueo}
                  />
                ) : null}
              </AnimatePresence>
            }
            barra={
            <BarraTablero
              proceso={proceso}
              tablero={tablero}
              enMarco={!ampliado}
              // En la página las vistas van arriba del marco, con el cambio Lista/Tablero; a pantalla completa, aquí.
              vistas={ampliado}
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
            }
          >
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
                onImportar={() => importaciones.abrir()}
                onEditarEtapas={() => editar(3)}
                tope={{ cuantos: TOPE_TABLERO, etiqueta: (resto) => `Ver ${resto} más` }}
              />
              {/* «Ampliar» flota en la esquina del propio tablero, como el control de pantalla completa de un mapa o de
                  Figma (8 oct, Nicolás: en la barra de filtros no se asociaba al kanban). Con tarjetas marcadas se
                  esconde: abajo va la barra de acciones en lote. */}
              <AnimatePresence>
                {marcadas.length || !dentro.length || ampliado ? null : (
                  <motion.div key="ampliar" {...POP} className="absolute right-5 bottom-5 z-10">
                    <Button variant="outline" size="sm" className="shadow-md" onClick={() => setAmpliado(true)}>
                      <HugeiconsIcon icon={FullScreenIcon} size={16} aria-hidden="true" />
                      Ampliar tablero
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {dentro.length || proceso.rechazadas.length ? <PieTablero vacante={vacante} /> : null}
          </MarcoTablero>
          </TableroAmpliable>
          )}
          </Fundido>
          </PageSection>
        </Revelar>

        {/* 3 · Lo que pide la vacante y el puesto y, al lado, lo que pasó en ella. La actividad se queda a la vista mientras
            se baja. «El proceso» (el embudo) ya no va aquí: Javi, 13 oct, «se ve muy confuso… en los AI Insights». */}
        <Revelar className="grid gap-6 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
            <LaVacante vacante={vacante} dentro={dentro} onEditar={editarSeccion} secciones={['requisitos']} />
            <LaVacante vacante={vacante} dentro={dentro} onEditar={editarSeccion} secciones={['puesto']} />
          </div>
          <div id={SECCION.actividad} className="relative min-w-0 scroll-mt-4 lg:min-h-96">
            <ActividadVacante vacante={vacante} dentro={dentro} rechazadas={proceso.rechazadas} onAbrir={abrirFicha} />
          </div>
        </Revelar>

        {/* 4 · El registro de lo que se cargó: cuándo, qué archivo, cómo quedó y cuántas hojas de vida traía. */}
        <Revelar id={SECCION.cvs} className="scroll-mt-4">
          <PestanaCvs importaciones={importaciones} vacante={vacante} />
        </Revelar>
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
        // Quién es: la cara, el nombre y dónde vive (13 oct, PM: sin «Candidatura» ni la vacante, que ya se sabe).
        media={abierta ? <CaraCandidato nombre={abierta.candidato.nombre} /> : undefined}
        title={abierta?.candidato.nombre ?? ''}
        description={abierta ? ubicacionDe(abierta.candidato.ciudad) : undefined}
        badge={
          rechazadaAbierta ? (
            <Badge variant="destructive-outline">{quienDe(rechazadaAbierta) === 'candidato' ? 'Se retiró' : 'Rechazada'}</Badge>
          ) : undefined
        }
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
            <Deslizar clave={abierta.id} direccion={paseFicha.direccion} className="h-full">
            <FichaPersona
              key={abierta.id}
              candidatura={abierta}
              etapas={vacante.etapas}
              pestanaInicial={etapaAbierta && !rechazadaAbierta ? pestanaParaEtapa(etapaAbierta) : undefined}
              // Su otra candidatura, en la otra vacante, con la ficha abierta (CA-08).
              onIrA={(id) => navigate(`${RUTA}/${id.slice(id.lastIndexOf('@') + 1)}?persona=${encodeURIComponent(id)}`)}
              onElegirEtapa={() => proceso.elegirEtapa([abierta])}
              // Si entró a una etapa con IA sin invitación, se la envía desde su ficha (13 oct, PM).
              onInvitar={permisoEn(vacante).trabaja && !proceso.bloqueo ? () => proceso.pedirInvitacion(abierta) : undefined}
              bloqueo={proceso.bloqueo}
              rechazada={rechazadaAbierta}
              onReconsiderar={rechazadaAbierta ? () => proceso.reconsiderar(rechazadaAbierta) : undefined}
              onEscribirRechazo={rechazadaAbierta ? () => proceso.escribirRechazo(rechazadaAbierta) : undefined}
              onAvanzar={() => {
                const destino = siguienteEtapaDe(vacante.etapas, abierta.etapa)
                if (destino) moverA(abierta, destino)
              }}
              onRechazar={() => rechazar([abierta])}
              // Se cierra la ficha antes: si no, la dirección pediría a alguien que ya no está.
              onQuitar={
                permisoEn(vacante).trabaja && !rechazadaAbierta
                  ? () => {
                      setAbiertaId(null)
                      proceso.quitar(abierta)
                    }
                  : undefined
              }
            />
            </Deslizar>
          </div>
        ) : null}
        {ventanasEnFicha ? proceso.dialogos : null}
      </DrawerShell>

      {importaciones.dialogos}
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
                // Lo que el agente sabe de la pantalla (OF-36 a OF-40): lo marcado, los filtros y el permiso.
                marcadas={marcadasCompletas}
                filtradas={tablero.activos ? { ids: tablero.enOrden.map((c) => c.id), texto: textoDeFiltros(tablero.filtros) } : null}
                puede={{ cambiar: permisoAgente.trabaja, porque: permisoAgente.porque, pedirA: permisoAgente.duena?.nombre ?? 'la dueña del proceso', salarios: permisoAgente.trabaja }}
                lotes={importaciones.lotes}
                onFiltrar={(filtro) => {
                  tablero.cambiar(filtro)
                  irASeccion(SECCION.tablero)
                }}
                onVerEtapa={(etapa) => {
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
    </MotionConfig>
  )
}

export function Component() {
  return <VacanteConTablero ruta={RUTA} />
}

Component.displayName = 'SeleccionExploracionUnoVacantePage'
