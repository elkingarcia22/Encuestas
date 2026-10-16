import type { SurveyListItem } from '../types'
import type { DimensionWithBreakdown } from './datos-desglose'
import type { ResponseSegment } from '../types'
import { SENTIMENT_LABELS } from '../sentimiento'

/**
 * Shared derivations for the comparative dashboard: which surveys are being
 * compared, in what order their columns render, and how a single cell reads
 * when the underlying mock row is missing, empty, or below the anonymity
 * threshold.
 */

// --- Chronological ordering ---------------------------------------------

const MONTH_MAP: Record<string, number> = {
  ene: 1,
  feb: 2,
  mar: 3,
  abr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dic: 12,
}

/**
 * A rough "how recent is this measurement" score parsed out of its name and
 * start date — year and quarter first, month as a fallback for surveys (like
 * Cultura's) that only carry a year. Copied verbatim from the wizard's own
 * sort in `EncuestasDashboard.tsx` so the two screens agree on order.
 */
export function getSurveyScore(item: Pick<SurveyListItem, 'name' | 'startDate'>): number {
  const yearMatch = item.name.match(/202\d/)
  const year = yearMatch ? parseInt(yearMatch[0], 10) : 0

  const quarterMatch = item.name.match(/Q(\d)/)
  const quarter = quarterMatch ? parseInt(quarterMatch[1], 10) : 0

  const monthStr = item.startDate?.split(' ')[1]?.toLowerCase()
  const month = monthStr ? MONTH_MAP[monthStr] || 0 : 0

  return year * 1000 + quarter * 100 + month
}

export function sortByRecency<T extends Pick<SurveyListItem, 'name' | 'startDate'>>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => getSurveyScore(b) - getSurveyScore(a))
}

// --- Columns --------------------------------------------------------------

export type ComparativeDataKey = 'currentScore' | 'p1' | 'p2' | 'p3' | 'p4'

export interface ComparativeColumn {
  id: string
  label: string
  shortLabel: string
  isBase: boolean
  dataKey: ComparativeDataKey
}

/** Trims a leading "Clima Organizacional - " / "Cultura y Valores - " prefix
 *  so the column header reads as just "Q1 2026" rather than the full name. */
function shortenSurveyName(name: string): string {
  const afterDash = name.split(' - ')[1] ?? name.split(' – ')[1]
  return (afterDash ?? name).trim()
}

/**
 * The base always keys its mock row as `currentScore`; every other selected
 * survey keys as `p1`, `p2`, … in order of how recent it is — the same
 * convention every `COMPARATIVE_*`/`CULTURA_*` mock array documents at its
 * own top ("Generic Keys for dynamic mapping").
 */
export function buildColumns(baseSurvey: SurveyListItem, comparisonSurveys: readonly SurveyListItem[]): ComparativeColumn[] {
  const comparisonsByRecency = sortByRecency(comparisonSurveys)
  const dataKeyById = new Map<string, ComparativeDataKey>()
  dataKeyById.set(baseSurvey.id, 'currentScore')
  comparisonsByRecency.forEach((survey, index) => {
    dataKeyById.set(survey.id, `p${index + 1}` as ComparativeDataKey)
  })

  const all = sortByRecency([baseSurvey, ...comparisonSurveys])
  return all.map((survey) => ({
    id: survey.id,
    label: survey.name,
    shortLabel: shortenSurveyName(survey.name),
    isBase: survey.id === baseSurvey.id,
    dataKey: dataKeyById.get(survey.id) ?? 'currentScore',
  }))
}

// --- Cell states ------------------------------------------------------------

/**
 * How a single comparative cell reads, once we know whether the mock row
 * even carries this column's key, whether it holds a value, and how many
 * responses back it.
 */
export type CellState = 'ok' | 'private' | 'empty' | 'not-measured' | 'no-data'

export interface CellReading {
  state: CellState
  value: number | null
  n: number | null
}

/** Minimum responses a group needs before its value can be shown at all —
 *  the same anonymity idea `anonymityGuard.ts` applies to survey results,
 *  mirrored here for a comparative cell instead of a whole report. */
export const ANONYMITY_THRESHOLD = 5

