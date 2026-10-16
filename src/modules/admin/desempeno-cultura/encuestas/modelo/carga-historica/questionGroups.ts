/**
 * Agrupa las preguntas detectadas como quedará armada la encuesta (una sección por grupo, más el
 * grupo eNPS y «Sin sección») y deja listos los filtros del resumen. Es la parte sin React de
 * `DetectedQuestionsPanel` del prototipo: el icono de cada grupo pasa a ser una clave semántica que
 * la interfaz traduce a su propio icono.
 */
import { classifyQuestion, questionKind, type QuestionMeta } from './questionTaxonomy'
import type { DetectedSurveyAnalysis } from './types'

export interface ClassifiedQuestion {
  text: string
  section: string | null
  meta: QuestionMeta
}

/** `section`: grupo de una sección detectada o «Sin sección»; `enps`: las preguntas de recomendación sueltas. */
export type QuestionGroupIcon = 'section' | 'enps'

export interface QuestionGroup {
  name: string
  icon: QuestionGroupIcon
  note?: string
  questions: ClassifiedQuestion[]
}

/**
 * Classifies every detected question against the UBITS taxonomy. Uses the questions with their
 * section when the analysis has them, and the bare texts otherwise.
 */
export function classifyQuestions(analysis: Pick<DetectedSurveyAnalysis, 'questionDetails' | 'questions'>): ClassifiedQuestion[] {
  const details = analysis.questionDetails.length > 0 ? analysis.questionDetails : analysis.questions.map((text) => ({ text, section: null }))
  return details.map((detail) => ({ text: detail.text, section: detail.section, meta: classifyQuestion(detail.text) }))
}

/** Splits classified questions into the ones UBITS can build and the ones it can't. */
export function splitRecognized(questions: readonly ClassifiedQuestion[]): { recognized: ClassifiedQuestion[]; unrecognized: ClassifiedQuestion[] } {
  return {
    recognized: questions.filter((question) => question.meta.recognized),
    unrecognized: questions.filter((question) => !question.meta.recognized),
  }
}

/**
 * Groups the recognized questions the way the survey will be built: one group
 * per detected section, plus two special buckets.
 *
 * Section-less NPS items are the eNPS driver, so they get their own group
 * rather than being lumped into "Sin sección". Whatever is left over is a
 * genuinely standalone question that feeds no metric — worth saying out loud.
 */
export function buildQuestionGroups(recognized: ClassifiedQuestion[], sectionNames: string[]): QuestionGroup[] {
  const knownSections = new Set(sectionNames)
  const orphans = recognized.filter((question) => !question.section || !knownSections.has(question.section))
  const npsOrphans = orphans.filter((question) => question.meta.escala === 'NPS')
  const otherOrphans = orphans.filter((question) => question.meta.escala !== 'NPS')

  const groups: QuestionGroup[] = [
    ...sectionNames.map((name) => ({
      name,
      icon: 'section' as const,
      questions: recognized.filter((question) => question.section === name),
    })),
    ...(npsOrphans.length > 0 ? [{ name: 'eNPS', icon: 'enps' as const, questions: npsOrphans }] : []),
    ...(otherOrphans.length > 0
      ? [
          {
            name: 'Sin sección',
            icon: 'section' as const,
            note: 'Estas preguntas no afectan las métricas detectadas: se registran como preguntas independientes.',
            questions: otherOrphans,
          },
        ]
      : []),
  ]
  return groups.filter((group) => group.questions.length > 0)
}

/** Opciones de los dos filtros del panel: por grupo (sección) y por tipo de pregunta. */
export function questionFilterOptions(groups: readonly QuestionGroup[]): { sections: string[]; kinds: string[] } {
  return {
    sections: groups.map((group) => group.name),
    kinds: Array.from(new Set(groups.flatMap((group) => group.questions.map((question) => questionKind(question.meta))))),
  }
}

/** Aplica los filtros («all» = sin filtro). Un filtro que ya no existe en las opciones se ignora. */
export function filterQuestionGroups(groups: readonly QuestionGroup[], sectionFilter: string, kindFilter: string): QuestionGroup[] {
  const { sections, kinds } = questionFilterOptions(groups)
  const activeSection = sectionFilter !== 'all' && sections.includes(sectionFilter) ? sectionFilter : 'all'
  const activeKind = kindFilter !== 'all' && kinds.includes(kindFilter) ? kindFilter : 'all'
  return groups
    .filter((group) => activeSection === 'all' || group.name === activeSection)
    .map((group) => ({
      ...group,
      questions: group.questions.filter((question) => activeKind === 'all' || questionKind(question.meta) === activeKind),
    }))
    .filter((group) => group.questions.length > 0)
}
