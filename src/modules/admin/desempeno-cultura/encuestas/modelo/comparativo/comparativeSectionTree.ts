import { createPublishedSurveyDraft } from '../surveyPreviewMocks'
import { buildSurveyResults, jitter, type QuestionResult, type SectionResult } from '../surveyResults'
import type { SurveyListItem } from '../types'
import { applySeedToCount, applySeedToValue, resolveCell, type CellReading, type ComparativeColumn, type DimensionParticipationPeriod, type DimensionSubmetric } from './comparativeHelpers'

/**
 * El comparativo leído sobre el árbol real del cuestionario — secciones,
 * subsecciones y preguntas—, la misma estructura que el informe de una
 * encuesta y el pulso del home leen con `buildSurveyResults`.
 *
 * Cada medición trae su propio árbol, y dos mediciones del mismo tipo no
 * tienen por qué haber preguntado lo mismo: una sección puede estrenarse en
 * la última ola y otra haberse retirado. Por eso las ramas se cruzan por su
 * título —no por el id, que es distinto en cada encuesta— y el árbol que sale
 * es la unión de todas: el orden lo pone la base, y lo que solo existe en una
 * comparativa entra detrás. Las celdas de las mediciones que no la incluían
 * quedan sin medida, que es justo lo que la tabla dibuja como "Sin Sección".
 */

export type ComparativeNodeKind = 'section' | 'question'

/** Lo que una medición midió en esa rama. */
export interface ComparativeNodeMeasure {
  favorability: number | null
  /** eNPS (-100..100) de la rama. */
  nps: number | null
  /** Positividad de los comentarios de la rama. */
  positivity: number | null
  /** Respuestas que respaldan la favorabilidad/eNPS. */
  n: number
  /** Comentarios que respaldan la positividad. */
  comments: number
}

export interface ComparativeTreeNode {
  key: string
  label: string
  numbering: string
  depth: number
  kind: ComparativeNodeKind
  children: readonly ComparativeTreeNode[]
  /** Por columna (id de encuesta). Ausente = esa medición no la incluía. */
  measures: Readonly<Record<string, ComparativeNodeMeasure>>
}

/** Cruza ramas entre mediciones: mismo título, misma rama, aunque el id y la
 *  posición cambien de una encuesta a otra. */
const branchKey = (parentKey: string, title: string): string => `${parentKey}>${title.trim().toLowerCase()}`

/**
 * eNPS y positividad de comentarios no viven en `SectionResult` —el informe
 * los arma por su cuenta—, así que se derivan del id de la rama con el mismo
 * `jitter` determinista que genera todo lo demás del mock: la misma sección de
 * la misma encuesta siempre devuelve el mismo número, y dos mediciones
 * distintas devuelven números distintos que se pueden comparar.
 */
function derivedMeasures(id: string, favorability: number, n: number) {
  const nps = Math.round(jitter(`${id}:enps`, favorability - 30, 22))
  /* La positividad se mueve con la favorabilidad pero no la calca, y nunca
     toca los extremos: ni una sección sin un solo comentario amable ni otra
     en la que todos lo sean. */
  const positivity = Math.max(8, Math.min(92, Math.round(jitter(`${id}:positivity`, favorability + 6, 12))))
  const comments = Math.max(0, Math.round(jitter(`${id}:comments`, n * 0.22, n * 0.08)))
  return {
    nps: Math.max(-100, Math.min(100, nps)),
    positivity: Math.max(0, Math.min(100, positivity)),
    comments,
  }
}

/**
 * Cuánto se aleja de la base cada ola anterior.
 *
 * La base lee exactamente lo que lee su propio informe —abrir la encuesta y
 * abrir el comparativo tienen que decir lo mismo—, y cada medición anterior se
 * deriva de ella: un escalón de mejora sostenida hacia atrás más un pequeño
 * ruido por rama, para que una sección pueda romper la tendencia del conjunto
 * sin que la tabla entera parezca sorteada.
 */
