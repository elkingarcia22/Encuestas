/**
 * Maps a detected question's text onto the UBITS question taxonomy:
 * tipo de pregunta → (si es escala) tipo de escala → (si es Likert) valoración.
 *
 * Purely presentational — it drives the badges, the grouping and the type
 * filter in the structure summary. Metrics come from the aggregated source,
 * never from this classifier.
 */

export type TipoPregunta = 'Escala de valoración' | 'Pregunta abierta' | 'Opción única' | 'Múltiples respuestas' | 'Desplegable' | 'Sin reconocer'

export type EscalaTipo = 'Likert' | 'NPS' | 'Estrellas' | 'Emociones' | 'Lineal' | 'Likert (NOM 035)'

export type Valoracion = 'Frecuencia' | 'Satisfacción' | 'Acuerdo' | 'Probabilidad' | 'Frecuencia (NOM 035)'

export interface QuestionMeta {
  /** UBITS question type. */
  tipoPregunta: TipoPregunta
  /** Scale family, only for "Escala de valoración". */
  escala?: EscalaTipo
  /** Rating subtype, only for Likert. */
  valoracion?: Valoracion
  /** Whether the question maps to a supported UBITS type at all. */
  recognized: boolean
  /** Human-readable range/detail, e.g. "Muy en desacuerdo a Muy de acuerdo". */
  valor?: string
}

/** Order matters: the most specific cues win. */
export function classifyQuestion(text: string): QuestionMeta {
  const t = text.toLowerCase()
  const has = (...words: string[]) => words.some((w) => t.includes(w))

  // 1. Not a UBITS type at all (matrix / ranking / drag interactions).
  if (has('ordena de mayor', 'ordena las', 'jerarquiza', 'ranking', 'clasifica de mayor', 'arrastra', 'distribuye', 'matriz', 'empareja')) {
    return { tipoPregunta: 'Sin reconocer', recognized: false }
  }
  // 2. NPS (recommendation).
  if (has('recomiend', '0 a 10', '0 a un 10', 'probable es que recomien')) {
    return { tipoPregunta: 'Escala de valoración', escala: 'NPS', recognized: true, valor: '0 a 10' }
  }
  // 3. Visual scales.
  if (has('estrella')) {
    return { tipoPregunta: 'Escala de valoración', escala: 'Estrellas', recognized: true, valor: '1 a 5 estrellas' }
  }
  if (has('cómo te sientes', 'como te sientes', 'emoji', 'carita', 'emoción', 'emocion')) {
    return { tipoPregunta: 'Escala de valoración', escala: 'Emociones', recognized: true, valor: 'Escala visual de emociones' }
  }
  if (has('escala lineal', 'escala de 1 a 7', 'escala del 1 al 7', 'en una escala de 1 a')) {
    return { tipoPregunta: 'Escala de valoración', escala: 'Lineal', recognized: true, valor: 'Escala lineal' }
  }
  // 4. Non-scale question types.
  if (has('comentario', 'describe', 'explica', 'sugerenc', 'cuéntanos', 'cuentanos', 'qué opinas', 'que opinas', 'respuesta abierta', 'en tus palabras')) {
    return { tipoPregunta: 'Pregunta abierta', recognized: true, valor: 'Texto libre' }
  }
  if (has('selecciona todas', 'marca todas', 'las que apliquen', 'todas las que')) {
    return { tipoPregunta: 'Múltiples respuestas', recognized: true, valor: 'Selección múltiple' }
  }
  if (has('elige de la lista', 'lista desplegable', 'desplegable', 'selecciona de la lista')) {
    return { tipoPregunta: 'Desplegable', recognized: true, valor: 'Lista desplegable' }
  }
  if (has('selecciona una', 'elige una', 'selecciona tu', 'elige tu', 'cuál es tu', 'cual es tu', 'indica tu')) {
    return { tipoPregunta: 'Opción única', recognized: true, valor: 'Una opción' }
  }
  // 5. Likert with rating subtype (default for agreement statements).
  if (has('con qué frecuencia', 'con que frecuencia', 'nunca', 'siempre', 'frecuencia')) {
    return { tipoPregunta: 'Escala de valoración', escala: 'Likert', valoracion: 'Frecuencia', recognized: true, valor: 'Nunca a Siempre' }
  }
  if (has('satisfech')) {
    return { tipoPregunta: 'Escala de valoración', escala: 'Likert', valoracion: 'Satisfacción', recognized: true, valor: 'Insatisfecho a Satisfecho' }
  }
  if (has('qué tan probable', 'que tan probable', 'probable')) {
    return { tipoPregunta: 'Escala de valoración', escala: 'Likert', valoracion: 'Probabilidad', recognized: true, valor: 'Nada probable a Muy probable' }
  }
  return { tipoPregunta: 'Escala de valoración', escala: 'Likert', valoracion: 'Acuerdo', recognized: true, valor: 'Muy en desacuerdo a Muy de acuerdo' }
}

/** The most specific label, used for the type filter and for grouping. */
export function questionKind(meta: QuestionMeta): string {
  if (!meta.recognized) return 'Sin reconocer'
  if (meta.tipoPregunta === 'Escala de valoración' && meta.escala) return meta.escala
  return meta.tipoPregunta
}
