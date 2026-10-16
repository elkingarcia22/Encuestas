/** Textos del asistente «Cargar encuestas» que dependen del paso o del avance del análisis. */
import type { DetectedSurveyAnalysis } from './types'
import { resolveDemoScenario } from './demoScenarios'
import type { UploadStep } from './surveyUploadTypes'

interface AnalyzingCopy {
  title: string
  status: string
  footer: string
}

/**
 * Builds the loading-overlay copy so it reads like a real multi-step analysis
 * instead of one static line: first reading and identifying the uploaded files
 * (and whether they hold more than one survey), then — once a specific survey
 * has been chosen — matching its structure against UBITS' own model
 * (participación, secciones, favorabilidad, eNPS). Uses the real file count
 * and, once available, the real detected counts, so the copy isn't decorative.
 */
export function getAnalyzingCopy(purpose: 'files' | 'survey', progress: number, filesCount: number, survey: { name: string; analysis: DetectedSurveyAnalysis } | null): AnalyzingCopy {
  if (purpose === 'survey' && survey) {
    const { analysis } = survey
    const status =
      progress < 20
        ? `Abriendo "${survey.name}"...`
        : progress < 45
          ? `Calculando participación${analysis.totalRespondents != null ? ` (${analysis.totalRespondents} respuestas)` : ''}...`
          : progress < 70
            ? `Detectando secciones y preguntas${analysis.sections.length ? ` (${analysis.sections.length} secciones)` : ''}...`
            : progress < 90
              ? 'Haciendo match con la estructura de encuestas de UBITS...'
              : 'Calculando favorabilidad y eNPS...'
    return {
      title: 'Analizando encuesta',
      status,
      footer: 'Estamos preparando el resumen de tu encuesta.',
    }
  }

  const plural = filesCount === 1 ? 'archivo' : 'archivos'
  const status =
    progress < 20
      ? `Abriendo ${filesCount} ${plural}...`
      : progress < 45
        ? 'Leyendo la estructura de cada archivo...'
        : progress < 70
          ? 'Identificando el tipo de encuesta (Clima, Cultura o NPS)...'
          : progress < 90
            ? 'Verificando si hay más de una encuesta en tus archivos...'
            : 'Finalizando análisis...'
  return {
    title: 'Analizando archivos',
    status,
    footer: 'Estamos extrayendo y validando la información de tus encuestas.',
  }
}

/** The drawer's header changes with the step — it is the wizard's only progress cue. */
export function getStepTitle(step: UploadStep): string {
  switch (step) {
    case 'dropzone':
      return 'Cargar encuestas'
    case 'loading':
      return 'Cargando encuesta'
    case 'next-action':
      return 'Carga iniciada'
    case 'error':
      return 'No pudimos continuar'
    case 'empty':
      return 'No encontramos información'
    case 'select':
      return 'Selecciona la encuesta'
    case 'general':
      return 'Confirma los datos generales'
    default:
      return 'Estructura'
  }
}

export function getStepDescription(step: UploadStep): string {
  switch (step) {
    case 'dropzone':
      return 'Sube nuevos archivos o revisa tus cargas recientes.'
    case 'loading':
      return 'Estamos guardando la información de tu encuesta.'
    case 'next-action':
      return 'Tu encuesta se está cargando en segundo plano. Elige cómo quieres continuar.'
    case 'error':
      return 'Revisa el archivo e inténtalo de nuevo.'
    case 'empty':
      return 'No pudimos detectar datos de encuesta en este archivo.'
    case 'select':
      return 'Detectamos varias encuestas en tus archivos. Elige cuál quieres cargar.'
    case 'general':
      return 'Verifica los datos que identificamos y ajústalos si lo necesitas.'
    default:
      return 'Revisa la información que encontramos antes de cargar la encuesta.'
  }
}

/**
 * Catches validation-type problems (e.g. file too large) knowable right when
 * files are picked, so the dropzone rejects them immediately instead of waiting
 * through "analizando archivos". Parse failures genuinely require reading the
 * file, so those still surface after the analysis.
 */
export function getImmediateValidationError(files: File[]): string | null {
  const scenario = resolveDemoScenario(files)
  if (scenario?.kind === 'error' && scenario.variant === 'validation') return scenario.detail
  return null
}