const DRIFT_PER_WAVE = 1.8

function shiftValue(
  value: number,
  seed: string,
  wave: number,
  min: number,
  max: number,
  /** eNPS se escribe entero, como en la base; los porcentajes con un decimal. */
  decimals: 0 | 1 = 1,
): number {
  const drifted = jitter(seed, value - wave * DRIFT_PER_WAVE, 2.6)
  const factor = decimals === 0 ? 1 : 10
  return Math.max(min, Math.min(max, Math.round(drifted * factor) / factor))
}

function measureOfSection(section: SectionResult, columnId: string, wave: number): ComparativeNodeMeasure {
  const favorability = wave === 0 ? section.favorability : shiftValue(section.favorability, `${section.id}:${columnId}`, wave, 0, 100)
  const derived = derivedMeasures(section.id, favorability, section.n)
  return {
    favorability,
    n: section.n,
    ...derived,
    nps: wave === 0 ? derived.nps : shiftValue(derived.nps, `${section.id}:${columnId}:enps`, wave, -100, 100, 0),
    positivity: wave === 0 ? derived.positivity : shiftValue(derived.positivity, `${section.id}:${columnId}:pos`, wave, 8, 92, 0),
  }
}

function measureOfQuestion(question: QuestionResult, columnId: string, wave: number): ComparativeNodeMeasure {
  const base = question.scored ? question.favorability : null
  const favorability = base === null || wave === 0 ? base : shiftValue(base, `${question.id}:${columnId}`, wave, 0, 100)
  const derived = derivedMeasures(question.id, favorability ?? 0, question.n)
  return {
    favorability,
    n: question.n,
    nps: question.scored ? derived.nps : null,
    positivity: question.scored ? null : derived.positivity,
    comments: question.scored ? 0 : derived.comments,
  }
}

/** Un nodo mientras se arma: los hijos siguen siendo un mapa para poder
 *  fusionar la misma rama desde varias mediciones. */
interface DraftNode {
  key: string
  label: string
  numbering: string
  depth: number
  kind: ComparativeNodeKind
  children: Map<string, DraftNode>
  measures: Record<string, ComparativeNodeMeasure>
}

function upsert(into: Map<string, DraftNode>, key: string, seed: Omit<DraftNode, 'children' | 'measures'>): DraftNode {
  const existing = into.get(key)
  if (existing) return existing
  const created: DraftNode = { ...seed, children: new Map(), measures: {} }
  into.set(key, created)
  return created
}

/** La muestra de una ola contra la de la base: menos invitados, menos
 *  respuestas y menos comentarios detrás del mismo número. */
function scaleSample(measure: ComparativeNodeMeasure, nScale: number): ComparativeNodeMeasure {
  if (nScale === 1) return measure
  return {
    ...measure,
    n: Math.round(measure.n * nScale),
    comments: Math.round(measure.comments * nScale),
  }
}

interface MergeContext {
  columnId: string
  /** 0 es la base; 1, 2… cada medición anterior. */
  wave: number
  /** Cuánto encoge la muestra de esta ola contra la de la base. */
  nScale: number
  includeQuestions: boolean
  /** Las ramas que esta medición sí preguntó (su propio cuestionario). Sin él, todas las de la base. */
  asked?: ReadonlySet<string>
  /** Segunda pasada: solo lo que la medición preguntó y la base no, con su propia lectura y numerado detrás. */
  onlyNew?: boolean
}

/** El siguiente número entre los hermanos del mismo tipo, para lo que solo existe en una comparada. */
const nextNumbering = (siblings: Map<string, DraftNode>, kind: ComparativeNodeKind, parentNumbering: string): string => {
  const position = [...siblings.values()].filter((node) => node.kind === kind).length + 1
  return parentNumbering ? `${parentNumbering}.${position}` : String(position)
}

