import type { SurveyDraft } from '../surveyBuilderTypes'
import { flattenResultSections, participationBySegment, sectionResultsForFilters, type NpsBand, type NpsSectionDetail, type NpsSegmentRow, type SegmentFilter, type SurveyResults } from '../surveyResults'
import { buildQuestionBreakdowns } from '../questionResponses'
import { buildSurveyAnalysis, type InsightKind } from '../surveyInsights'
import { NPS_BAND_LABELS, flattenNpsDepth, npsDepthBySection, npsDepthTotals } from '../npsDepth'
import { bandStyle, blankRow, dataRow, headRow, npsScoreStyle, share, type RowSpec, type SheetSpec, type StyleId } from './libro'
import { sheetIntro } from './hojas-comunes'

/** Las hojas del libro «Resultados generales» que no son el Resumen. */

export const NPS_HEAD = ['Dimensión / pregunta', 'Nivel', 'eNPS', 'Promotores', 'Pasivos', 'Detractores', '% Promotores', '% Detractores', 'Respuestas'] as const

export const NPS_COLUMNS = [330, 70, 60, 80, 70, 80, 90, 90, 80] as const

/** The eNPS outline flattened: every dimension followed by its own questions. */
export const npsDetailRows = (details: readonly NpsSectionDetail[]): RowSpec[] => {
  const rows: RowSpec[] = []

  const push = (label: string, depth: number, level: 'Sección' | 'Pregunta', data: { score: number; promoters: number; passives: number; detractors: number; n: number }) => {
    rows.push(
      dataRow(rows.length, [
        {
          value: `${'    '.repeat(depth)}${label}`,
          style: level === 'Sección' && depth === 0 ? 'label' : undefined,
        },
        { value: level },
        { value: data.score, style: npsScoreStyle(data.score) },
        { value: data.promoters },
        { value: data.passives },
        { value: data.detractors },
        { value: share(data.promoters, data.n) },
        { value: share(data.detractors, data.n) },
        { value: data.n },
      ]),
    )
  }

  const walk = (sections: readonly NpsSectionDetail[]) => {
    for (const section of sections) {
      push(`${section.numbering} ${section.title}`, section.depth, 'Sección', section)
      for (const question of section.questions) {
        push(question.text, section.depth + 1, 'Pregunta', question)
      }
      walk(section.children)
    }
  }

  walk(details)
  return rows
}

/** The eNPS grid flattened: total, then every dimension and its questions. */
export const npsSegmentRows = (rows: readonly NpsSegmentRow[], depth: number): RowSpec[] => {
  const flat: RowSpec[] = []

  const cellsOf = (row: NpsSegmentRow) => row.cells.map((cell) => (cell === null || cell.belowThreshold ? { value: 'Reservado' as const, style: 'bx' as const } : { value: cell.score, style: npsScoreStyle(cell.score) }))

  const walk = (current: readonly NpsSegmentRow[], level: number) => {
    for (const row of current) {
      flat.push(
        dataRow(flat.length, [
          {
            value: `${'    '.repeat(level)}${row.title}`,
            style: row.kind !== 'question' && level === 0 ? 'label' : undefined,
          },
          {
            value: row.total.n > 0 ? row.total.score : null,
            style: row.total.n > 0 ? npsScoreStyle(row.total.score) : 'bx',
          },
          ...cellsOf(row),
        ]),
      )
      walk(row.questions ?? [], level + 1)
      walk(row.children ?? [], level + 1)
    }
  }

  walk(rows, depth)
  return flat
}

/**
 * Detalle de preguntas: one row per answer option, every format included.
 *
 * The "Preguntas" sheet only speaks the 1–5 scale, so a single-choice or
 * multiple-answer question shows up there as an empty distribution. This is the
 * tally the Preguntas tab renders — what each option was actually picked by —
 * in the tidy shape a spreadsheet can pivot: the question repeats on every one
 * of its option rows rather than being a merged header nothing can filter by.
 */
