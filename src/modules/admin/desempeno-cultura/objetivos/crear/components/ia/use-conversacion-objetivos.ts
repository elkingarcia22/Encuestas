import { useEffect, useRef, useState } from 'react'
import { AMBITION_META, AMBITION_ORDER, focusLabel, generateObjectiveSet } from '../../../modelo/constructor/aiObjectiveBrief'
import { createEmptyBrief, focusesFromObjectives, parseBriefFromMessage, toAiObjectiveBrief, type ParsedBrief } from '../../../modelo/constructor/aiChatParser'
import {
  CONTINUE_VALUE,
  NO_ALIGNMENT_VALUE,
  NO_CHILDREN_VALUE,
  SKIP_BASELINE_VALUE,
  SKIP_LEVER_VALUE,
  WRITE_OWN_VALUE,
  alignmentChips,
  chatVocab,
  companyObjectiveLabel,
  criterionChips,
  criterionQuestion,
  focusChips,
  freeCompanyObjectives,
  missingCriteria,
  workingPhases,
  type ChatChip,
  type ChatContext,
  type CriterionId,
} from '../../../modelo/constructor/aiChatQuestions'
import type { CicloDraft } from '../../../modelo/constructor/cicloBuilderTypes'
import { ESPERA_CIERRE, ESPERA_GENERANDO, OPCIONES_MODIFICAR, PREFIJO_AJUSTE, ajustar, conPesos, contextoDe, cupoLibre, entendido, esSeguir, resumenPropuesta, saludo, type Ajuste } from './conversacion-objetivos'
import type { PedidoIa } from './pedido'

// La conversación de «Crear objetivos con IA», tal como en el prototipo: la persona cuenta con sus palabras qué se juega
// el ciclo, el agente saca de ahí lo que puede (cuántos, en qué frentes, qué tan exigentes) y pregunta de a una lo que
// falte, en el orden del modelo. Lo que propone aterriza en la pantalla como objetivos normales y el veredicto se decide
// en el hilo. Misma forma que use-conversacion de Encuestas: tres fases y solo las opciones del último mensaje vivas.
//
// El pedido y lo pendiente viven en refs y no en estado: no se pintan, y las respuestas llegan en temporizadores que
// con estado leerían una versión vieja (el original preguntaba con el brief de antes de la última respuesta).

export type Mensaje = { id: number; rol: 'agente'; texto: string; opciones?: readonly ChatChip[] } | { id: number; rol: 'persona'; texto: string }

export type Fase = 'conversando' | 'generando' | 'revisando'

const MS_ESCRIBIR = 550
const MS_RONDA = 350

