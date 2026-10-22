import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Briefcase06Icon, Delete02Icon, MoreHorizontalIcon, UserGroupIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Heading,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify, notifyAction } from '@/shared/components/notify'
import { AgentMessage } from '@/modules/admin/suite-ai/chat/components/agent-message'
import type { ReplySource } from '@/modules/admin/suite-ai/shared/reply-details'
import { useMensajeAgente } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { estadoDelHilo } from '@/modules/design-system/agente-contextual/components/use-agent-thread'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'
import { plural } from '@/modules/design-system/patrones/formato'
import { CANDIDATURAS, ESPERA_RESPUESTA, VACANTES_UI, tituloEtapa, type VacanteUI } from '../propuestas/datos'
import { SENSIBLE } from '../propuestas/components/agente-seleccion'
import { Revelar } from '../propuestas/components/animacion'
import { CifrasContratacion, Embudo } from './bloques'
import { DIAS_EN_RIESGO, SIN_FILTROS, filtrarVacantes, leer, periodoDe, resumir, type Periodo, type Resumen } from './datos'
import { CalidadVacantes, Destacados, EsperaEtapas, activasDe, calidadPorVacante, destacados, dias, esperaPorEtapa } from './hallazgos'
import {
  BLOQUES,
  PIDE_AJUSTE,
  PREGUNTA_CANAL,
  SIN_CANAL,
  SUGERENCIAS,
  ajustarTablero,
  armarTablero,
  bloquesDe,
  normal,
  periodoDel,
  registroDeTableros,
  tituloDe,
  useTableros,
  vacanteDel,
  type BloqueId,
  type Tablero,
} from './insights'
import { Llegadas } from './llegadas'
import { TablaDashboard } from './tabla'

// Las respuestas de Orbit en «Orbit Data» (16 oct, VP de producto: «que sea muy conversacional… la UI generativa,
// que genera sus propios dashboards»). Cada respuesta es una frase hecha con los datos de Selección y, debajo, lo que Orbit
// arma para mostrarlo: un bloque (las cifras, el embudo, una lista de personas) o un tablero entero que se ajusta
// conversando y se guarda en «Tus tableros». Todo sale de las mismas vacantes que Vacantes y Mis candidatos, para que las
// cifras cuadren entre pantallas. Maqueta: el pedido se lee con palabras clave; en el producto lo entiende el modelo.

const VACANTES = '/admin/seleccion/exploraciones/uno'

// Lo que la página le presta a las respuestas: seguir preguntando desde una sugerencia, volver a pedir una respuesta
// («Regenerar»: la misma pregunta, con los datos de ahora) y el «Detener» del botón de enviar: la respuesta avisa mientras
// se escribe (`avisarEscritura`) y se corta cuando cambia `senalDetener`.
type ConConversacion = {
  preguntar: (texto: string) => void
  rehacer: (pedidoId: number, pedido: string) => void
  senalDetener: number
  avisarEscritura: (id: number, escribiendo: boolean) => void
}
export const Conversacion = createContext<ConConversacion>({
  preguntar: () => {},
  rehacer: () => {},
  senalDetener: 0,
  avisarEscritura: () => {},
})

/* Lo que la conversación recuerda: el último tablero (para ajustarlo) y el último tema (para «arma un tablero con esto»).
   Se guarda con la conversación (su clave), así que dura lo mismo que ella mientras dure la visita. */

export const CLAVE = 'seleccion:orbit-data'

type Tema = { bloques: BloqueId[]; periodo: Periodo; vacante?: string }

const recordado = {
  tablero: () => estadoDelHilo.leer<Tablero | null>(CLAVE, 'ultimo-tablero') ?? null,
  tema: () => estadoDelHilo.leer<Tema | null>(CLAVE, 'ultimo-tema') ?? null,
}
const recordarTablero = (tablero: Tablero | null) => estadoDelHilo.guardar(CLAVE, 'ultimo-tablero', tablero)
const recordarTema = (tema: Tema | null) => estadoDelHilo.guardar(CLAVE, 'ultimo-tema', tema)