export const questionDetailSheet = (draft: SurveyDraft, results: SurveyResults, filters: readonly SegmentFilter[]): Pick<SheetSpec, 'columns' | 'rows'> => {
  const sections = sectionResultsForFilters(results, filters)
  const breakdowns = buildQuestionBreakdowns(draft, { ...results, sections })
  const rows: RowSpec[] = []

  for (const section of flattenResultSections(sections)) {
    for (const question of section.questions) {
      const breakdown = breakdowns.get(question.id)
      if (!breakdown) continue

      const context = [{ value: `${section.numbering} ${section.title}` }, { value: breakdown.statement }, { value: breakdown.formatLabel }]
      const metrics = [{ value: breakdown.score }, { value: breakdown.favorability }]

      if (breakdown.tallies.length === 0) {
        rows.push(dataRow(rows.length, [...context, { value: 'Respuestas escritas' }, { value: breakdown.commentCount }, { value: breakdown.commentCount > 0 ? 100 : null }, ...metrics]))
        continue
      }

      for (const tally of breakdown.tallies) {
        rows.push(
          dataRow(rows.length, [
            ...context,
            {
              value: tally.label,
              style: tally.isNsNr ? 'bx' : tally.bandIndex === null ? undefined : bandStyle(tally.bandIndex + 1),
            },
            { value: tally.count },
            { value: tally.percentage },
            ...metrics,
          ]),
        )
      }
    }
  }

  return {
    columns: [190, 340, 150, 210, 85, 80, 85, 105],
    rows: [headRow(['Sección', 'Pregunta', 'Formato', 'Opción de respuesta', 'Respuestas', '% del total', 'Puntaje pregunta (1-5)', 'Favorabilidad pregunta (%)']), ...rows],
  }
}

const INSIGHT_KIND_LABELS: Readonly<Record<InsightKind, string>> = {
  finding: 'Hallazgo',
  risk: 'Riesgo',
  recommendation: 'Acción sugerida',
}

const CONFIDENCE_LABELS: Readonly<Record<'low' | 'medium' | 'high', { label: string; style: StyleId }>> = {
  high: { label: 'Alta', style: 'pos' },
  medium: { label: 'Media', style: 'neu' },
  low: { label: 'Baja', style: 'neg' },
}

/** Análisis IA: the same reading the tab shows, claim by claim with its figure. */
export const aiAnalysisSheet = (draft: SurveyDraft, results: SurveyResults, filters: readonly SegmentFilter[]): SheetSpec => {
  const sections = sectionResultsForFilters(results, filters)
  const analysis = buildSurveyAnalysis({ ...results, sections })

  return {
    name: 'Análisis IA',
    columns: [110, 300, 470, 300, 95],
    rows: [
      ...sheetIntro('Lectura de la IA', draft, results, filters, 'Generada a partir de los resultados de esta medición'),
      { cells: [{ value: 'Resumen general', style: 'label' }], height: 18 },
      {
        cells: [{ value: analysis.summary, style: 'wrap' }],
        autoFitHeight: true,
      },
      blankRow,
      headRow(['Tipo', 'Lectura', 'Detalle', 'Evidencia', 'Confiabilidad']),
      ...analysis.insights.map((insight, index) =>
        dataRow(
          index,
          [
            { value: INSIGHT_KIND_LABELS[insight.kind] },
            { value: insight.title, style: 'label' },
            { value: insight.body, style: 'wrap' },
            { value: insight.evidence, style: 'wrap' },
            {
              value: CONFIDENCE_LABELS[insight.confidence].label,
              style: CONFIDENCE_LABELS[insight.confidence].style,
            },
          ],
          { autoFitHeight: true },
        ),
      ),
    ],
  }
}

/**
 * Demográficos: which demographics the survey used and how each group answered.
 *
 * Every breakdown in the workbook rests on this list, and a reader who receives
 * only the breakdowns cannot tell whether "Área" had eight groups or eighty, nor
 * which ones were preloaded rather than asked. So the list travels with them.
 */