export function useConversacionObjetivos(borrador: CicloDraft, pedido: PedidoIa, onClose: () => void) {
  const [contexto] = useState<ChatContext>(() => contextoDe(borrador, pedido))
  const tope = contexto.maxCount
  const secuencia = useRef(0)
  const siguienteId = () => ++secuencia.current
  const [mensajes, setMensajes] = useState<Mensaje[]>(() => [{ id: 0, rol: 'agente', texto: saludo(contexto, pedido) }])
  const [fase, setFase] = useState<Fase>('conversando')
  const [etapa, setEtapa] = useState<string | null>(null)
  const brief = useRef<ParsedBrief>(createEmptyBrief())
  const pendientes = useRef<CriterionId[]>([])
  const sinCupo = cupoLibre(pedido) === 0

  // Lo último que sabe el panel de quien lo montó: la persona sigue editando detrás mientras habla.
  const llamadas = useRef({ pedido, onClose })
  useEffect(() => {
    llamadas.current = { pedido, onClose }
  })

  // Los tiempos de la conversación se cancelan si el panel se cierra a mitad.
  const tiempos = useRef<number[]>([])
  useEffect(() => () => tiempos.current.forEach((tiempo) => window.clearTimeout(tiempo)), [])
  const despues = (ms: number, hacer: () => void) => {
    tiempos.current.push(window.setTimeout(hacer, ms))
  }

  const decir = (texto: string, opciones?: readonly ChatChip[]) => setMensajes((previos) => [...previos, { id: siguienteId(), rol: 'agente', texto, opciones }])
  const escribio = (texto: string) => setMensajes((previos) => [...previos, { id: siguienteId(), rol: 'persona', texto }])
  const fijar = (nuevo: ParsedBrief) => {
    brief.current = nuevo
    return nuevo
  }

  /* ---- Generación ---- */

  const generar = () => {
    const listo = brief.current
    setFase('generando')
    pendientes.current = []
    // Los captions del original rotan a lo largo de la espera: dicen lo que este ciclo de verdad hace.
    const etapas = workingPhases(contexto)
    etapas.forEach((texto, indice) => despues((ESPERA_GENERANDO / etapas.length) * indice, () => setEtapa(texto)))
    despues(ESPERA_GENERANDO + ESPERA_CIERRE, () => {
      const generados = generateObjectiveSet(toAiObjectiveBrief(listo), { useContextAsObjective: false, rules: contexto.rules, alignTo: listo.alignedTo, childrenCount: listo.childrenCount })
      llamadas.current.pedido.onAplicar(conPesos(generados, llamadas.current.pedido))
      setEtapa(null)
      decir(resumenPropuesta(generados, listo, contexto))
      setFase('revisando')
      despues(MS_RONDA, () => decir('¿Qué hacemos con ellos?'))
    })
  }

  const listoParaGenerar = () => {
    despues(MS_RONDA, () => decir('¡Perfecto! Tengo todo lo que necesito. Dame un momento…'))
    despues(900, generar)
  }

  /* ---- Preguntas ---- */

  const preguntar = (faltan: CriterionId[], actual: ParsedBrief, demora = MS_ESCRIBIR) => {
    if (faltan.length === 0) return
    pendientes.current = faltan
    despues(demora, () => decir(criterionQuestion(faltan[0], contexto, actual), criterionChips(faltan[0], contexto, actual)))
  }

  /** Sigue con lo que falte tras contestar `contestado`, o genera si no falta nada. */
  const seguir = (actual: ParsedBrief, contestado?: CriterionId) => {
    const faltan = missingCriteria(actual, contexto).filter((criterio) => criterio !== contestado)
    if (faltan.length === 0) return listoParaGenerar()
    preguntar(faltan, actual, 400)
  }

  /** Cierra la alineación y saca de ella los frentes: lo que la empresa ya decidió no se vuelve a preguntar. */
  const cerrarAlineacion = (actual: ParsedBrief) => {
    const elegidos = contexto.companyObjectives.filter((objetivo) => actual.alignedTo.includes(objetivo.id))
    const focuses = actual.focuses.length > 0 ? actual.focuses : focusesFromObjectives(elegidos)
    seguir(fijar({ ...actual, focuses, alignmentAsked: true }), 'alignment')
  }

  /** Un grupo puede empujar dos objetivos de la empresa a la vez: la ronda sigue hasta «Seguir con estos». */
  const masAlineacion = (actual: ParsedBrief) => {
    if (freeCompanyObjectives(contexto, actual.alignedTo) === 0) return cerrarAlineacion(actual)
    const nombres = actual.alignedTo
      .map((id) => contexto.companyObjectives.findIndex((objetivo) => objetivo.id === id))
      .filter((indice) => indice !== -1)
      .map((indice) => companyObjectiveLabel(contexto.companyObjectives[indice], indice))
    const resto = alignmentChips(contexto, actual.alignedTo).filter((chip) => chip.value !== NO_ALIGNMENT_VALUE)
    despues(MS_RONDA, () => decir('Anotado. ¿Le aporta a alguno más o seguimos?', [{ label: 'Seguir con estos', value: CONTINUE_VALUE, tone: 'primary', description: nombres.join(', ') }, ...resto]))
  }

  /** Igual con los frentes: venga de la lista o escrito a mano, se vuelve a preguntar. */
  const masFrentes = (actual: ParsedBrief, anadido: string) =>
    despues(MS_RONDA, () =>
      decir(`Frente «${anadido}» agregado. ¿Quieres agregar otro o seguimos?`, [
        { label: 'Seguir con estos', value: CONTINUE_VALUE, tone: 'primary', description: actual.focuses.map(focusLabel).join(', ') },
        ...focusChips(contexto, actual.focuses),
      ]),
    )

  /* ---- Mensajes de la persona ---- */

  /** El primer mensaje, o uno de contexto: se fusiona con lo que ya se sabía en vez de reemplazarlo. */
  const inicial = (texto: string) => {
    const leido = parseBriefFromMessage(texto)
    const previo = brief.current
    const actual = fijar({
      ...previo,
      count: leido.count === null ? previo.count : Math.min(tope, leido.count),
      focuses: [...previo.focuses, ...leido.focuses.filter((focus) => !previo.focuses.includes(focus))],
      ambition: leido.ambition ?? previo.ambition,
      context: previo.context.trim() === '' ? leido.context : previo.context,
    })
    const faltan = missingCriteria(actual, contexto)
    if (faltan.length === 0) return listoParaGenerar()
    const partes = entendido(actual, contexto)
    despues(MS_ESCRIBIR, () => decir(partes.length > 0 ? `Genial, ya tengo ${partes.join(' · ')}. Me falta una cosa más:` : '¡Gracias! Para que los objetivos queden bien necesito un par de cosas más:'))
    preguntar(faltan, actual, 950)
  }

  /** La respuesta a la pregunta viva, escrita o elegida. */
  const responder = (texto: string) => {
    const criterio = pendientes.current[0]
    const actual = brief.current
    const limpio = texto.trim()

    if (criterio === 'alignment') {
      if (limpio === NO_ALIGNMENT_VALUE || limpio === CONTINUE_VALUE || esSeguir(limpio)) return cerrarAlineacion(actual)
      const elegido = contexto.companyObjectives.find((objetivo) => objetivo.id === limpio || objetivo.title.toLowerCase().includes(limpio.toLowerCase()))
      // Lo que no coincide con ninguno no se pierde: puede ser el nombre interno de una iniciativa, y queda como contexto.
      if (!elegido) return cerrarAlineacion(fijar({ ...actual, notes: [actual.notes, limpio].filter(Boolean).join('. ') }))
      return masAlineacion(fijar({ ...actual, alignedTo: actual.alignedTo.includes(elegido.id) ? actual.alignedTo : [...actual.alignedTo, elegido.id] }))
    }

    if (criterio === 'lever') return seguir(fijar({ ...actual, lever: limpio === SKIP_LEVER_VALUE ? '' : limpio, leverAsked: true }), 'lever')

    if (criterio === 'focuses') {
      if (limpio === CONTINUE_VALUE || esSeguir(limpio)) return seguir(actual, 'focuses')
      // Un frente escrito a mano no está en la lista, pero sigue siendo un frente: entra tal cual.
      const leidos = parseBriefFromMessage(limpio).focuses
      const anadidos = leidos.length > 0 ? leidos : [limpio]
      const unido = fijar({ ...actual, focuses: [...actual.focuses, ...anadidos.filter((focus) => !actual.focuses.includes(focus))] })
      return masFrentes(unido, anadidos.map(focusLabel).join(', '))
    }

    if (criterio === 'count') {
      const numero = parseInt(limpio.replace(/\D/g, ''), 10)
      if (Number.isNaN(numero) || numero < 1 || numero > tope) {
        return despues(MS_RONDA, () => decir(`Necesito un número entre 1 y ${tope}. ¿Cuántos ${chatVocab(contexto).objectives.toLowerCase()}?`, criterionChips('count', contexto, actual)))
      }
      return seguir(fijar({ ...actual, count: numero }), 'count')
    }

    if (criterio === 'ambition') {
      const minusculas = limpio.toLowerCase()
      const nivel = parseBriefFromMessage(limpio).ambition ?? AMBITION_ORDER.find((opcion) => minusculas.includes(opcion) || minusculas.includes(AMBITION_META[opcion].label.toLowerCase()))
      if (!nivel) return despues(MS_RONDA, () => decir('No logré identificar el nivel. Elige una de estas opciones:', criterionChips('ambition', contexto, actual)))
      return seguir(fijar({ ...actual, ambition: nivel }), 'ambition')
    }

    if (criterio === 'children') {
      const numero = parseInt(limpio.replace(/\D/g, ''), 10)
      let cuantos: number | null = limpio === NO_CHILDREN_VALUE ? 0 : Number.isNaN(numero) ? null : Math.min(5, numero)
      if (cuantos === null) {
        // Un «sí» suelto vale: la pregunta ya dijo de qué tamaño es el plan.
        const dijo = limpio.toLowerCase()
        if (!(dijo.startsWith('s') || dijo.includes('dale') || dijo.includes('ok'))) return preguntar(['children', ...pendientes.current.slice(1)], actual, MS_RONDA)
        cuantos = contexto.rules.children === 'results' ? 3 : 2
      }
      return seguir(fijar({ ...actual, childrenCount: cuantos, childrenAsked: true }), 'children')
    }

    // Punto de partida: saltarla también cuenta como contestada; lo escrito va a las notas que lee el generador.
    if (criterio === 'baseline') return seguir(fijar({ ...actual, notes: limpio === SKIP_BASELINE_VALUE ? actual.notes : [actual.notes, limpio].filter(Boolean).join('. '), baselineAsked: true }), 'baseline')
  }

  const enviar = (bruto: string) => {
    const texto = bruto.trim()
    if (texto === '' || fase === 'generando' || sinCupo) return
    escribio(texto)
    // Decirle algo mientras revisa es un pedido de cambio dicho de corrido («hazlos más agresivos»): la tanda sale y el
    // mensaje se lee sobre lo que ya se sabía.
    if (fase === 'revisando') {
      llamadas.current.pedido.onDescartar()
      setFase('conversando')
      pendientes.current = []
      return inicial(texto)
    }
    if (pendientes.current.length > 0) return responder(texto)
    inicial(texto)
  }

  /* ---- Opciones ---- */

  const ajustarPedido = (ajuste: Ajuste) => {
    const { brief: nuevo, aviso } = ajustar(brief.current, ajuste, tope)
    fijar(nuevo)
    if (aviso) {
      despues(MS_RONDA, () => decir(aviso))
      return despues(MS_RONDA + 600, generar)
    }
    seguir(nuevo)
  }

  const elegir = (opcion: ChatChip) => {
    if (fase === 'generando') return
    escribio(opcion.label)
    if (opcion.value.startsWith(PREFIJO_AJUSTE)) return ajustarPedido(opcion.value.slice(PREFIJO_AJUSTE.length) as Ajuste)
    // «Otro» no contesta de una: lo escrito se responde desde la caja de abajo, que es la misma del resto del chat.
    if (opcion.value === WRITE_OWN_VALUE) return despues(MS_RONDA, () => decir(`${opcion.placeholder ?? 'Escribe tu propia respuesta'} aquí abajo.`))
    if (pendientes.current.length > 0) return responder(opcion.value)
    inicial(opcion.value)
  }

  /* ---- Revisión ---- */

  const conservar = () => {
    escribio('Conservar todos')
    setFase('conversando')
    decir('Perfecto, se quedan. Si quieres más, cuéntame qué más necesitas.')
    llamadas.current.pedido.onConservar()
  }

  const otraPropuesta = () => {
    escribio('Otra propuesta')
    decir('Voy a preparar una nueva propuesta con los mismos criterios…')
    despues(900, generar)
  }

  const modificar = () => {
    escribio('Modificar')
    llamadas.current.pedido.onDescartar()
    setFase('conversando')
    pendientes.current = []
    despues(MS_RONDA, () => decir('¿Qué quieres cambiar?', OPCIONES_MODIFICAR))
  }

  const descartar = () => {
    escribio('Descartar')
    llamadas.current.pedido.onDescartar()
    setFase('conversando')
    decir('Descartados. Si cambias de idea, puedes volver a abrir el chat.')
    despues(1200, () => llamadas.current.onClose())
  }

  return { mensajes, fase, etapa, sinCupo, enviar, elegir, conservar, otraPropuesta, modificar, descartar }
}
