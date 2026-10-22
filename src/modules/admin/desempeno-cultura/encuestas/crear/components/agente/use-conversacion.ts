import { useEffect, useRef, useState } from 'react'
import { notify } from '@/shared/components/notify'
import { countDescendants, countQuestions, findSection, patchSection, pathIds, removeSection } from '../../../modelo/sectionTree'
import type { SurveyKind, SurveyQuestion, SurveySection } from '../../../modelo/surveyBuilderTypes'
import { AI_FOCUSES } from '../../../modelo/aiSectionThemes'
import { defaultBrief, generateSections, type AiQuestionStyle, type AiSectionsBrief } from '../../../modelo/aiSectionGenerator'
import {
  FOCUS_CHIPS,
  STYLE_CHIPS,
  completeSizes,
  describeBrief,
  describeUnderstood,
  focusLabel,
  mergeBrief,
  missingSectionsCriteria,
  parseSectionsMessage,
  sizePresets,
  type ChatChip,
  type SectionsCriterionId,
} from '../../../modelo/aiSectionsChat'
import { NOMBRE_ESCALA, NOMBRE_RESPUESTA, conEscala, conRespuesta, leerAjuste, normalizar, pasosDe, preguntaPara, preguntasDe, tipoDelPedido, ultimaHoja, type Ajuste, type PasoCreacion } from './ajustes'

// La conversación del agente que crea la encuesta (Elkin, 14-oct): la persona cuenta con sus palabras qué quiere medir
// —aquí o ya en el agente del inicio de Encuestas—, el agente pregunta solo lo que falte y, mientras cuenta en el chat qué
// hace, la encuesta se va armando a la izquierda sección por sección y pregunta por pregunta. Lo que crea queda en la
// encuesta desde el primer momento (no hay «quedarse con la propuesta»); se ajusta pidiéndolo aquí o a mano, y el agente
// trabaja siempre sobre el árbol como está ahora: lo que la persona cambió a mano no lo vuelve a tocar.

export type Mensaje =
  | { id: number; rol: 'agente'; texto: string; opciones?: readonly ChatChip[]; deshacer?: { texto: string; hacer: () => void } }
  | { id: number; rol: 'persona'; texto: string }

/** Conversando (antes de crear), creando (la encuesta se arma a la vista) y lista (ya hay algo que ajustar). */
export type Fase = 'conversando' | 'creando' | 'lista'

export type Sesion = {
  tipo: SurveyKind | null
  /** Lo que se pidió en el agente del inicio de Encuestas; null si el agente se abrió aquí. */
  pedidoInicial: string | null
  desdeInicio: boolean
  /** El árbol de la encuesta ahora mismo, con lo que la persona haya cambiado a mano. */
  secciones: readonly SurveySection[]
  /** Lo que todavía falta para finalizar fuera de este paso («las fechas», «los participantes»). */
  pendientes: readonly string[]
  /** La encuesta de prueba que falla (fallaEnQA): la creación se cae a mitad y no deja nada (IA-054). */
  falla?: boolean
  onSecciones: (cambio: (actual: SurveySection[]) => SurveySection[]) => void
  onRevelar: (id: string) => void
  /** La sección que se está creando ahora (su etiqueta dice «Creando…»), o null. */
  onCreando: (id: string | null) => void
  /** Va a «Secciones y preguntas» y, si el paso 1 está vacío, le pone nombre y tipo. Devuelve lo que puso. */
  onEmpezar: (tipo: SurveyKind) => { nombre?: string; tipo?: string }
  /** Quita el nombre y el tipo que puso la IA, si nadie los cambió. */
  onDeshacerGenerales: () => void
}

