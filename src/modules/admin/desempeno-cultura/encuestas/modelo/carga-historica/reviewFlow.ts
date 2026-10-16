/**
 * Reglas del asistente «Cargar encuestas» que no dependen de React: cómo se arma cada encuesta a
 * revisar cuando termina el análisis, qué la deja avanzar y qué fila se agrega al listado cuando
 * empieza su carga. Salen del hook `useSurveyUploadFlow` del prototipo, que no se porta.
 */
import type { SurveyListItem } from '../types'
import type { AnalyzeOutcome } from './demoScenarios'
import { isEmptyAnalysis } from './demoScenarios'
import type { SurveyImportResult } from './types'
import { publicVisibilityBlock } from './visibility'
import { formatShortDate, type SurveyReviewItem, type UploadStep, type UploadTaskState } from './surveyUploadTypes'

/** Filenames that script a mid-load failure, for the demo. */
export const FAILING_LOAD_FILE = /falla-carga|error-carga/i

/** Pasos con trabajo del usuario encima: cerrar aquí pide confirmación. */
export const STEPS_WITH_PENDING_WORK: UploadStep[] = ['general', 'summary']

/** Umbral de anonimato con el que arranca cada encuesta. */
export const DEFAULT_ANONYMITY_THRESHOLD = '5'

/** Sin datos: el tipo de encuesta de la fila cuando nadie lo eligió. */
const FALLBACK_SURVEY_TYPE = 'Clima'

/**
 * What the flow shows when the parsing pipeline itself throws: a blocking
 * error rather than silently pretending zero surveys were found.
 */
export const PARSE_FAILURE_OUTCOME: AnalyzeOutcome = {
  kind: 'error',
  variant: 'parse',
  title: 'No pudimos procesar el archivo',
  detail: 'Ocurrió un problema al leer el contenido. Revisa que el archivo sea un reporte válido e inténtalo de nuevo.',
}

/**
 * One review item per detected survey. Public only when the files tie each
 * participant to their own answers; otherwise anonymous is the only option.
 * The type is never pre-filled: the user must pick it.
 */
export function buildReviewItems(result: SurveyImportResult): SurveyReviewItem[] {
  return result.groups.map((group) => ({
    groupKey: group.groupKey,
    name: group.suggestedSurveyName,
    type: '',
    visibility: publicVisibilityBlock(group.analysis) == null ? 'publica' : 'anonima',
    anonymityThreshold: DEFAULT_ANONYMITY_THRESHOLD,
    startDate: group.suggestedStartDate ?? undefined,
    endDate: group.suggestedEndDate ?? undefined,
    fileNames: group.fileNames,
    analysis: group.analysis,
  }))
}

/**
 * Where the wizard goes once the files are read. A single survey with nothing
 * usable inside → dedicated empty state, instead of a summary full of zeros.
 */
export function stepAfterAnalysis(outcome: AnalyzeOutcome): UploadStep {
  if (outcome.kind === 'error') return 'error'
  const groups = outcome.result.groups
  if (groups.length === 1 && isEmptyAnalysis(groups[0].analysis)) return 'empty'
  return groups.length === 1 ? 'general' : 'select'
}

/** The anonymity threshold must be a whole number, 1 or more. */
export function isAnonymityThresholdValid(item: Pick<SurveyReviewItem, 'anonymityThreshold'> | null): boolean {
  if (!item) return true
  const value = Number(item.anonymityThreshold)
  return item.anonymityThreshold.trim() !== '' && Number.isInteger(value) && value >= 1
}

export function isDateRangeValid(item: Pick<SurveyReviewItem, 'startDate' | 'endDate'> | null): boolean {
  return !item?.startDate || !item?.endDate || item.startDate <= item.endDate
}

/**
 * "Datos generales" lets you continue with a name, a type, both dates in order
 * and a valid threshold. A duplicate name is checked apart, on submit (see
 * `findExistingDuplicate`), so the button stays enabled.
 */
export function canProceedFromGeneral(item: SurveyReviewItem | null): boolean {
  return !!item && !!item.name.trim() && !!item.type && !!item.startDate && !!item.endDate && isDateRangeValid(item) && isAnonymityThresholdValid(item)
}

/** Surveys from this batch still waiting to be loaded. */
export function pendingReviewItems(items: readonly SurveyReviewItem[], loadedGroupKeys: readonly string[]): SurveyReviewItem[] {
  return items.filter((item) => !loadedGroupKeys.includes(item.groupKey))
}

/** Demo scenario: a specific filename makes the load fail part-way. */
export function willLoadFail(item: Pick<SurveyReviewItem, 'fileNames'>): boolean {
  return item.fileNames.some((name) => FAILING_LOAD_FILE.test(name))
}

/** Texto del botón para volver, según el paso y si ya se cargó algo de este lote. */
export function backLabel(step: UploadStep, hasLoadedFromBatch: boolean): string {
  if (step === 'summary') return 'Volver'
  return hasLoadedFromBatch ? 'Volver a las opciones' : 'Volver a la carga de archivos'
}

/**
 * The row added to the survey list the moment a load starts, tagged as
 * external. It mirrors the load's progress through `uploadTaskId`.
 */
export function buildQueuedSurveyRow(item: SurveyReviewItem, taskId: number): SurveyListItem {
  return {
    id: `up-${taskId}`,
    name: item.name,
    type: item.type || FALLBACK_SURVEY_TYPE,
    status: 'Cargando',
    statusVariant: 'info',
    startDate: formatShortDate(item.startDate),
    endDate: formatShortDate(item.endDate),
    participants: String(item.analysis.totalRespondents ?? 0),
    progress: 0,
    origin: 'externa',
    uploadTaskId: taskId,
  }
}

/**
 * The row's fields while its load runs, once it finishes («Finalizado») or
 * when it fails («Con error»). Apply them to the row whose `uploadTaskId`
 * matches, so the list tells the same story as the tray.
 */
export function queuedRowProgress(progress: number, status: UploadTaskState['status']): Pick<SurveyListItem, 'progress' | 'status' | 'statusVariant'> {
  if (status === 'completed') return { progress: 100, status: 'Finalizado', statusVariant: 'positive' }
  if (status === 'failed') return { progress, status: 'Con error', statusVariant: 'negative' }
  return { progress, status: 'Cargando', statusVariant: 'info' }
}