export function olvidar() {
  recordarTablero(null)
  recordarTema(null)
}

/* Piezas de la respuesta ------------------------------------------------------------------------------------------ */

// Las respuestas que ya se escribieron en pantalla: al volver a la página no se escriben otra vez. Las que se detuvieron
// siguen sin lo que Orbit iba a armar.
const escritas = new Set<number>()
const detenidas = new Set<number>()

const bajar = () => document.getElementById('fin-de-la-conversacion')?.scrollIntoView({ block: 'end' })

const capital = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)
const cifra = (n: number) => n.toLocaleString('es-CO')

function fuentesDe(resumen: Resumen, vacante?: VacanteUI): ReplySource[] {
  return [
    {
      label: 'Tus vacantes',
      detail: vacante ? vacante.titulo : `${resumen.filas.length} ${plural(resumen.filas.length, 'vacante', 'vacantes')} · al día de hoy`,
      icon: Briefcase06Icon,
    },
    { label: 'Tus candidatos', detail: `${cifra(resumen.candidatos)} en los últimos ${resumen.dias} días`, icon: UserGroupIcon },
  ]
}

// La respuesta: la frase se escribe palabra por palabra y, cuando termina, aparece lo que Orbit armó.
function Respuesta({ texto, fuentes = [], seguir = [], children }: { texto: string; fuentes?: ReplySource[]; seguir?: string[]; children?: ReactNode }) {
  const mensaje = useMensajeAgente()
  const { preguntar, rehacer, senalDetener, avisarEscritura } = useContext(Conversacion)
  const id = mensaje?.id ?? 0
  const pedidoId = mensaje?.pedidoId
  const pedido = mensaje?.pedido
  const [nueva] = useState(() => !escritas.has(id))
  // Si se detuvo mientras se escribía, lo que Orbit iba a armar no aparece: se pidió parar.
  const [senalAlEmpezar] = useState(senalDetener)
  const [detenida, setDetenida] = useState(() => detenidas.has(id))
  // Mientras se escribe, el botón de enviar es «Detener».
  useEffect(() => {
    if (!nueva) return
    avisarEscritura(id, true)
    return () => avisarEscritura(id, false)
  }, [id, nueva, avisarEscritura])
  return (
    <AgentMessage
      text={texto}
      stream={nueva}
      latest={mensaje?.ultimo ?? false}
      details={{ sources: fuentes, followups: seguir, alternates: [] }}
      onFollowup={preguntar}
      onProgress={bajar}
      onStreamEnd={() => {
        escritas.add(id)
        avisarEscritura(id, false)
        if (senalDetener !== senalAlEmpezar) {
          detenidas.add(id)
          setDetenida(true)
        }
      }}
      stopSignal={senalDetener}
      wide={Boolean(children)}
      onRegenerate={pedidoId !== undefined && pedido ? () => rehacer(pedidoId, pedido) : undefined}
    >
      {children && !detenida ? <Generado nuevo={nueva}>{children}</Generado> : null}
    </AgentMessage>
  )
}

// Lo que Orbit armó: entra subiendo y, si recién llega, la página baja hasta su comienzo para que se vea entero.
// Lo que Orbit armó mide lo mismo que la caja de escribir (16 oct, Nicolás: «¿por qué no tiene el mismo ancho del chat?»):
// la frase se queda con el margen del orbe, como en Orbit, y los bloques llegan a los bordes de la columna del chat (el
// bloque marcado con `data-ancho-chat`). Se mide en vez de calcularse, y se vuelve a medir si cambia el ancho de la
// ventana. `@container`: los bloques se acomodan a ese ancho y no al de la ventana.
function Generado({ nuevo, children }: { nuevo: boolean; children: ReactNode }) {
  const caja = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (nuevo) caja.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [nuevo])
  useLayoutEffect(() => {
    const elemento = caja.current
    const columna = elemento?.closest<HTMLElement>('[data-ancho-chat]')
    const padre = elemento?.parentElement
    if (!elemento || !columna || !padre) return
    const medir = () => {
      const borde = columna.getBoundingClientRect()
      elemento.style.marginLeft = `${borde.left - padre.getBoundingClientRect().left}px`
      elemento.style.width = `${borde.width}px`
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(columna)
    return () => observador.disconnect()
  }, [])
  return (
    <div ref={caja} className="@container mt-4 flex scroll-mt-6 flex-col gap-4">
      {children}
    </div>
  )
}

