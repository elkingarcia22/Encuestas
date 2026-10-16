/**
 * Formato «crudo»: una fila por persona que respondió (`answers`), el catálogo de preguntas
 * (`Dimensions`) y la nómina completa (`colaboradores`). Es el único formato que da la
 * participación exacta y un eNPS real.
 */
import type { Filas } from '../planilla'
import type { NpsBreakdown, ParsedSurveyFile } from './types'
import { cellNumber, cellText, dedupeStrings, extractYear, sheetRows, titleCase, type Workbook } from './sheetUtils'

const RECOMMENDATION_HINTS = ['0 a un 10', '0 a 10', 'probable es que recomiendes']

export const RAW_ANSWERS_SHEET = 'answers'
export const RAW_ROSTER_SHEET = 'colaboradores'
export const RAW_DIMENSIONS_SHEET = 'Dimensions'

/** Las columnas demográficas del export crudo empiezan con `optional_`. */
const DEMOGRAPHIC_COLUMN_PREFIX = 'optional_'

function demographicLabelFromColumn(columnName: string): string {
  return titleCase(columnName.replace(/^optional_/, '').replace(/#list$/, ''))
}

/**
 * Un .csv llega como una sola hoja con el nombre del archivo. Si sus encabezados traen columnas
 * `optional_`, es la hoja `answers` exportada sola: se lee como formato crudo sin nómina ni
 * catálogo (así que sin tasa de participación).
 */
export function looksLikeRawAnswers(rows: Filas): boolean {
  return (rows[0] ?? []).some((header) => cellText(header).startsWith(DEMOGRAPHIC_COLUMN_PREFIX))
}

/** Las filas de respuestas del libro: la hoja `answers` o, en un .csv suelto, su única hoja. */
export function rawAnswersRows(workbook: Workbook): Filas | null {
  const named = sheetRows(workbook, RAW_ANSWERS_SHEET)
  if (named) return named
  const sole = workbook.length === 1 ? workbook[0].filas : null
  return sole && looksLikeRawAnswers(sole) ? sole : null
}

function withoutBlankRows(rows: Filas): Filas {
  return rows.filter((row) => row.some((value) => cellText(value) !== ''))
}

interface EnpsResult {
  enps: number | null
  breakdown: NpsBreakdown | null
}

/** Classifies raw 0-10 recommendation scores into a true eNPS plus its promoter/passive/detractor split. */
function computeEnpsFromScores(rawScores: number[]): EnpsResult {
  const finite = rawScores.filter((s) => Number.isFinite(s))
  if (finite.length === 0) return { enps: null, breakdown: null }

  const min = Math.min(...finite)
  const max = Math.max(...finite)
  // The 0-10 recommendation scale is sometimes exported shifted by one
  // (stored as 1-11 instead of 0-10, with 11 meaning the top score) —
  // detected here and corrected before classifying promoters/detractors.
  const scores = min >= 1 && max === 11 ? finite.map((s) => s - 1) : finite
  if (scores.some((s) => s < 0 || s > 10)) return { enps: null, breakdown: null }

  const total = scores.length
  const promoters = scores.filter((s) => s >= 9).length
  const detractors = scores.filter((s) => s <= 6).length
  const passives = total - promoters - detractors
  const pct = (n: number) => Math.round((n / total) * 1000) / 10

  return {
    enps: Math.round(((promoters - detractors) / total) * 100),
    breakdown: { promotores: pct(promoters), neutrales: pct(passives), detractores: pct(detractors) },
  }
}

/** Busca la pregunta de recomendación en el catálogo y calcula el eNPS con sus puntajes 0-10. */
function enpsFromAnswers(answersRows: Filas, answersHeader: string[], dimensionsRows: Filas): EnpsResult {
  const recommendationRow = dimensionsRows.slice(1).find((row) => RECOMMENDATION_HINTS.some((hint) => cellText(row?.[0]).toLowerCase().includes(hint)))
  if (!recommendationRow) return { enps: null, breakdown: null }

  const colIndex = answersHeader.indexOf(cellText(recommendationRow[1]))
  if (colIndex < 0) return { enps: null, breakdown: null }

  const scores = answersRows
    .slice(1)
    .map((row) => cellNumber(row?.[colIndex]))
    .filter((n) => Number.isFinite(n))
  return computeEnpsFromScores(scores)
}

/**
 * Parses the "raw" export format: one row per respondent (`answers`), a full
 * question catalog (`Dimensions`), and the complete employee roster
 * (`colaboradores`) — the only format that lets us compute exact
 * participation and a true eNPS score.
 */
export function parseRawFormat(fileName: string, workbook: Workbook): ParsedSurveyFile {
  // Las hojas llegan con sus filas vacías en su lugar; aquí cada fila es una persona o una
  // pregunta, así que las vacías se descartan para no contarlas.
  const answersRows = withoutBlankRows(rawAnswersRows(workbook) ?? [])
  const rosterSheet = sheetRows(workbook, RAW_ROSTER_SHEET)
  const colaboradoresRows = rosterSheet ? withoutBlankRows(rosterSheet) : null
  const dimensionsRows = withoutBlankRows(sheetRows(workbook, RAW_DIMENSIONS_SHEET) ?? [])

  const answersHeader = (answersRows[0] ?? []).map(cellText)
  const respondents = Math.max(answersRows.length - 1, 0)
  // Sin la hoja de nómina no se sabe a cuántos se invitó.
  const invited = colaboradoresRows ? Math.max(colaboradoresRows.length - 1, 0) : null

  const demographics = dedupeStrings(answersHeader.filter((col) => col.startsWith(DEMOGRAPHIC_COLUMN_PREFIX)).map(demographicLabelFromColumn))
  const questions = dedupeStrings(dimensionsRows.slice(1).map((row) => cellText(row?.[0])))
  const { enps, breakdown: npsBreakdown } = enpsFromAnswers(answersRows, answersHeader, dimensionsRows)

  return {
    fileName,
    format: 'raw',
    isConsolidatedTotal: false,
    surveyName: null,
    surveyYear: extractYear(fileName),
    respondents,
    invited,
    sections: [],
    questions,
    demographics,
    favorabilityPositivePct: null,
    enps,
    enpsApproxPositivePct: null,
    reportDate: null,
    areaBreakdown: [],
    sectionFavorability: [],
    // The raw export has no aggregated perception splits or dimension map, so
    // favorability and section counts are left to the report files in the batch.
    favorabilityBreakdown: null,
    npsBreakdown,
    sectionDetails: [],
    // No dimension map in the raw export, so questions carry no section here.
    questionDetails: questions.map((text) => ({ text, section: null })),
  }
}
