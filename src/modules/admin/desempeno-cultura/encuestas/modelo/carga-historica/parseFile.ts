/**
 * Lee un archivo subido y decide su formato: crudo (answers + colaboradores), reporte de gerencia
 * (hojas Clima / Engagement / eNPS) o desconocido. Un archivo ilegible cuenta como desconocido.
 */
import { leerLibro } from '../planilla'
import type { ParsedSurveyFile, SurveyFileFormat } from './types'
import { parseRawFormat, RAW_ANSWERS_SHEET, RAW_ROSTER_SHEET, rawAnswersRows } from './parseRawFormat'
import { parseGerenciaReport } from './parseGerenciaReport'
import { hasSheet, type Workbook } from './sheetUtils'

const GERENCIA_SHEETS = ['Clima', 'Engagement', 'eNPS']

export function detectFormat(workbook: Workbook): SurveyFileFormat {
  if (hasSheet(workbook, RAW_ANSWERS_SHEET) && hasSheet(workbook, RAW_ROSTER_SHEET)) return 'raw'
  if (GERENCIA_SHEETS.some((name) => hasSheet(workbook, name))) return 'gerencia-report'
  // Un .csv con la hoja de respuestas del export crudo, exportada sola.
  if (workbook.length === 1 && rawAnswersRows(workbook)) return 'raw'
  return 'unknown'
}

export function emptyParsedFile(fileName: string): ParsedSurveyFile {
  return {
    fileName,
    format: 'unknown',
    isConsolidatedTotal: false,
    surveyName: null,
    surveyYear: null,
    respondents: null,
    invited: null,
    sections: [],
    questions: [],
    demographics: [],
    favorabilityPositivePct: null,
    enps: null,
    enpsApproxPositivePct: null,
    reportDate: null,
    areaBreakdown: [],
    sectionFavorability: [],
    favorabilityBreakdown: null,
    npsBreakdown: null,
    sectionDetails: [],
    questionDetails: [],
  }
}

/** Parses an already-read workbook. Split from `parseSurveyFile` so it can be tested without a File. */
export function parseWorkbook(fileName: string, workbook: Workbook): ParsedSurveyFile {
  const format = detectFormat(workbook)
  if (format === 'raw') return parseRawFormat(fileName, workbook)
  if (format === 'gerencia-report') return parseGerenciaReport(fileName, workbook)
  return emptyParsedFile(fileName)
}

export async function parseSurveyFile(file: File): Promise<ParsedSurveyFile> {
  let workbook: Workbook
  try {
    workbook = await leerLibro(file)
  } catch {
    return emptyParsedFile(file.name)
  }
  return parseWorkbook(file.name, workbook)
}