/**
 * Resolves one cell's state from its raw mock value.
 *
 * @param keyPresent Whether the survey's mock row even has this column's key
 *   (`p3` in a row that only defines `p1`/`p2` means the dimension/question
 *   simply wasn't part of that measurement's design).
 * @param value The raw value at that key — `undefined`/`null` both read as
 *   "no usable number", but only `null` means "measured, came back empty".
 * @param n Response count backing this cell, when known.
 */
export function resolveCell(keyPresent: boolean, value: number | null | undefined, n: number | null | undefined): CellReading {
  if (!keyPresent || value === undefined) {
    return { state: 'not-measured', value: null, n: n ?? null }
  }
  if (n !== undefined && n !== null && n > 0 && n < ANONYMITY_THRESHOLD) {
    return { state: 'private', value: null, n }
  }
  if (n === 0 || (value === null && n !== undefined && n !== null)) {
    return { state: 'empty', value: null, n: n ?? 0 }
  }
  if (value === null) {
    return { state: 'no-data', value: null, n: n ?? null }
  }
  return { state: 'ok', value, n: n ?? null }
}

/** Tooltip copy per state, matching whichever surface is asking. */
export const CELL_TOOLTIPS = {
  private: 'Esta información es privada porque no se alcanzó el umbral mínimo de respuestas necesarias para garantizar el anonimato.',
  emptyDimension: 'Esta encuesta no tiene respuestas por los filtros que estás aplicando.',
  emptyComments: 'Esta sección no tiene comentarios por los filtros que estás aplicando.',
  emptyHeatmap: 'Este segmento no tiene respuestas por los filtros que estás aplicando.',
  notMeasuredDimension: 'Esta sección no formaba parte del diseño de esta medición específica.',
  notMeasuredQuestion: 'Esta pregunta no fue incluida en el diseño de esta medición específica.',
  notMeasuredComments: 'Esta sección no fue evaluada en esta encuesta, por lo que no existen comentarios.',
  noDataDimension: 'No se registraron respuestas suficientes para esta sección en este periodo.',
  noDataQuestion: 'No se registraron respuestas suficientes para esta pregunta en este periodo.',
} as const

// --- Delta tone -------------------------------------------------------------

/** Cultura's "sin variación relevante" rule: a delta under 0.1pp reads as
 *  neutral rather than a very small up/down, on every surface that shows a
 *  delta pill. */
export function deltaTone(delta: number | null | undefined): 'positive' | 'negative' | 'neutral' {
  if (delta === null || delta === undefined || Math.abs(delta) < 0.1) return 'neutral'
  return delta > 0 ? 'positive' : 'negative'
}

export function deltaDirection(delta: number | null | undefined): 'up' | 'down' | 'flat' {
  if (delta === null || delta === undefined || Math.abs(delta) < 0.1) return 'flat'
  return delta > 0 ? 'up' : 'down'
}

/**
 * El eje del "Personalizar" de Secciones y Comentarios: subió, bajó, se
 * mantuvo o no hay con qué comparar esa celda —base, privada, sin medir o
 * sin respuestas—. Se separa de `deltaDirection` porque ahí un delta
 * ausente se lee "flat" (sin variación), y aquí tiene que leerse como su
 * propia banda en vez de confundirse con "se mantuvo".
 */
export type DeltaBandId = 'up' | 'down' | 'flat' | 'null'

export function deltaBandId(delta: number | null | undefined): DeltaBandId {
  if (delta === null || delta === undefined) return 'null'
  return deltaDirection(delta)
}

/**
 * Cuánto separa a esa encuesta de la base, leído sobre las celdas ya
 * resueltas —con el desplazamiento de los filtros incluido— y no sobre el
 * número crudo del mock, para que la píldora diga exactamente la distancia
 * entre los dos números que se ven en la fila.
 *
 * `undefined` cuando a alguna de las dos le falta número: una celda privada,
 * vacía o no medida no tiene contra qué comparar, y la columna base nunca
 * lleva píldora.
 */
export function deltaAgainstBase(reading: CellReading, baseReading: CellReading | null | undefined): number | undefined {
  if (!baseReading) return undefined
  if (reading.state !== 'ok' || baseReading.state !== 'ok') return undefined
  if (reading.value === null || baseReading.value === null) return undefined
  return Math.round((reading.value - baseReading.value) * 10) / 10
}