const SALUDO = '¡Hola! Cuéntame qué quieres medir con esta encuesta: los temas que te importan, cuántas secciones quieres y cómo prefieres que respondan. Yo la voy armando y la ves crecer a la izquierda.'
const SALUDO_CON_SECCIONES = '¡Hola! Puedo sumar secciones a esta encuesta o ajustar las que tiene. Pídemelo con tus palabras; lo que cambies a mano lo respeto.'
const CONTINUO = 'Sigo aquí con lo que me pediste en Encuestas. Mientras armo la encuesta, la vas a ver crecer a la izquierda.'

const INICIOS: readonly ChatChip[] = [
  { label: 'Encuesta de clima completa', value: 'Quiero una encuesta de clima con liderazgo, carga de trabajo y bienestar, 3 secciones en escala' },
  { label: 'Medir liderazgo y comunicación', value: 'Quiero medir liderazgo y comunicación, 2 secciones con 4 preguntas en escala' },
  { label: 'Adopción de IA en el equipo', value: 'Quiero medir la adopción de IA y las herramientas, con preguntas mixtas' },
]

const SUMAR: readonly ChatChip[] = [
  { label: 'Agrega una sección de comunicación', value: 'Agrega una sección de comunicación' },
  { label: 'Agrega una sección de bienestar', value: 'Agrega una sección de bienestar' },
]

const PREGUNTAS: Record<SectionsCriterionId, string> = {
  scope: '¿Dónde quieres que caiga lo que genere?',
  focuses: '¿Qué temas debe cubrir? Puedes elegir varios o escribir el tuyo:',
  style: '¿Cómo quieres que respondan?',
  size: '¿De qué tamaño la armo?',
}

