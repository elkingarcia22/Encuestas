import { AMBITION_META, AMBITION_ORDER, MAX_AI_OBJECTIVES, focusLabel, type AmbitionLevel } from '../../../modelo/constructor/aiObjectiveBrief'
import type { ParsedBrief } from '../../../modelo/constructor/aiChatParser'
import { chatChildrenVocab, chatGreeting, chatVocab, type ChatChip, type ChatContext, type ObjectiveScope } from '../../../modelo/constructor/aiChatQuestions'
import { distributeWeights, type CicloDraft, type Objective } from '../../../modelo/constructor/cicloBuilderTypes'
import type { PedidoIa } from './pedido'

// Lo que el agente de objetivos dice y decide sin tocar la pantalla: el contexto con el que arranca, el saludo, el
// resumen de la propuesta y cómo se aplica cada «Modificar». En el prototipo vivía dentro de AiObjectiveChatPanel.tsx;
// las preguntas, sus opciones y el parser ya estaban portados en modelo/constructor y aquí solo se usan.

/** Quien habla con el agente, como en el agente de Encuestas. */
export const NOMBRE_USUARIO = 'Carolina'

export const ESPERA_GENERANDO = 2800
/** El remate de la barra de progreso del original: el 100 % se ve un momento antes de soltar la propuesta. */
export const ESPERA_CIERRE = 450

/** El alcance del pedido en la palabra del prototipo: la persona es «colaborador» en las preguntas. */
const ALCANCE: Record<PedidoIa['alcance'], ObjectiveScope> = { empresa: 'empresa', grupo: 'grupo', individual: 'colaborador' }

/** Sin un nombre propio, cómo se nombra a quien recibe los objetivos. */
const AUDIENCIA_POR_DEFECTO: Record<PedidoIa['alcance'], string> = { empresa: 'la empresa', grupo: 'el grupo', individual: 'la persona' }

export const TITULO_POR_ALCANCE: Record<PedidoIa['alcance'], string> = {
  empresa: 'Crear objetivos de la empresa',
  grupo: 'Crear objetivos del grupo',
  individual: 'Crear objetivos de la persona',
}

/** Cuántos caben todavía en el destino: el agente no pasa de diez entre todos. */
export const cupoLibre = (pedido: PedidoIa) => Math.max(0, MAX_AI_OBJECTIVES - pedido.existentes)

/**
 * Todo lo que el agente sabe antes de hablar. Se arma una vez por apertura: el modelo y el norte no cambian a mitad de
 * una conversación. El norte no lleva nada colgando —su tarjeta no tiene hijos—, así que para la empresa tampoco se
 * preguntan ni se escriben.
 */
export function contextoDe(borrador: CicloDraft, pedido: PedidoIa): ChatContext {
  const scope = ALCANCE[pedido.alcance]
  return {
    scope,
    rules: scope === 'empresa' ? { ...borrador.modelRules, children: 'none' } : borrador.modelRules,
    model: borrador.objectiveModel,
    companyObjectives: scope === 'empresa' ? [] : borrador.companyObjectives,
    audienceLabel: pedido.audiencia?.trim() || AUDIENCIA_POR_DEFECTO[pedido.alcance],
    maxCount: Math.max(1, cupoLibre(pedido)),
  }
}

/** El saludo del prototipo, con el nombre de quien escribe en vez del emoji. */
export function saludo(contexto: ChatContext, pedido: PedidoIa): string {
  const base = chatGreeting(contexto, 'set').replace('¡Hola! 👋', `¡Hola, ${NOMBRE_USUARIO}!`)
  if (cupoLibre(pedido) > 0) return base
  return `¡Hola, ${NOMBRE_USUARIO}! Aquí ya hay ${MAX_AI_OBJECTIVES} objetivos, que es el tope. Quita alguno y vuelve a abrirme para proponer otros.`
}

/** Las formas de decir «ya está, sigamos» sin tocar el botón que lo dice. */
export const esSeguir = (texto: string) => ['seguir', 'seguir con estos', 'continuar', 'listo', 'ninguno', 'ya', 'no'].includes(texto.toLowerCase().trim())

/** Lo que se entendió del primer mensaje, para decirlo antes de preguntar lo que falta. */
export function entendido(brief: ParsedBrief, contexto: ChatContext): string[] {
  const partes: string[] = []
  // «Frentes» es la palabra del ciclo de la empresa; para un grupo o una persona son los temas en los que trabaja.
  if (brief.focuses.length > 0) partes.push(`${contexto.scope === 'empresa' ? 'frentes' : 'temas'}: ${brief.focuses.map(focusLabel).join(', ')}`)
  if (brief.count !== null) {
    const vocab = chatVocab(contexto)
    partes.push(`${brief.count} ${(brief.count === 1 ? vocab.objective : vocab.objectives).toLowerCase()}`)
  }
  if (brief.ambition !== null) partes.push(`nivel ${AMBITION_META[brief.ambition].label.toLowerCase()}`)
  return partes
}