// --- Deterministic filter shift ---------------------------------------------

/**
 * A small, deterministic offset derived from the active filters — same
 * filters always produce the same shift, so switching tabs or re-rendering
 * never flickers, but picking a demographic still visibly moves the numbers.
 * Not a real backend recompute (there is no backend), just enough signal to
 * make the filters feel connected to the tab they're scoped to.
 */
export function filterSeed(filterKeys: readonly string[]): number {
  if (filterKeys.length === 0) return 0
  const joined = filterKeys.slice().sort().join('|')
  let hash = 0
  for (let i = 0; i < joined.length; i += 1) {
    hash = (hash * 31 + joined.charCodeAt(i)) % 10_000
  }
  return hash
}

/** Applies a filter seed to a base value, clamped to a plausible range. */
export function applySeedToValue(value: number, seed: number, min = 0, max = 100): number {
  if (seed === 0) return value
  const shift = ((seed % 21) - 10) * 0.6 // -6..+6, deterministic
  return Math.max(min, Math.min(max, Math.round((value + shift) * 10) / 10))
}

/** Applies a filter seed to a response count, never letting it collapse a
 *  real number to zero on its own. */
export function applySeedToCount(n: number, seed: number): number {
  if (seed === 0) return n
  const factor = 0.55 + (seed % 46) / 100 // 0.55..1.0
  return Math.max(1, Math.round(n * factor))
}

// --- Dimension table cells ---------------------------------------------------

export type DimensionSubmetric = 'favorabilidad' | 'nps' | 'participacion'

/** One survey wave's participation, same `[base, p1, p2, p3, p4]` ladder as
 *  `favorabilidadByPeriod`/`npsByPeriod` — sourced from the comparative's own
 *  KPI data (`COMPARATIVE_PARTICIPATION_DATA`/`CULTURA_PARTICIPATION_DATA`)
 *  since participation is a survey-wide rate, not something that varies by
 *  dimension. */
export interface DimensionParticipationPeriod {
  participation: number
  invited: number
}

/** `p1`/`p2`/… as an index into `favorabilidadByPeriod`/`npsByPeriod` — index
 *  0 is always `currentScore`, same convention as the KPI cards. */
function periodIndex(dataKey: ComparativeDataKey): number {
  return dataKey === 'currentScore' ? 0 : Number(dataKey.slice(1))
}

/**
 * One dimension-table cell, for whichever sub-metric is selected.
 * Favorabilidad/nps read the row's own period-indexed breakdown; participación
 * reads the comparative's survey-wide participation ladder instead, since
 * participation doesn't split by dimension.
 */
export function dimensionCellReading(row: DimensionWithBreakdown, column: ComparativeColumn, submetric: DimensionSubmetric, filterSeedValue = 0, participationByPeriod?: readonly DimensionParticipationPeriod[]): CellReading {
  const index = periodIndex(column.dataKey)

  if (submetric === 'participacion') {
    const period = participationByPeriod?.[index]
    if (!period) return { state: 'not-measured', value: null, n: null }
    const reading = resolveCell(true, period.participation, period.invited)
    if (reading.state !== 'ok') return reading
    return {
      state: 'ok',
      value: applySeedToValue(reading.value as number, filterSeedValue, 0, 100),
      n: applySeedToCount(reading.n as number, filterSeedValue),
    }
  }

  let totalN: number
  let value: number
  if (submetric === 'favorabilidad') {
    const period = row.favorabilidadByPeriod[index]
    if (!period) return { state: 'not-measured', value: null, n: null }
    totalN = period.favorableCount + period.neutralCount + period.desfavorableCount
    value = period.favorable
  } else {
    const period = row.npsByPeriod[index]
    if (!period) return { state: 'not-measured', value: null, n: null }
    totalN = period.promotersCount + period.passivesCount + period.detractorsCount
    value = period.promoters - period.detractors
  }

  const reading = resolveCell(true, value, totalN)
  if (reading.state !== 'ok') return reading
  return {
    state: 'ok',
    value: applySeedToValue(reading.value as number, filterSeedValue, submetric === 'nps' ? -100 : 0, 100),
    n: applySeedToCount(reading.n as number, filterSeedValue),
  }
}

