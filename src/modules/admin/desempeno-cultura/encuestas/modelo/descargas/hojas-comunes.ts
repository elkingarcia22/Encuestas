import { flattenResultSections, sectionResultsForFilters, type SegmentFilter, type SurveyResults } from '../surveyResults'
import type { SurveyDraft } from '../surveyBuilderTypes'
import { bandStyle, blankRow, dataRow, headRow, hintRow, titleRow, type RowSpec, type SheetSpec } from './libro'
import { fechaCorta } from '@/modules/design-system/patrones/formato'

/** Piezas que comparten varios libros de clima: el encabezado de cada hoja y la tabla de preguntas. */

// --- Shared context ----------------------------------------------------------------

export const filterLabelFor = (results: SurveyResults, filters: readonly SegmentFilter[]): string => {
  if (filters.length === 0) return 'Toda la empresa'
  const segment = results.segments.find((candidate) => candidate.key === filters[0].key)
  const labels = filters.map((filter) => segment?.options.find((candidate) => candidate.id === filter.optionId)?.label).filter((label): label is string => Boolean(label))
  return segment && labels.length > 0 ? `${segment.label}: ${labels.join(', ')}` : 'Toda la empresa'
}

/** The "title + context + blank" block every sheet opens with. */
export const sheetIntro = (title: string, draft: SurveyDraft, results: SurveyResults, filters: readonly SegmentFilter[], extra?: string): RowSpec[] => [
  titleRow(title),
  hintRow([draft.name, `Generado el ${fechaCorta(new Date().toLocaleDateString('en-CA'))}`, `Población: ${filterLabelFor(results, filters)}`, ...(extra ? [extra] : [])].join('  ·  ')),
  blankRow,
]

export interface FlatQuestion {
  sectionNumbering: string
  sectionTitle: string
  id: string
  statement: string
  scored: boolean
  n: number
  nsnr: number
  score: number | null
  favorability: number | null
  distribution: readonly number[] | null
}

export const flattenQuestions = (results: SurveyResults, filters: readonly SegmentFilter[]): FlatQuestion[] => {
  const sections = sectionResultsForFilters(results, filters)
  return flattenResultSections(sections).flatMap((section) =>
    section.questions.map((question) => ({
      sectionNumbering: section.numbering,
      sectionTitle: section.title,
      ...question,
    })),
  )
}

export const questionSheet = (results: SurveyResults, filters: readonly SegmentFilter[]): Pick<SheetSpec, 'columns' | 'rows'> => {
  const rows = flattenQuestions(results, filters).map((question, index) =>
    dataRow(index, [
      { value: `${question.sectionNumbering} ${question.sectionTitle}` },
      { value: question.statement },
      { value: question.n },
      { value: question.nsnr },
      { value: question.score, style: question.scored ? bandStyle(question.score) : 'bx' },
      { value: question.favorability },
      ...(question.distribution ?? [null, null, null, null, null]).map((count) => ({ value: count })),
    ]),
  )
  return {
    columns: [190, 380, 70, 55, 80, 100, 95, 85, 60, 70, 90],
    rows: [headRow(['Sección', 'Pregunta', 'Respuestas', 'NS/NR', 'Puntaje (1-5)', 'Favorabilidad (%)', 'Muy desfavorable', 'Desfavorable', 'Neutral', 'Favorable', 'Muy favorable']), ...rows],
  }
}