export function demographicsSheet(draft: SurveyDraft, results: SurveyResults, filters: readonly SegmentFilter[]): SheetSpec {
  const rows: RowSpec[] = []

  for (const segment of results.segments) {
    const participation = participationBySegment(results, segment, filters)
    const origin = segment.preloaded ? 'Precargado' : 'Preguntado en la encuesta'
    const kind = segment.perPerson ? 'Una fila por persona' : 'Grupo'

    rows.push(dataRow(rows.length, [{ value: segment.label, style: 'label' }, { value: origin }, { value: kind }, { value: `${segment.options.length} grupos` }, { value: null }, { value: null }, { value: null }, { value: null }]))

    for (const row of participation) {
      rows.push(
        dataRow(rows.length, [
          { value: `    ${segment.label}` },
          { value: origin },
          { value: kind },
          { value: row.label },
          { value: row.invited },
          { value: row.completed },
          { value: row.rate },
          {
            value: row.belowThreshold ? 'Reservado' : 'Se reporta',
            style: row.belowThreshold ? 'bx' : undefined,
          },
        ]),
      )
    }
  }

  return {
    name: 'Demográficos',
    columns: [190, 190, 150, 200, 80, 95, 85, 105],
    rows: [
      ...sheetIntro(
        'Demográficos de la encuesta',
        draft,
        results,
        filters,
        draft.visibility === 'anonymous' ? `${results.segments.length} demográficos · umbral de anonimato en ${results.threshold} respuestas` : `${results.segments.length} demográficos · encuesta pública, sin umbral de anonimato`,
      ),
      headRow(['Demográfico', 'Origen', 'Tipo', 'Grupo', 'Invitados', 'Completadas', 'Tasa (%)', 'Resultados']),
      ...rows,
    ],
  }
}

/**
 * Profundidad: what each band answered when the survey asked why.
 *
 * One row per written answer, with the band's coverage repeated on every row —
 * the tidy shape a spreadsheet can pivot, and the only one where filtering to
 * "Detractores" still tells the reader how many detractors there were. The
 * screen draws the first eight answers of a band; this sheet carries all of
 * them, which is what the screen's own "y N más" line points at.
 */
export function npsDepthSheet(draft: SurveyDraft, results: SurveyResults, filters: readonly SegmentFilter[]): SheetSpec {
  const sections = npsDepthBySection(draft, results, filters)
  const questions = flattenNpsDepth(sections)
  const totals = npsDepthTotals(sections)

  const bandStyles: Readonly<Record<NpsBand, StyleId>> = {
    promoter: 'pos',
    passive: 'neu',
    detractor: 'neg',
  }

  const rows: RowSpec[] = []

  for (const question of questions) {
    for (const band of question.bands) {
      const context = [
        { value: `${question.sectionNumbering} ${question.sectionTitle}` },
        { value: question.statement },
        { value: NPS_BAND_LABELS[band.band], style: bandStyles[band.band] },
        { value: band.question.trim() || 'Sin pregunta configurada', style: band.question.trim() ? undefined : ('bx' as const) },
        { value: band.people },
        { value: band.answered },
        { value: band.coverage },
      ]

      if (band.answers.length === 0) {
        rows.push(dataRow(rows.length, [...context, { value: 'Sin respuestas de esta banda', style: 'bx' }, { value: null }]))
        continue
      }

      for (const answer of band.answers) {
        rows.push(dataRow(rows.length, [...context, { value: answer.text, style: 'wrap' }, { value: answer.segment }], { autoFitHeight: true }))
      }
    }
  }

  if (rows.length === 0) {
    rows.push(dataRow(0, [{ value: 'Ninguna pregunta pidió profundidad', style: 'hint' }]))
  }

  return {
    name: 'Profundidad',
    columns: [190, 300, 95, 300, 85, 95, 85, 420, 170],
    rows: [
      ...sheetIntro('Preguntas de profundidad', draft, results, filters, `${totals.answered} respuestas de ${totals.people} personas · ${totals.coverage ?? 0}% de cobertura`),
      headRow(['Sección', 'Pregunta de escala', 'Banda', 'Pregunta de profundidad', 'Personas en la banda', 'Respondieron', 'Cobertura (%)', 'Respuesta', 'Segmento']),
      ...rows,
    ],
  }
}
