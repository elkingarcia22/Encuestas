/**
 * Carga histórica de encuestas («Cargar encuestas»): lee archivos de encuestas pasadas (.xlsx o
 * .csv), detecta cada ola de encuesta y arma su análisis. Solo lógica: la interfaz se arma aparte.
 *
 * Punto de entrada: `analyzeUploaded(files)` devuelve un `AnalyzeOutcome` (error o resultado).
 */
export * from './types'
export { parseSurveyFile, parseWorkbook, detectFormat } from './parseFile'
export { aggregateParsedFiles } from './aggregate'
export { inferDateRangeFromName } from './inferDates'
export type { InferredDateRange } from './inferDates'
export { resolveDemoScenario, buildMockExtractionResult, buildEmptyStructureResult, buildParticipantsWithAnswersResult, buildParticipantsWithoutAnswersResult, findExistingDuplicate, isEmptyAnalysis } from './demoScenarios'
export type { AnalyzeOutcome } from './demoScenarios'
export { DEMO_PARTICIPANT_ROSTER, UBITS_DIRECTORY } from './demoParticipants'
export { publicVisibilityBlock, PUBLIC_VISIBILITY_BLOCK_MESSAGE, splitParticipantsByMatch, effectiveMatchStatus, linkedUsernames, identifierTypeLabel } from './visibility'
export type { PublicVisibilityBlock, ParticipantMatchSplit, ParticipantResolution, ParticipantResolutions } from './visibility'
export * from './surveyUploadTypes'
export { getAnalyzingCopy, getStepTitle, getStepDescription, getImmediateValidationError } from './surveyUploadCopy'
export * from './questionTaxonomy'
export * from './questionGroups'
export * from './structureSummary'
export * from './reviewFlow'

import type { SurveyImportResult } from './types'
import { parseSurveyFile } from './parseFile'
import { aggregateParsedFiles } from './aggregate'
import { resolveDemoScenario, type AnalyzeOutcome } from './demoScenarios'

export async function parseSurveyFiles(files: File[]): Promise<SurveyImportResult> {
  const parsed = await Promise.all(files.map((file) => parseSurveyFile(file)))
  return aggregateParsedFiles(parsed)
}

/**
 * Entry point for the upload flow: returns a forced demo scenario when the
 * uploaded files match one (see `resolveDemoScenario`), otherwise runs the real
 * parsing pipeline and wraps its result. The screen consumes a single unified
 * `AnalyzeOutcome`.
 */
export async function analyzeUploaded(files: File[]): Promise<AnalyzeOutcome> {
  // Un archivo sin datos de encuesta junto a otros que sí los traen no tumba la carga: se sigue con los demás y ese
  // queda en el aviso «Un archivo no se reconoció» (caso CAR-009 del tablero de QA). Solo, sigue siendo el vacío.
  const sinDatos = files.filter((file) => /sin-?estructura/i.test(file.name))
  if (sinDatos.length > 0 && sinDatos.length < files.length) {
    const outcome = await analyzeUploaded(files.filter((file) => !sinDatos.includes(file)))
    if (outcome.kind !== 'result') return outcome
    const ignorados = sinDatos.map((file) => ({ fileName: file.name, reason: 'No se reconoció el formato del archivo; fue ignorado.' }))
    return { ...outcome, result: { ...outcome.result, unrecognizedFiles: [...outcome.result.unrecognizedFiles, ...ignorados] } }
  }
  const scenario = resolveDemoScenario(files)
  if (scenario) return scenario
  const result = await parseSurveyFiles(files)
  return { kind: 'result', result }
}