function Bloque({ bloque, resumen, periodo }: { bloque: BloqueId; resumen: Resumen; periodo: Periodo }) {
  const mensaje = useMensajeAgente()
  switch (bloque) {
    case 'cifras':
      return <CifrasContratacion resumen={resumen} periodo={periodo} cargando={false} />
    case 'embudo':
      return <Embudo resumen={resumen} cargando={false} />
    case 'aplican':
      return <Llegadas resumen={resumen} cargando={false} />
    case 'vacantes':
      return <TablaDashboard resumen={resumen} cargando={false} id={`vacantes-mas-candidatos-${mensaje?.id ?? 0}`} enElChat />
    case 'destacados':
      return <Destacados resumen={resumen} />
    case 'espera':
      return <EsperaEtapas resumen={resumen} />
    case 'calidad':
      return <CalidadVacantes resumen={resumen} />
  }
}

const resumenDe = (periodo: Periodo, vacante?: string) => resumir(filtrarVacantes({ ...SIN_FILTROS, vacante: vacante ?? 'todas' }), periodo)

/* El tablero que arma Orbit --------------------------------------------------------------------------------------- */

function TableroGenerado({ tablero }: { tablero: Tablero }) {
  const guardados = useTableros()
  const suyo = guardados.find((uno) => uno.id === tablero.id)
  // Guardado tal cual (la misma versión) o guardado antes de este ajuste.
  const guardado = suyo?.version === tablero.version
  const [quitando, setQuitando] = useState(false)
  const resumen = resumenDe(tablero.periodo, tablero.vacante)
  const vacante = VACANTES_UI.find((una) => una.id === tablero.vacante)

  const guardar = () => {
    const deshacer = registroDeTableros.guardar(tablero)
    notifyAction(
      suyo ? 'Tablero actualizado' : 'Tablero guardado',
      'Está en Tus tableros y se actualiza todos los días a las 7:00 a. m.',
      { label: 'Deshacer', onClick: suyo ? () => registroDeTableros.guardar(suyo) : deshacer },
      'success',
    )
  }

  return (
    <section aria-label={tablero.titulo} className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <EtiquetaIA className="w-fit">{tablero.version > 1 ? `Tablero de Orbit · versión ${tablero.version}` : 'Tablero de Orbit'}</EtiquetaIA>
          <Heading level={5}>{tablero.titulo}</Heading>
          <Text as="p" variant="muted" size="sm">
            {periodoDe(tablero.periodo).texto} · {vacante ? vacante.titulo : 'todas tus vacantes'}
            {guardado ? ' · se actualiza todos los días a las 7:00 a. m.' : ''}
          </Text>
        </div>
        {/* «⋯» primero; después guardar, o la marca de que ya está guardado. */}
        <div className="flex shrink-0 items-center gap-2">
          {suyo ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<BotonIcono aria-label={`Más acciones de ${tablero.titulo}`} />}>
                <HugeiconsIcon icon={MoreHorizontalIcon} size={16} aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem variant="destructive" onClick={() => setQuitando(true)}>
                    <HugeiconsIcon icon={Delete02Icon} size={16} aria-hidden="true" />
                    Quitar de Tus tableros
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {guardado ? (
            <Badge variant="success-light">Guardado en Tus tableros</Badge>
          ) : (
            <Button variant="outline" size="sm" onClick={guardar}>
              {/* Una versión anterior a la guardada la vuelve a dejar; una posterior guarda lo que cambió. */}
              {!suyo ? 'Guardar en Tus tableros' : suyo.version > tablero.version ? 'Guardar esta versión' : 'Guardar los cambios'}
            </Button>
          )}
        </div>
      </div>

      {tablero.bloques.map((bloque, orden) => (
        <Revelar key={bloque} orden={orden}>
          <Bloque bloque={bloque} resumen={resumen} periodo={tablero.periodo} />
        </Revelar>
      ))}

      {suyo ? (
        <DialogoConfirmar
          abierto={quitando}
          onAbiertoChange={setQuitando}
          icono={Delete02Icon}
          titulo="¿Quitar de Tus tableros?"
          descripcion="Deja de actualizarse y sale de la lista. Lo que conversaste con Orbit se queda como está."
          accion="Quitar"
          destructiva
          onConfirmar={() => {
            setQuitando(false)
            const deshacer = registroDeTableros.quitar(suyo.id)
            notifyAction('Tablero quitado', 'Ya no está en Tus tableros.', { label: 'Deshacer', onClick: deshacer }, 'success')
          }}
        >
          <RegistroConfirmar nombre={suyo.titulo} detalle={`Guardado ${suyo.guardado === 'hoy' ? 'hoy' : `el ${suyo.guardado}`}`} tono="neutro" />
        </DialogoConfirmar>
      ) : null}
    </section>
  )
}