/**
 * Lo que la IA dice haber hecho: cuántos, de qué cuelgan y qué llevan debajo. Nombrarlo evita que alguien abra las
 * tarjetas a revisar si hay que completarlas a mano.
 */
export function resumenPropuesta(generados: readonly Objective[], brief: ParsedBrief, contexto: ChatContext): string {
  const vocab = chatVocab(contexto)
  const hijos = chatChildrenVocab(contexto).children
  const partes = [`Acabo de proponer ${generados.length} ${(generados.length === 1 ? vocab.objective : vocab.objectives).toLowerCase()}`]
  const cuantosHijos = generados[0]?.keyActions.length ?? 0
  if (cuantosHijos > 0 && hijos) partes.push(`con ${cuantosHijos} ${hijos.toLowerCase()} cada ${vocab.objective.toLowerCase()}`)
  if (brief.alignedTo.length === 1) partes.push('colgados del objetivo de la empresa que elegiste')
  if (brief.alignedTo.length > 1) partes.push(`repartidos entre los ${brief.alignedTo.length} objetivos de la empresa que elegiste`)
  return `¡Listo! ${partes.join(', ')}. Están en la pantalla principal: échales un vistazo allí.`
}

/** Los de la empresa no llevan peso; los asignados se reparten el peso libre del set (34/33/33). */
export function conPesos(generados: readonly Objective[], pedido: PedidoIa): Objective[] {
  if (pedido.alcance === 'empresa') return generados.map((objetivo) => ({ ...objetivo, weight: 0, alignedTo: [] }))
  const pesos = distributeWeights(generados.length, pedido.pesoLibre ?? 0)
  return generados.map((objetivo, indice) => ({ ...objetivo, weight: pesos[indice] ?? 0 }))
}

/** Valor de las opciones de «Modificar»: cada una cambia una sola cosa del pedido. */
export type Ajuste = 'exigentes' | 'realistas' | 'frentes' | 'mas' | 'menos'

export const PREFIJO_AJUSTE = '__ajuste_'

export const OPCIONES_MODIFICAR: readonly ChatChip[] = [
  { label: 'Metas más exigentes', value: `${PREFIJO_AJUSTE}exigentes` },
  { label: 'Metas más realistas', value: `${PREFIJO_AJUSTE}realistas` },
  { label: 'Cambiar los frentes', value: `${PREFIJO_AJUSTE}frentes` },
  { label: 'Más objetivos', value: `${PREFIJO_AJUSTE}mas` },
  { label: 'Menos objetivos', value: `${PREFIJO_AJUSTE}menos` },
]

const nivel = (actual: AmbitionLevel | null, paso: number): AmbitionLevel => {
  const indice = AMBITION_ORDER.indexOf(actual ?? 'retador')
  return AMBITION_ORDER[Math.min(AMBITION_ORDER.length - 1, Math.max(0, indice + paso))]
}

/**
 * Aplica un ajuste al pedido. En el prototipo cada opción se mandaba como frase al parser, y «Quiero más objetivos» no
 * trae número: la propuesta salía igual. Aquí cada una mueve lo que dice —un nivel de exigencia, un objetivo más o
 * menos, o vuelve a preguntar los frentes— y devuelve qué decir si no se puede.
 */
export function ajustar(brief: ParsedBrief, ajuste: Ajuste, tope: number): { brief: ParsedBrief; aviso?: string } {
  const cuantos = brief.count ?? 1
  switch (ajuste) {
    case 'exigentes':
      return brief.ambition === 'agresivo' ? { brief, aviso: 'Ya están en el nivel más exigente. Te propongo otra versión igual de retadora.' } : { brief: { ...brief, ambition: nivel(brief.ambition, 1) } }
    case 'realistas':
      return brief.ambition === 'conservador' ? { brief, aviso: 'Ya están en el nivel más conservador. Te propongo otra versión igual de alcanzable.' } : { brief: { ...brief, ambition: nivel(brief.ambition, -1) } }
    case 'frentes':
      return { brief: { ...brief, focuses: [] } }
    case 'mas':
      return cuantos >= tope ? { brief, aviso: `${tope} es lo máximo que cabe aquí. Te propongo otra versión con los mismos.` } : { brief: { ...brief, count: cuantos + 1 } }
    case 'menos':
      return cuantos <= 1 ? { brief, aviso: 'Ya es uno solo. Te propongo otra versión.' } : { brief: { ...brief, count: cuantos - 1 } }
  }
}