function mergeSection(into: Map<string, DraftNode>, section: SectionResult, parentKey: string, parentNumbering: string, context: MergeContext): void {
  const key = branchKey(parentKey, section.title)
  // Una rama que esta medición no preguntó se queda sin su medida: la tabla la dibuja «—», «no incluía esta sección».
  if (context.asked && !context.asked.has(key)) return
  const node = upsert(into, key, {
    key,
    label: section.title,
    numbering: context.onlyNew && !into.has(key) ? nextNumbering(into, 'section', parentNumbering) : section.numbering,
    depth: section.depth,
    kind: 'section',
  })
  if (!(context.onlyNew && node.measures[context.columnId])) {
    node.measures[context.columnId] = scaleSample(measureOfSection(section, context.columnId, context.wave), context.nScale)
  }

  if (context.includeQuestions) {
    section.questions.forEach((question, index) => {
      const questionKey = branchKey(key, question.statement)
      if (context.asked && !context.asked.has(questionKey)) return
      const questionNode = upsert(node.children, questionKey, {
        key: questionKey,
        label: question.statement,
        numbering: context.onlyNew && !node.children.has(questionKey) ? nextNumbering(node.children, 'question', node.numbering) : `${section.numbering}.${index + 1}`,
        depth: section.depth + 1,
        kind: 'question',
      })
      if (context.onlyNew && questionNode.measures[context.columnId]) return
      questionNode.measures[context.columnId] = scaleSample(measureOfQuestion(question, context.columnId, context.wave), context.nScale)
    })
  }

  section.children.forEach((child) => mergeSection(node.children, child, key, node.numbering, context))
}

/** Las ramas (secciones y preguntas) de un cuestionario, con la misma clave con que se cruzan. */
function askedKeys(sections: readonly SectionResult[], parentKey = ''): Set<string> {
  const keys = new Set<string>()
  for (const section of sections) {
    const key = branchKey(parentKey, section.title)
    keys.add(key)
    section.questions.forEach((question) => keys.add(branchKey(key, question.statement)))
    askedKeys(section.children, key).forEach((child) => keys.add(child))
  }
  return keys
}

function freeze(nodes: Map<string, DraftNode>): ComparativeTreeNode[] {
  return [...nodes.values()].map((node) => ({
    key: node.key,
    label: node.label,
    numbering: node.numbering,
    depth: node.depth,
    kind: node.kind,
    measures: node.measures,
    children: freeze(node.children),
  }))
}

export interface ComparativeTreeInput {
  columns: readonly ComparativeColumn[]
  /** Las encuestas del comparativo, para recuperar la de cada columna. */
  surveys: readonly SurveyListItem[]
  /** Cuelga cada pregunta de su sección. La pestaña de secciones no las pide. */
  includeQuestions?: boolean
}

/**
 * El árbol que comparten las tres pestañas. La base va primera para que sea
 * ella quien fija el orden y la numeración de las ramas.
 */
export function buildComparativeTree({ columns, surveys, includeQuestions = false }: ComparativeTreeInput): ComparativeTreeNode[] {
  const roots = new Map<string, DraftNode>()
  /* La base primero: es ella quien fija el cuestionario, el orden y la
     numeración de las ramas, y contra ella se derivan las demás olas. */
  const ordered = [...columns].sort((a, b) => Number(b.isBase) - Number(a.isBase))
  const baseSurvey = surveys.find((candidate) => candidate.id === ordered[0]?.id)
  if (!baseSurvey) return []

  const results = buildSurveyResults({
    draft: draftOf(baseSurvey),
    item: baseSurvey,
  })
  const baseParticipants = participantsOf(baseSurvey)

  ordered.forEach((column, wave) => {
    const survey = surveys.find((candidate) => candidate.id === column.id)
    if (!survey) return
    const nScale = baseParticipants === 0 ? 1 : participantsOf(survey) / baseParticipants
    if (wave === 0) {
      results.sections.forEach((section) => mergeSection(roots, section, '', '', { columnId: column.id, wave, nScale, includeQuestions }))
      return
    }
    // Cada comparada con su propio cuestionario: lo que comparte con la base se deriva de ella (como siempre), lo que la
    // base preguntó y ella no queda sin medida, y lo que solo preguntó ella entra detrás con su propia lectura.
    const own = buildSurveyResults({ draft: draftOf(survey), item: survey })
    const asked = askedKeys(own.sections)
    results.sections.forEach((section) => mergeSection(roots, section, '', '', { columnId: column.id, wave, nScale, includeQuestions, asked }))
    own.sections.forEach((section) => mergeSection(roots, section, '', '', { columnId: column.id, wave: 0, nScale: 1, includeQuestions, onlyNew: true }))
  })

  return freeze(roots)
}