// Para seguir: un bloque que todavía no tiene, otro periodo y guardarlo.
function seguirTablero(tablero: Tablero) {
  const falta = (['destacados', 'embudo', 'espera', 'aplican', 'cifras'] as BloqueId[]).find((id) => !tablero.bloques.includes(id))
  const guardado = registroDeTableros.leer().find((uno) => uno.id === tablero.id)?.version === tablero.version
  return [
    falta ? `Agrégale ${BLOQUES[falta].corto}` : null,
    tablero.periodo === '30' ? 'Que cuente los últimos 90 días' : 'Solo los últimos 30 días',
    guardado ? null : 'Guárdalo',
  ].filter((uno): uno is string => Boolean(uno))
}

function RespuestaTablero({ tablero, texto }: { tablero: Tablero; texto: string }) {
  const resumen = resumenDe(tablero.periodo, tablero.vacante)
  const vacante = VACANTES_UI.find((una) => una.id === tablero.vacante)
  return (
    <Respuesta texto={texto} fuentes={fuentesDe(resumen, vacante)} seguir={seguirTablero(tablero)}>
      <TableroGenerado tablero={tablero} />
    </Respuesta>
  )
}

/* Listas: quién espera y qué vacantes se quedaron quietas --------------------------------------------------------- */

function Lista({ titulo, descripcion, filas }: { titulo: string; descripcion: string; filas: { id: string; titulo: string; detalle: string; ruta: string; insignia?: string }[] }) {
  return (
    <Frame spacing="sm">
      <FrameHeader>
        <FrameTitle>{titulo}</FrameTitle>
        <FrameDescription>{descripcion}</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <ItemGroup>
          {filas.map((fila) => (
            <Item key={fila.id} size="sm" render={<Link to={fila.ruta} />} className="hover:bg-accent/50">
              <ItemContent className="min-w-0">
                <ItemTitle>{fila.titulo}</ItemTitle>
                <ItemDescription className="truncate">{fila.detalle}</ItemDescription>
              </ItemContent>
              <ItemActions>
                {fila.insignia ? <Badge variant="warning-light">{fila.insignia}</Badge> : null}
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground" aria-hidden="true" />
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </FramePanel>
    </Frame>
  )
}

/* Las frases: cada una dice lo que muestran los datos ------------------------------------------------------------- */

function fraseDe(bloque: BloqueId, resumen: Resumen, vacante?: VacanteUI): string {
  const cuando = `en los últimos ${resumen.dias} días`
  const enDonde = vacante ? ` en ${vacante.titulo}` : ''
  switch (bloque) {
    case 'cifras': {
      const contrato = resumen.contratados
        ? `${capital(cuando)}${enDonde} contrataste a ${resumen.contratados} ${plural(resumen.contratados, 'persona', 'personas')}${
            resumen.diasContratar !== null ? ` y tardaste ${resumen.diasContratar} días en promedio desde que publicaste` : ''
          }.`
        : `${capital(cuando)}${enDonde} no cerraste ninguna contratación.`
      return `${contrato} Hoy tienes ${resumen.publicadas.length} ${plural(resumen.publicadas.length, 'vacante publicada', 'vacantes publicadas')} y en el periodo llegaron ${cifra(resumen.candidatos)} candidatos.`
    }
    case 'embudo': {
      const lectura = leer(resumen).find((una) => una.id === 'embudo')
      return lectura ? `${lectura.titulo}. ${lectura.detalle}` : `${capital(cuando)}${enDonde} todavía no hay gente suficiente para ver en qué etapa se quedan.`
    }
    case 'aplican': {
      if (!resumen.candidatos) return `${capital(cuando)} no aplicó nadie${enDonde}.`
      const pico = [...resumen.serie].sort((a, b) => b.aplicaron - a.aplicaron)[0]
      const momento = pico === resumen.serie.at(-1) ? (resumen.porSemana ? 'esta semana' : 'hoy') : resumen.porSemana ? `la semana que terminó el ${pico.tramo}` : `el ${pico.tramo}`
      return `${capital(cuando)} aplicaron ${cifra(resumen.candidatos)} personas${enDonde}. Donde más llegaron fue ${momento}: ${pico.aplicaron}.`
    }
    case 'vacantes': {
      const [primera, segunda, tercera] = resumen.conGente
      if (!primera) return `${capital(cuando)} no le llegó gente a ninguna vacante.`
      if (vacante || !segunda) return `${primera.vacante.titulo} recibió ${cifra(primera.candidatos)} candidatos ${cuando}.`
      return `La que más gente recibió ${cuando} es ${primera.vacante.titulo}, con ${cifra(primera.candidatos)}; le siguen ${segunda.vacante.titulo} (${cifra(segunda.candidatos)})${
        tercera ? ` y ${tercera.vacante.titulo} (${cifra(tercera.candidatos)})` : ''
      }.`
    }
    case 'destacados': {
      const gente = destacados(activasDe(resumen))
      const primera = gente[0]
      if (!primera) return 'Ahora no veo a nadie que cumpla casi todo y siga al principio del proceso: los que más cumplen ya avanzaron.'
      return `Encontré ${gente.length === 1 ? 'una persona que cumple' : `${gente.length} personas que cumplen`} casi todo lo que pide su vacante y siguen al principio del proceso. ${primera.c.candidato.nombre} cumple ${primera.cumple} de ${primera.c.criterios.length} y lleva ${dias(primera.c.dias)} en ${tituloEtapa(primera.c.etapa)}.`
    }
    case 'espera': {
      const etapas = esperaPorEtapa(activasDe(resumen))
      const [lenta] = etapas
      const rapida = etapas.at(-1)
      if (!lenta || !rapida || lenta === rapida) return 'Todavía no hay gente suficiente en las etapas para comparar cuánto espera en cada una.'
      return `La etapa más lenta es ${lenta.titulo}: la gente lleva ${dias(lenta.promedio)} en promedio. En ${rapida.titulo} lleva ${dias(rapida.promedio)}.`
    }
    case 'calidad': {
      const calidad = calidadPorVacante(activasDe(resumen))
      const mejor = calidad[0]
      const peor = calidad.at(-1)
      if (!mejor || !peor || mejor === peor) return 'Todavía no hay gente suficiente por vacante para comparar quién atrae mejor.'
      return `En ${mejor.vacante.titulo} el ${mejor.parte} % de los que llegan cumple todo lo que pide; en ${peor.vacante.titulo}, solo el ${peor.parte} %. Revisar cómo está escrita trae gente más afín.`
    }
  }
}

const PREGUNTAS_DE: Record<BloqueId, string> = {
  cifras: '¿Cómo va la contratación?',
  embudo: '¿Dónde se quedan los candidatos?',
  aplican: '¿Cuántos aplicaron esta semana?',
  vacantes: '¿Qué vacantes tienen más candidatos?',
  destacados: '¿A quién debería mirar primero?',
  espera: '¿Dónde espera más la gente?',
  calidad: '¿Qué vacantes atraen a la gente indicada?',
}

/* Responder ------------------------------------------------------------------------------------------------------- */

const PIDE_TABLERO = /tablero|dashboard|reporte|informe|\barma|\bgenera|\bcrea|hazme|construye/
const CON_ESTO = /con esto|con eso|hazlo tablero|como tablero/
const GUARDAR = /^(y )?(guarda|guardalo|guardar|salvalo)/
const ESPERAN = /espera(n)? (una )?respuesta|quien(es)? espera|sin respuesta|sin responder|pendientes? de respuesta/
const QUIETAS = /atascad|estancad|quietas?|no recibe|sin aplicaciones|nadie aplica|no les llega|abiertas hace/
const SALUDO = /^(hola|buen(os|as)|que puedes|que sabes|ayuda|como funciona)/

export function responder(pedido: string): ReactNode {
  const texto = normal(pedido)
  const ultimoTablero = recordado.tablero()
  const ultimoTema = recordado.tema()

  if (SENSIBLE.test(texto))
    return <Respuesta texto="Eso no te lo respondo: la edad, los hijos, el estado civil o el origen no pueden pesar en una contratación." seguir={SUGERENCIAS.slice(0, 2)} />

  if (SALUDO.test(texto))
    return (
      <Respuesta
        texto="Te respondo con los datos de Selección: tus vacantes, tus candidatos y cómo avanzan. Pregúntame lo que quieras o pídeme un tablero, y lo ajustamos conversando."
        seguir={SUGERENCIAS}
      />
    )

  // Sin vacantes (?simular=vacio) no hay nada que contar.
  if (!filtrarVacantes(SIN_FILTROS).length)
    return <Respuesta texto="Todavía no tienes vacantes. Cuando publiques la primera, te cuento cuánta gente llega y cómo avanza." />

  // Guardar el último tablero.
  if (GUARDAR.test(texto)) {
    if (!ultimoTablero) return <Respuesta texto="Todavía no te he armado ningún tablero en esta conversación. Pídeme uno y lo guardamos." seguir={[SUGERENCIAS[1]]} />
    const tablero = ultimoTablero
    const antes = registroDeTableros.leer().find((uno) => uno.id === tablero.id)
    if (antes?.version === tablero.version)
      return <Respuesta texto={`«${tablero.titulo}» ya está en Tus tableros, tal como lo ves.`} seguir={['¿A quién debería mirar primero?', 'Arma otro tablero']} />
    registroDeTableros.guardar(tablero)
    notify(antes ? 'Tablero actualizado' : 'Tablero guardado', 'Está en Tus tableros y se actualiza todos los días a las 7:00 a. m.', 'success')
    return <Respuesta texto={`Listo, guardé «${tablero.titulo}» en Tus tableros. Se actualiza solo todos los días a las 7:00 a. m.`} seguir={['¿A quién debería mirar primero?', 'Arma otro tablero']} />
  }

  // Ajustar el último tablero: «agrégale el embudo», «quita las cifras», «solo los últimos 30 días».
  if (ultimoTablero && !PIDE_TABLERO.test(texto) && (PIDE_AJUSTE.test(texto) || (periodoDel(pedido) && !bloquesDe(pedido).length))) {
    const { tablero, cambios } = ajustarTablero(ultimoTablero, pedido)
    if (!cambios.length)
      return (
        <Respuesta
          texto="No entendí qué cambiarle al tablero. Pídeme que le agregue o le quite un bloque (el embudo, cuántos aplican, a quién mirar), que cambie el periodo o que lo deje solo de una vacante."
          seguir={seguirTablero(ultimoTablero)}
        />
      )
    recordarTablero(tablero)
    return <RespuestaTablero tablero={tablero} texto={`Listo: ${cambios.join(' y ')}. Esta es la versión ${tablero.version}.`} />
  }

  // Un tablero nuevo, también «con esto» (el tema de la respuesta anterior).
  if (PIDE_TABLERO.test(texto)) {
    const conEsto = CON_ESTO.test(texto) && ultimoTema
    const { tablero, aclaracion } = armarTablero(pedido)
    const final: Tablero = conEsto && ultimoTema ? { ...tablero, ...ultimoTema, titulo: tituloDe(ultimoTema.bloques, ultimoTema.vacante) } : tablero
    recordarTablero(final)
    const vacante = VACANTES_UI.find((una) => una.id === final.vacante)
    const que = final.bloques.map((id) => BLOQUES[id].corto)
    const lista = que.length > 1 ? `${que.slice(0, -1).join(', ')} y ${que.at(-1)}` : que[0]
    return (
      <RespuestaTablero
        tablero={final}
        texto={`${aclaracion ? `${aclaracion} ` : ''}Te armé un tablero con ${lista}, de los ${periodoDe(final.periodo).texto.toLowerCase()}${
          vacante ? ` en ${vacante.titulo}` : ''
        }. Dime qué le agrego o le quito, o guárdalo para tenerlo siempre a mano.`}
      />
    )
  }

  if (PREGUNTA_CANAL.test(texto)) {
    const resumen = resumenDe(periodoDel(pedido) ?? '90')
    recordarTema({ bloques: ['aplican'], periodo: periodoDel(pedido) ?? '90' })
    return (
      <Respuesta texto={`${SIN_CANAL} ${fraseDe('aplican', resumen)}`} fuentes={fuentesDe(resumen)} seguir={['Arma un tablero con esto', PREGUNTAS_DE.embudo]}>
        <Bloque bloque="aplican" resumen={resumen} periodo={periodoDel(pedido) ?? '90'} />
      </Respuesta>
    )
  }

  // Quién espera una respuesta del equipo.
  if (ESPERAN.test(texto)) {
    const resumen = resumenDe('90', vacanteDel(pedido)?.id)
    const enEstas = new Set(resumen.filas.map((fila) => fila.vacante.id))
    const esperan = CANDIDATURAS.filter((c) => enEstas.has(c.vacante.id) && ESPERA_RESPUESTA(c)).sort((a, b) => b.dias - a.dias)
    const primera = esperan[0]
    if (!primera) return <Respuesta texto="Nadie espera una respuesta del equipo: todos tienen su siguiente paso." fuentes={fuentesDe(resumen)} seguir={[PREGUNTAS_DE.destacados]} />
    return (
      <Respuesta
        texto={`${esperan.length === 1 ? 'Una persona espera' : `${esperan.length} personas esperan`} una respuesta del equipo. Quien más lleva es ${primera.candidato.nombre}: ${dias(primera.dias)} en ${tituloEtapa(primera.etapa)} de ${primera.vacante.titulo}. Quien espera mucho acepta otra oferta.`}
        fuentes={fuentesDe(resumen)}
        seguir={[PREGUNTAS_DE.espera, PREGUNTAS_DE.destacados]}
      >
        <Lista
          titulo="Quién espera una respuesta"
          descripcion={`${esperan.length > 6 ? 'Las 6 que más llevan' : 'De quien más lleva a quien menos'}. Al abrir una, ves su ficha en la vacante.`}
          filas={esperan.slice(0, 6).map((c) => ({
            id: c.id,
            titulo: c.candidato.nombre,
            detalle: `${tituloEtapa(c.etapa)} · ${c.vacante.titulo}`,
            ruta: `${VACANTES}/${c.vacante.id}?persona=${c.id}`,
            insignia: `${dias(c.dias)} esperando`,
          }))}
        />
      </Respuesta>
    )
  }

  // Las vacantes que llevan mucho abiertas y reciben poco.
  if (QUIETAS.test(texto)) {
    const resumen = resumenDe('90')
    const quietas = resumen.publicadas
      .filter((vacante) => vacante.diasAbierta >= DIAS_EN_RIESGO)
      .sort((a, b) => b.diasAbierta - a.diasAbierta || a.ultimaSemana - b.ultimaSemana)
    const primera = quietas[0]
    if (!primera) return <Respuesta texto={`Ninguna vacante publicada lleva más de ${DIAS_EN_RIESGO} días abierta.`} fuentes={fuentesDe(resumen)} seguir={[PREGUNTAS_DE.vacantes]} />
    const lectura = leer(resumen).find((una) => una.id === 'vacante')
    return (
      <Respuesta
        texto={`${quietas.length === 1 ? 'Una vacante lleva' : `${quietas.length} vacantes llevan`} más de ${DIAS_EN_RIESGO} días abiertas. ${lectura ? `${lectura.titulo}. ${lectura.detalle}` : ''}`}
        fuentes={fuentesDe(resumen)}
        seguir={[PREGUNTAS_DE.calidad, PREGUNTAS_DE.aplican]}
      >
        <Lista
          titulo={`Abiertas hace más de ${DIAS_EN_RIESGO} días`}
          descripcion="De la que más lleva a la que menos, con lo que le llegó esta semana."
          filas={quietas.slice(0, 6).map((vacante) => ({
            id: vacante.id,
            titulo: vacante.titulo,
            detalle: `${vacante.diasAbierta} días abierta · ${vacante.ultimaSemana === 0 ? 'nadie esta semana' : `${vacante.ultimaSemana} ${plural(vacante.ultimaSemana, 'persona', 'personas')} esta semana`}`,
            ruta: `${VACANTES}/${vacante.id}`,
          }))}
        />
      </Respuesta>
    )
  }

  // Una pregunta sobre un tema: la frase y el bloque que la muestra. Si solo cambia el periodo o la vacante («¿y este
  // mes?»), es el mismo tema de antes.
  const nombrado = bloquesDe(pedido)[0]
  const retoma = !nombrado && ultimoTema && (periodoDel(pedido) || vacanteDel(pedido)) ? ultimoTema : null
  const bloque = nombrado ?? retoma?.bloques[0]
  if (bloque) {
    const periodo = periodoDel(pedido) ?? retoma?.periodo ?? '90'
    const vacante = vacanteDel(pedido) ?? VACANTES_UI.find((una) => una.id === retoma?.vacante)
    const resumen = resumenDe(periodo, vacante?.id)
    recordarTema({ bloques: [bloque], periodo, vacante: vacante?.id })
    const otras = (Object.keys(PREGUNTAS_DE) as BloqueId[]).filter((id) => id !== bloque).slice(0, 2).map((id) => PREGUNTAS_DE[id])
    return (
      <Respuesta texto={fraseDe(bloque, resumen, vacante)} fuentes={fuentesDe(resumen, vacante)} seguir={['Arma un tablero con esto', ...otras]}>
        <Bloque bloque={bloque} resumen={resumen} periodo={periodo} />
      </Respuesta>
    )
  }

  return (
    <Respuesta
      texto="No tengo cómo responder eso con los datos de Selección. Puedo decirte cómo va la contratación, cuánta gente aplica, dónde se quedan los candidatos, a quién mirar primero, o armarte un tablero con lo que necesites."
      seguir={SUGERENCIAS}
    />
  )
}

// Abrir uno de Tus tableros: Orbit lo trae a la conversación con los datos de hoy, listo para ajustarlo.
export function abrirTablero(tablero: Tablero): ReactNode {
  recordarTablero(tablero)
  return <RespuestaTablero tablero={tablero} texto={`Aquí está «${tablero.titulo}», con los datos de hoy. Pídeme lo que le quieras cambiar.`} />
}