// --- Sentiment rows (Comentarios tab) ---------------------------------------

export interface SentimentPeriod {
  positive: number
  neutral: number
  negative: number
  total: number
}

/**
 * `COMPARATIVE_SENTIMENT_DATA` keys its periods as fixed quarter labels
 * (`q4_2024`..`q4_2023`) while `CULTURA_SENTIMENT_DATA` already uses the
 * generic `currentScore`/`p1`..`p4` ladder every other comparative mock
 * uses. Both describe the same thing — five slots, newest first — so this
 * reads either shape into one array indexed the generic way.
 */
export function normalizeSentimentPeriods(row: Record<string, unknown>): (SentimentPeriod | null | undefined)[] {
  if ('currentScore' in row) {
    return ['currentScore', 'p1', 'p2', 'p3', 'p4'].map((key) => row[key] as SentimentPeriod | null | undefined)
  }
  return ['q4_2024', 'q3_2024', 'q2_2024', 'q1_2024', 'q4_2023'].map((key) => (row[key] as SentimentPeriod | undefined) ?? undefined)
}

/**
 * Los tres tramos de un periodo como segmentos de la barra apilada, con los
 * tonos de la escala de sentimiento del informe (positivo, advertencia,
 * negativo); la pantalla los traduce a los tokens del tema. El tono `neutral`
 * del kit pinta gris, y el gris está reservado para NS/NR: un comentario
 * neutral no es una omisión, es una posición.
 *
 * Cada tramo viaja con su `percentage` además de su valor: los tres son un
 * reparto que cierra en 100, y sin ese dato la barra los mediría contra el
 * número de comentarios —320 comentarios, un tramo de 65— y dejaría el resto
 * del riel en blanco, como si faltara algo por contar.
 */
export function sentimentSegments(period: SentimentPeriod): ResponseSegment[] {
  const split = period.positive + period.neutral + period.negative
  return (['positive', 'neutral', 'negative'] as const).map((id) => ({
    id,
    label: SENTIMENT_LABELS[id].label,
    value: period[id],
    percentage: split > 0 ? (period[id] / split) * 100 : 0,
    tone: id === 'neutral' ? ('warning' as const) : id,
  }))
}

/**
 * Una celda de la tabla de comentarios: qué tan positivos son los comentarios
 * de esa dimensión en esa encuesta —la proporción del tramo verde de su
 * distribución— y cuántos comentarios hay detrás.
 *
 * Devuelve la misma `CellReading` que una celda de dimensión, así que
 * "privado", "sin comentarios" y "sin dimensión" se pintan igual en las tres
 * tablas del comparativo. La distribución completa —positivos, neutrales,
 * negativos— vive en el drawer que abre la fila, donde hay sitio para leerla
 * junto a los comentarios.
 */
export function sentimentCellReading(row: Record<string, unknown>, column: ComparativeColumn, filterSeedValue = 0): CellReading {
  const period = normalizeSentimentPeriods(row)[periodIndex(column.dataKey)]
  if (period === undefined) return { state: 'not-measured', value: null, n: null }

  const total = period === null ? 0 : period.total
  const n = total === 0 ? 0 : applySeedToCount(total, filterSeedValue)
  // Los tres tramos vienen como reparto del 100% de los comentarios de esa
  // dimensión, no como conteos: la positividad es el tramo verde de ese
  // reparto, y `total` es cuántos comentarios lo respaldan. Se divide por la
  // suma de los tres en vez de leer `positive` directo para que el número siga
  // siendo un porcentaje aunque un periodo no cierre exactamente en 100.
  const split = period === null ? 0 : period.positive + period.neutral + period.negative
  const value = period !== null && total > 0 && split > 0 ? (period.positive / split) * 100 : null

  const reading = resolveCell(true, value, n)
  if (reading.state !== 'ok') return reading
  return {
    state: 'ok',
    // Positividad se lee en enteros: un 64,8% de comentarios positivos sobre
    // 210 comentarios no dice nada que un 65% no diga ya.
    value: Math.round(applySeedToValue(reading.value as number, filterSeedValue)),
    n: reading.n,
  }
}