const draftOf = (survey: SurveyListItem) => survey.draft ?? createPublishedSurveyDraft(survey)

/**
 * Cuánto comparten las mediciones: las secciones (sin preguntas) del árbol y cuántas tienen medida en todas las
 * columnas. Con `shared === 0` no hay nada que comparar sección por sección.
 */
export function sharedStructure(nodes: readonly ComparativeTreeNode[], columns: readonly ComparativeColumn[]): { total: number; shared: number } {
  const sections = nodes.flatMap(function flatten(node): ComparativeTreeNode[] {
    return node.kind === 'section' ? [node, ...node.children.flatMap(flatten)] : []
  })
  const shared = sections.filter((node) => columns.every((column) => node.measures[column.id] !== undefined)).length
  return { total: sections.length, shared }
}

const participantsOf = (survey: SurveyListItem): number => Number.parseInt(String(survey.participants), 10) || 0

/** Las ramas que una tabla puede filtrar: las secciones raíz del árbol. */
export function rootLabels(nodes: readonly ComparativeTreeNode[]): string[] {
  return nodes.map((node) => node.label)
}

/** Qué número de la rama lee cada pestaña. */
export type ComparativeTreeMetric = DimensionSubmetric | 'positividad'

export interface TreeReadingInput {
  node: ComparativeTreeNode
  column: ComparativeColumn
  metric: ComparativeTreeMetric
  filterSeedValue?: number
  /** La escalera `[base, p1..p4]` de participación de este comparativo. */
  participationByPeriod?: readonly DimensionParticipationPeriod[]
}

/**
 * Una celda del árbol. La participación no se lee de la rama —es una tasa de
 * toda la encuesta, la misma para cualquier sección—, así que sale de la
 * escalera del comparativo; las demás salen de lo que esa medición midió en
 * esa rama, y una rama que no existía en ella se queda sin medida.
 */
export function treeNodeReading({ node, column, metric, filterSeedValue = 0, participationByPeriod }: TreeReadingInput): CellReading {
  if (metric === 'participacion') {
    const index = column.dataKey === 'currentScore' ? 0 : Number(column.dataKey.slice(1))
    const period = participationByPeriod?.[index]
    if (!period || !node.measures[column.id]) return { state: 'not-measured', value: null, n: null }
    const reading = resolveCell(true, period.participation, period.invited)
    if (reading.state !== 'ok') return reading
    return {
      state: 'ok',
      value: applySeedToValue(reading.value as number, filterSeedValue, 0, 100),
      n: applySeedToCount(reading.n as number, filterSeedValue),
    }
  }

  const measure = node.measures[column.id]
  if (!measure) return { state: 'not-measured', value: null, n: null }

  const value = metric === 'nps' ? measure.nps : metric === 'positividad' ? measure.positivity : measure.favorability
  const n = metric === 'positividad' ? measure.comments : measure.n

  const reading = resolveCell(true, value, n)
  if (reading.state !== 'ok') return reading
  return {
    state: 'ok',
    value: applySeedToValue(reading.value as number, filterSeedValue, metric === 'nps' ? -100 : 0, 100),
    n: applySeedToCount(reading.n as number, filterSeedValue),
  }
}

/** Todas las claves de un subárbol, para abrir o cerrar una rama entera. */
export function branchKeys(node: ComparativeTreeNode): string[] {
  return [node.key, ...node.children.flatMap(branchKeys)]
}