const SEGUIR = '__continue__'
const REINTENTAR = '__retry__'
const MS_PAUSA = 350
const MS_PENSANDO = 900
const MS_SECCION = 520
const MS_PREGUNTA = 140
const MS_CUENTA = 260
/** En la encuesta que falla, la creación se cae después de este paso: ya se ve algo y se ve que se quita. */
const PASO_DEL_FALLO = 6

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`
const seccionVacia = (): SurveySection => ({ id: `section-${Date.now()}`, title: '', description: '', questions: [], children: [] })
const conAlgo = (seccion: SurveySection) => seccion.title.trim() !== '' || seccion.questions.length > 0 || seccion.children.length > 0
const titulada = (lista: readonly SurveySection[]) => lista.some((seccion) => seccion.title.trim() !== '')

function opcionesPara(criterio: SectionsCriterionId, pedido: AiSectionsBrief): readonly ChatChip[] {
  if (criterio === 'style') return STYLE_CHIPS
  if (criterio === 'size') return sizePresets('survey')
  const elegidos = new Set(pedido.focuses)
  const resto = FOCUS_CHIPS.filter((chip) => !elegidos.has(chip.value))
  return elegidos.size > 0 ? [...resto, { label: 'Seguir con estos', value: SEGUIR }] : resto
}

const mapaPreguntas = (lista: readonly SurveySection[], cambio: (pregunta: SurveyQuestion) => SurveyQuestion): SurveySection[] =>
  lista.map((seccion) => ({ ...seccion, questions: seccion.questions.map(cambio), children: mapaPreguntas(seccion.children, cambio) }))

const sinPreguntas = (lista: readonly SurveySection[], ids: ReadonlySet<string>): SurveySection[] =>
  lista.map((seccion) => ({ ...seccion, questions: seccion.questions.filter((pregunta) => !ids.has(pregunta.id)), children: sinPreguntas(seccion.children, ids) }))

/** Vuelve a poner una sección quitada en su sitio («Deshacer»). */
function reinsertar(lista: SurveySection[], padre: string | null, indice: number, seccion: SurveySection): SurveySection[] {
  if (padre === null) return [...lista.slice(0, indice), seccion, ...lista.slice(indice)]
  const duena = findSection(lista, padre)
  if (!duena) return [...lista, seccion]
  const hijas = duena.section.children
  return patchSection(lista, padre, { children: [...hijas.slice(0, indice), seccion, ...hijas.slice(indice)] })
}

// «Crear una encuesta con IA» habla de quién la crea, no de qué mide: ese «IA» no es el tema «Adopción de IA».
const sinConIa = (texto: string) => texto.replace(/\bcon (la )?ia\b/gi, '')
const briefInicial = (texto: string | null) =>
  texto ? mergeBrief(defaultBrief(null, 'survey', false), { ...parseSectionsMessage(sinConIa(texto), { canScopeToSection: false }), notes: sinConIa(texto).slice(0, 400) }) : defaultBrief(null, 'survey', false)
const entendioAlgo = (brief: AiSectionsBrief) => brief.focuses.length > 0 || brief.questionStyle !== null || brief.sectionCount > 0 || brief.questionCount > 0

export function useConversacion(sesion: Sesion) {
  const secuencia = useRef(0)
  const siguienteId = () => ++secuencia.current
  const [pedido, setPedido] = useState<AiSectionsBrief>(() => briefInicial(sesion.pedidoInicial))
  const [mensajes, setMensajes] = useState<Mensaje[]>(() => {
    const inicio: Mensaje[] = sesion.desdeInicio
      ? [
          { id: siguienteId(), rol: 'agente', texto: CONTINUO },
          { id: siguienteId(), rol: 'persona', texto: sesion.pedidoInicial ?? 'Crear una encuesta con IA' },
        ]
      : []
    if (sesion.desdeInicio && entendioAlgo(briefInicial(sesion.pedidoInicial))) return inicio
    const conSecciones = !sesion.desdeInicio && titulada(sesion.secciones)
    return [...inicio, { id: siguienteId(), rol: 'agente', texto: conSecciones ? SALUDO_CON_SECCIONES : SALUDO, opciones: conSecciones ? SUMAR : INICIOS }]
  })
  const [fase, setFase] = useState<Fase>('conversando')
  const [pendientes, setPendientes] = useState<SectionsCriterionId[]>([])
  const [semilla, setSemilla] = useState(1)
  const [confirmarDescarte, setConfirmarDescarte] = useState(false)

  // Lo que hizo la IA: las secciones que creó, las preguntas que sumó a secciones ajenas y cómo dejó cada pregunta la última
  // vez que la tocó. Si una pregunta ya no está igual, la cambió la persona y el agente no vuelve a tocarla.
  const raices = useRef<Set<string>>(new Set())
  const sumadas = useRef<Set<string>>(new Set())
  const hechas = useRef<Map<string, string>>(new Map())
  const reintento = useRef<(() => void) | null>(null)

  const llamadas = useRef(sesion)
  useEffect(() => {
    llamadas.current = sesion
  })

  const tiempos = useRef<number[]>([])
  useEffect(() => () => tiempos.current.forEach((tiempo) => window.clearTimeout(tiempo)), [])
  const despues = (ms: number, hacer: () => void) => {
    tiempos.current.push(window.setTimeout(hacer, ms))
  }

  const decir = (texto: string, extra: Omit<Extract<Mensaje, { rol: 'agente' }>, 'id' | 'rol' | 'texto'> = {}) =>
    setMensajes((previos) => [...previos, { id: siguienteId(), rol: 'agente', texto, ...extra }])
  const escribio = (texto: string) => setMensajes((previos) => [...previos, { id: siguienteId(), rol: 'persona', texto }])

  // ── Crear a la vista ──

  const aplicar = (paso: PasoCreacion, limpiar: boolean) => {
    const { onSecciones, onRevelar, onCreando } = llamadas.current
    if (paso.tipo === 'seccion') {
      if (paso.padre === null) {
        raices.current.add(paso.seccion.id)
        onCreando(paso.seccion.id)
        // La sección vacía y sin nombre con la que nace una encuesta en blanco se va: la reemplaza lo que crea la IA.
        onSecciones((actual) => [...(limpiar ? actual.filter(conAlgo) : actual), paso.seccion])
      } else {
        const padre = paso.padre
        onSecciones((actual) => (findSection(actual, padre) ? patchSection(actual, padre, { children: [...(findSection(actual, padre)?.section.children ?? []), paso.seccion] }) : actual))
      }
      return onRevelar(paso.seccion.id)
    }
    if (paso.tipo === 'pregunta') {
      hechas.current.set(paso.pregunta.id, JSON.stringify(paso.pregunta))
      const { seccionId, pregunta } = paso
      return onSecciones((actual) => {
        const duena = findSection(actual, seccionId)
        return duena ? patchSection(actual, seccionId, { questions: [...duena.section.questions, pregunta] }) : actual
      })
    }
    const { raiz } = paso
    const subsecciones = countDescendants(raiz)
    decir(`Agregué «${raiz.title}» con ${subsecciones > 0 ? `${plural(subsecciones, 'subsección', 'subsecciones')} y ` : ''}${plural(countQuestions([raiz]), 'pregunta', 'preguntas')}.`)
  }

  // Lo que se alcanzó a poner se quita entero: la encuesta queda como estaba antes de pedirlo.
  const fallar = (puestas: readonly string[], primera: boolean) => {
    llamadas.current.onSecciones((actual) => {
      const sin = puestas.reduce((arbol, id) => removeSection(arbol, id), actual)
      return sin.length > 0 ? sin : [seccionVacia()]
    })
    puestas.forEach((id) => raices.current.delete(id))
    if (primera) llamadas.current.onDeshacerGenerales()
    llamadas.current.onCreando(null)
    decir('No pude terminar de armarla: algo falló de mi lado. Quité lo que alcancé a poner para no dejar la encuesta a medias; lo que conversamos sigue aquí y puedo intentarlo otra vez.', {
      opciones: [{ label: 'Reintentar', value: REINTENTAR }],
    })
    setFase(primera && raices.current.size === 0 ? 'conversando' : 'lista')
  }

  const construir = (nuevas: readonly SurveySection[], primera: boolean, alTerminar: () => void) => {
    reintento.current = () => construir(nuevas.map((seccion) => structuredClone(seccion)), primera, alTerminar)
    setFase('creando')
    const pasos = pasosDe(nuevas)
    const corte = llamadas.current.falla ? Math.min(PASO_DEL_FALLO, pasos.length - 1) : -1
    const puestas: string[] = []
    let espera = 0
    for (const [indice, paso] of pasos.entries()) {
      espera += paso.tipo === 'seccion' ? MS_SECCION : paso.tipo === 'pregunta' ? MS_PREGUNTA : MS_CUENTA
      if (indice === corte) return despues(espera + MS_PENSANDO, () => fallar(puestas, primera))
      if (paso.tipo === 'seccion' && paso.padre === null) puestas.push(paso.seccion.id)
      despues(espera, () => aplicar(paso, primera && indice === 0))
    }
    despues(espera + MS_CUENTA, () => {
      llamadas.current.onCreando(null)
      setFase('lista')
      alTerminar()
    })
  }

  const sugerencias = (): readonly ChatChip[] => {
    const nombres = llamadas.current.secciones.filter((seccion) => raices.current.has(seccion.id)).map((seccion) => seccion.title)
    return [
      ...(nombres[0] ? [{ label: `Agrega una pregunta abierta en ${nombres[0]}`, value: `Agrega una pregunta abierta en ${nombres[0]}` }] : []),
      { label: 'Cambia la escala a frecuencia', value: 'Cambia la escala a frecuencia' },
      ...(nombres.length > 1 ? [{ label: `Quita ${nombres[nombres.length - 1]}`, value: `Quita ${nombres[nombres.length - 1]}` }] : []),
    ]
  }

  const generar = (listo: AiSectionsBrief) => {
    const completo = completeSizes(listo)
    const nueva = semilla + 1
    setSemilla(nueva)
    setPendientes([])
    setFase('creando')
    despues(MS_PENSANDO, () => {
      const puesto = llamadas.current.onEmpezar(tipoDelPedido(completo.notes, completo.focuses))
      const generales = puesto.nombre ? ` Le puse de nombre «${puesto.nombre}»${puesto.tipo ? ` y el tipo ${puesto.tipo}` : ''} en «Datos generales»; cámbialos cuando quieras.` : ''
      decir(`Estoy creando las secciones y sus preguntas en «Secciones y preguntas».${generales}`)
      const propuesta = generateSections(completo, nueva)
      construir(propuesta.sections, true, () => {
        const total = propuesta.sections.length
        const faltan = llamadas.current.pendientes
        decir(
          `Listo: la encuesta tiene ${plural(total, 'sección nueva', 'secciones nuevas')} con ${plural(countQuestions(propuesta.sections), 'pregunta', 'preguntas')}. Pídeme ajustes aquí o cámbiala a mano: lo que edites lo respeto.${faltan.length ? ` Antes de finalizar te faltan ${faltan.join(' y ')}.` : ''}`,
          { opciones: sugerencias() },
        )
      })
    })
  }

  const preguntar = (faltan: SectionsCriterionId[], actual: AiSectionsBrief) => {
    if (faltan.length === 0) return
    setPendientes(faltan)
    despues(420, () => decir(PREGUNTAS[faltan[0]], { opciones: opcionesPara(faltan[0], actual) }))
  }

  const seguir = (actual: AiSectionsBrief, entendido: string[]) => {
    const faltan = missingSectionsCriteria(actual, false)
    if (faltan.length === 0) {
      return despues(MS_PAUSA, () => {
        decir(`Perfecto: ${describeBrief(completeSizes(actual))} Empiezo.`)
        generar(actual)
      })
    }
    despues(MS_PAUSA, () => {
      decir(entendido.length > 0 ? `Entendido: ${entendido.join(' · ')}. Me falta algo más:` : 'Gracias. Para armarla necesito saber algo más:')
      preguntar(faltan, actual)
    })
  }

  // Lo pedido en el inicio de Encuestas sigue aquí sin volver a escribirlo. Con el temporizador propio del efecto, el modo
  // estricto (que lo monta dos veces) no lo manda dos veces.
  useEffect(() => {
    if (!sesion.desdeInicio || !entendioAlgo(pedido)) return
    const temporizador = window.setTimeout(() => seguir(pedido, describeUnderstood(parseSectionsMessage(pedido.notes, { canScopeToSection: false }))), 500)
    return () => window.clearTimeout(temporizador)
    // Solo al abrir: lo que llega después ya pasa por enviar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Ajustes por chat ──

  const ajustar = (ajuste: Ajuste, texto: string) => {
    const { secciones, onSecciones, onRevelar } = llamadas.current
    if (ajuste.tipo === 'noEncuentro') return decir(`No encontré una sección que se llame «${ajuste.nombre || 'así'}». Dime el nombre tal como aparece en la encuesta.`)
    if (ajuste.tipo === 'agregarSeccion') {
      const usados = new Set(secciones.map((seccion) => normalizar(seccion.title)))
      const pedidos = parseSectionsMessage(texto, { canScopeToSection: false }).focuses ?? []
      const tema = pedidos[0] ?? AI_FOCUSES.find((foco) => !usados.has(normalizar(foco.label)))?.id ?? AI_FOCUSES[0].id
      const nueva = semilla + 1
      setSemilla(nueva)
      decir(`Voy con una sección de ${focusLabel(tema)}…`)
      const propuesta = generateSections({ ...completeSizes(pedido), scope: 'survey', focuses: [tema], sectionCount: 1 }, nueva)
      return construir(propuesta.sections, false, () => decir('Ya está al final de la encuesta. ¿Algo más?', { opciones: sugerencias() }))
    }
    if (ajuste.tipo === 'quitar') {
      const { entrada } = ajuste
      if (entrada.depth === 1 && secciones.length === 1) return decir(`No puedo quitar «${entrada.section.title}»: la encuesta necesita al menos una sección.`)
      const hermanas = entrada.parentId ? (findSection(secciones, entrada.parentId)?.section.children ?? []) : secciones
      const indice = hermanas.findIndex((seccion) => seccion.id === entrada.section.id)
      const quitada = entrada.section
      onSecciones((actual) => removeSection(actual, quitada.id))
      return decir(`Quité «${quitada.title}» con ${plural(countQuestions([quitada]), 'pregunta', 'preguntas')}.`, {
        deshacer: { texto: `Quité «${quitada.title}»`, hacer: () => onSecciones((actual) => (findSection(actual, quitada.id) ? actual : reinsertar(actual, entrada.parentId, indice, quitada))) },
      })
    }
    if (ajuste.tipo === 'agregarPregunta') {
      const raiz = findSection(secciones, pathIds(secciones, ajuste.entrada.section.id)[0])?.section ?? ajuste.entrada.section
      const hoja = ultimaHoja(ajuste.entrada.section)
      const pregunta = preguntaPara(hoja, raiz, ajuste.abierta)
      hechas.current.set(pregunta.id, JSON.stringify(pregunta))
      if (!raices.current.has(raiz.id)) sumadas.current.add(pregunta.id)
      onSecciones((actual) => {
        const duena = findSection(actual, hoja.id)
        return duena ? patchSection(actual, hoja.id, { questions: [...duena.section.questions, pregunta] }) : actual
      })
      onRevelar(hoja.id)
      return decir(`Agregué una pregunta ${ajuste.abierta ? 'abierta' : 'en escala'} al final de «${hoja.title || raiz.title}»: «${pregunta.statement}»`)
    }
    // Cambiar la escala o el tipo de respuesta: solo lo que creó la IA y nadie volvió a tocar.
    const cambio = (pregunta: SurveyQuestion) => (ajuste.tipo === 'escala' ? conEscala(pregunta, ajuste.escala) : conRespuesta(pregunta, ajuste.respuesta))
    const nuevas = new Map<string, SurveyQuestion>()
    let aMano = 0
    for (const pregunta of preguntasDe(secciones)) {
      const original = hechas.current.get(pregunta.id)
      if (original === undefined) continue
      if (original !== JSON.stringify(pregunta)) {
        aMano += 1
        continue
      }
      const cambiada = cambio(pregunta)
      if (cambiada !== pregunta) nuevas.set(pregunta.id, cambiada)
    }
    nuevas.forEach((pregunta, id) => hechas.current.set(id, JSON.stringify(pregunta)))
    if (nuevas.size > 0) onSecciones((actual) => mapaPreguntas(actual, (pregunta) => nuevas.get(pregunta.id) ?? pregunta))
    const que = ajuste.tipo === 'escala' ? `a escala de ${NOMBRE_ESCALA[ajuste.escala]}` : NOMBRE_RESPUESTA[ajuste.respuesta]
    const respeto = aMano === 0 ? '' : aMano === 1 ? ' No toqué la pregunta que editaste a mano.' : ` No toqué las ${aMano} preguntas que editaste a mano.`
    decir(nuevas.size > 0 ? `Cambié ${plural(nuevas.size, 'pregunta', 'preguntas')} ${que}.${respeto}` : `Las preguntas que creé ya estaban ${que}; no cambié nada.${respeto}`)
  }

  const enviar = (bruto: string) => {
    const texto = bruto.trim()
    if (texto === '' || fase === 'creando') return
    escribio(texto)
    const ajuste = titulada(llamadas.current.secciones) && pendientes.length === 0 ? leerAjuste(texto, llamadas.current.secciones) : null
    if (ajuste && (fase === 'lista' || ajuste.tipo !== 'noEncuentro')) return despues(MS_PAUSA, () => ajustar(ajuste, texto))
    if (fase === 'lista') {
      return despues(MS_PAUSA, () =>
        decir('Eso todavía no lo sé hacer desde aquí. Puedo agregar una sección sobre un tema, agregar una pregunta en una sección, quitar una sección o cambiar la escala o el tipo de respuesta.', { opciones: sugerencias() }),
      )
    }
    const cambio = parseSectionsMessage(texto, { canScopeToSection: false })
    // Un tema escrito a mano no está en el catálogo, pero sigue siendo un tema: entra tal cual.
    if (pendientes[0] === 'focuses') cambio.focuses = [...new Set([...pedido.focuses, ...(cambio.focuses?.length ? cambio.focuses : [texto])])]
    const unido = mergeBrief(pedido, { ...cambio, notes: [pedido.notes, texto].filter(Boolean).join(' ').slice(0, 400) })
    setPedido(unido)
    seguir(unido, describeUnderstood(cambio))
  }

  const elegir = (opcion: ChatChip) => {
    if (fase === 'creando') return
    if (opcion.value === REINTENTAR) {
      escribio('Reintentar')
      decir('Lo intento otra vez, con lo mismo que me pediste…')
      return reintento.current?.()
    }
    if (opcion.value === SEGUIR) {
      escribio('Seguir con estos')
      return seguir(pedido, [])
    }
    const criterio = pendientes[0]
    if (!criterio) return enviar(opcion.value)
    escribio(opcion.label)
    if (criterio === 'focuses') {
      const unido = mergeBrief(pedido, { focuses: [...new Set([...pedido.focuses, opcion.value])] })
      setPedido(unido)
      return despues(280, () => decir(`Agregué ${focusLabel(opcion.value)}. ¿Otro tema o seguimos?`, { opciones: opcionesPara('focuses', unido) }))
    }
    const cambio: Partial<AiSectionsBrief> =
      criterio === 'style' ? { questionStyle: opcion.value as AiQuestionStyle } : (sizePresets('survey').find((preset) => preset.value === opcion.value)?.sizes ?? {})
    const unido = mergeBrief(pedido, cambio)
    setPedido(unido)
    seguir(unido, [])
  }

  // ── Descartar todo lo que hizo la IA: siempre pregunta (IA-053) ──

  const deLaIa = sesion.secciones.filter((seccion) => raices.current.has(seccion.id))
  const hayDeLaIa = deLaIa.length > 0 || preguntasDe(sesion.secciones).some((pregunta) => sumadas.current.has(pregunta.id))
  const nombresDeLaIa = (() => {
    const nombres = deLaIa.map((seccion) => `«${seccion.title.trim() || 'Sección sin título'}»`)
    return nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}` : (nombres[0] ?? 'Las preguntas que sumé')
  })()

  const descartar = () => {
    setConfirmarDescarte(false)
    escribio('Descartar lo que hizo la IA')
    const ids = [...raices.current]
    const preguntas = new Set(sumadas.current)
    llamadas.current.onSecciones((actual) => {
      const sin = sinPreguntas(
        ids.reduce((arbol, id) => removeSection(arbol, id), actual),
        preguntas,
      )
      return sin.length > 0 ? sin : [seccionVacia()]
    })
    llamadas.current.onDeshacerGenerales()
    raices.current = new Set()
    sumadas.current = new Set()
    hechas.current = new Map()
    notify('Descartamos lo que hizo la IA', 'Quitamos de la encuesta las secciones y preguntas que creó el agente.', 'success')
    setPedido(defaultBrief(null, 'survey', false))
    setPendientes([])
    decir('Listo, quité todo lo que había creado. Cuéntame otra vez qué quieres medir cuando quieras.', { opciones: INICIOS })
    setFase('conversando')
  }

  return { mensajes, fase, enviar, elegir, hayDeLaIa, nombresDeLaIa, confirmarDescarte, setConfirmarDescarte, descartar }
}
