import { SURVEY_KIND_LABELS, type SurveyDraft } from '../surveyBuilderTypes'
import { participationBySegment, sectionResultsForFilters, type SegmentFilter, type SurveyResults } from '../surveyResults'
import { buildOpenComments, buildRespondents, type Sentiment } from '../questionResponses'
import {
  FINDING_LEVELS,
  SCOPE_ALL,
  analyseSegmentGaps,
  buildPriorities,
  buildStrengths,
  commentMatchesFilters,
  defaultFindingLevel,
  findingsAtLevel,
  resolveScope,
  scopedMetrics,
  scopedQuestionIds,
  sentimentRollup,
  summaryVerdict,
  type Priority,
} from '../summaryModel'
import { bandStyle, blankRow, blockRow, dataRow, headRow, hintRow, npsScoreStyle, paragraphRow, share, type RowSpec, type SheetSpec, type StyleId } from './libro'
import { filterLabelFor, sheetIntro } from './hojas-comunes'

/**
 * Resumen: the Resumen tab as one sheet.
 *
 * The metrics alone were a header without a report — the tab's whole point is
 * that it decides what the reader does next, and that lives in the executive
 * reading, the ranked priorities with the factors behind them, the strengths to
 * lean on, where the groups pull apart and in whose words. So this sheet prints
 * the same six blocks the screen does, in the same order, from the same model
 * functions: no second implementation that can disagree with the tab.
 */
const SUMMARY_COLUMNS = [265, 300, 120, 105, 115, 115, 400, 260] as const

const SEVERITY_LABELS: Readonly<Record<Priority['severity'], { label: string; style: StyleId }>> = {
  critical: { label: 'Crítica', style: 'neg' },
  high: { label: 'Alta', style: 'neu' },
  watch: { label: 'En observación', style: 'bx' },
}

const CONFIDENCE_TEXT: Readonly<Record<Priority['confidence'], string>> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
}

const SENTIMENT_LABELS: Readonly<Record<Sentiment, { label: string; style: StyleId }>> = {
  positive: { label: 'Positivos', style: 'pos' },
  neutral: { label: 'Neutros', style: 'neu' },
  negative: { label: 'Negativos', style: 'neg' },
}

export function summarySheet(draft: SurveyDraft, results: SurveyResults, filters: readonly SegmentFilter[]): SheetSpec {
  const sections = sectionResultsForFilters(results, filters)
  const filtered: SurveyResults = filters.length === 0 ? results : { ...results, sections }

  const scope = resolveScope(filtered, SCOPE_ALL)
  const metrics = scopedMetrics(scope)
  const level = defaultFindingLevel(scope)
  const findings = findingsAtLevel(scope, level)

  const respondents = buildRespondents(draft, results)
  const scopedIds = scopedQuestionIds(scope)
  const comments = buildOpenComments(draft, results, respondents).filter((comment) => scopedIds.has(comment.questionId) && commentMatchesFilters(comment, filters, results.segments))
  const sentiment = sentimentRollup(comments, new Map())

  const priorities = buildPriorities(findings, sentiment.topics)
  const strengths = buildStrengths(findings)
  const gaps = results.segments
    .filter((segment) => !segment.perPerson)
    .map((segment) => analyseSegmentGaps(segment, results, filters))
    .filter((analysis): analysis is NonNullable<typeof analysis> => analysis !== null)

  // With a filter on, the survey-wide participation is no longer the
  // participation of the people in view, so it is re-totalled from the groups
  // that survived — exactly what the tab's headline does.
  const filterSegment = filters.length ? results.segments.find((segment) => segment.key === filters[0].key) : undefined
  const participation = filterSegment ? participationBySegment(results, filterSegment, filters) : []
  const scoped =
    filterSegment === undefined
      ? results.participation
      : (() => {
          const completed = participation.reduce((sum, row) => sum + row.completed, 0)
          const inProgress = participation.reduce((sum, row) => sum + row.inProgress, 0)
          const invited = participation.reduce((sum, row) => sum + row.invited, 0)
          return {
            completed,
            inProgress,
            invited,
            rate: invited === 0 ? 0 : Math.round((completed / invited) * 1000) / 10,
          }
        })()

  const verdict = summaryVerdict(findings, scoped.rate)

  const rows: RowSpec[] = [...sheetIntro('Resumen de la medición', draft, results, filters)]

  /* --- indicadores ------------------------------------------------------- */

  const indicators: readonly (readonly [string, string | number | null, StyleId?])[] = [
    ['Encuesta', draft.name],
    ['Tipo', draft.kind ? SURVEY_KIND_LABELS[draft.kind] : '—'],
    ['Población', filterLabelFor(results, filters)],
    ['Invitados', scoped.invited],
    ['Completadas', scoped.completed],
    ['En progreso', scoped.inProgress],
    ['Tasa de participación (%)', scoped.rate],
    ['Favorabilidad (%)', metrics.favorability],
    ...(filters.length === 0 ? ([['Favorabilidad anterior (%)', results.previousFavorability]] as const) : []),
    ...(results.nps ? ([['eNPS', results.nps.score, npsScoreStyle(results.nps.score)]] as const) : []),
    ['Preguntas', metrics.questions],
    ['Preguntas de escala', metrics.scoredQuestions],
    ['Respuestas recibidas', metrics.answers],
    ['NS/NR', metrics.nsnr],
    ['Comentarios', sentiment.total],
    ['Índice de sentimiento (0-100)', sentiment.index],
    // The floor only protects an anonymous measurement — a public one reserves
    // nothing, and printing a "mínimo por grupo" of 1 reads as a rule it isn't.
    ...(draft.visibility === 'anonymous' ? ([['Mínimo por grupo (anonimato)', results.threshold]] as const) : []),
  ]

  rows.push(blockRow('Indicadores'))
  indicators.forEach(([label, value, style], index) =>
    rows.push(
      dataRow(index, [
        { value: label, style: 'label' },
        { value, style },
      ]),
    ),
  )

  /* --- lectura ejecutiva -------------------------------------------------- */

  rows.push(blankRow, blockRow('Lectura ejecutiva'), paragraphRow(verdict))

  /* --- prioridades -------------------------------------------------------- */

  const levelLabel = FINDING_LEVELS.find((candidate) => candidate.id === level)?.label ?? 'Secciones'

  rows.push(
    blankRow,
    blockRow('Prioridades de esta medición'),
    hintRow(`Severidad × alcance × evidencia cualitativa · leído a nivel de ${levelLabel.toLowerCase()}`),
    headRow(['Prioridad', 'Ubicación', 'Favorabilidad (%)', 'Respuestas', 'Severidad', 'Confiabilidad', 'Por qué importa', 'Señal cualitativa']),
  )

  if (priorities.length === 0) {
    rows.push(paragraphRow('Ningún bloque queda por debajo del objetivo: esta medición no abre prioridades.'))
  }

  priorities.forEach((priority, index) =>
    rows.push(
      dataRow(
        index,
        [
          {
            value: `${index + 1}. ${priority.finding.numbering} ${priority.finding.title}`,
            style: 'label',
          },
          { value: priority.finding.parent },
          { value: priority.finding.favorability },
          { value: priority.finding.n },
          {
            value: SEVERITY_LABELS[priority.severity].label,
            style: SEVERITY_LABELS[priority.severity].style,
          },
          { value: CONFIDENCE_TEXT[priority.confidence] },
          { value: priority.why, style: 'wrap' },
          {
            value: priority.qual
              ? `${priority.qual.negative} de ${priority.qual.mentions} comentarios sobre ${priority.qual.topic.toLowerCase()} son negativos (${Math.round(priority.qual.negativeShare)} %)`
              : 'Sin comentarios que confirmen la señal',
            style: 'wrap',
          },
        ],
        { autoFitHeight: true },
      ),
    ),
  )

  /* --- fortalezas --------------------------------------------------------- */

  rows.push(blankRow, blockRow('Fortalezas para apalancar'), headRow(['Fortaleza', 'Ubicación', 'Favorabilidad (%)', 'Respuestas']))
  strengths.forEach((strength, index) => rows.push(dataRow(index, [{ value: `${strength.numbering} ${strength.title}`, style: 'label' }, { value: strength.parent }, { value: strength.favorability }, { value: strength.n }])))

  /* --- brechas ------------------------------------------------------------ */

  rows.push(
    blankRow,
    blockRow('Dónde existen brechas'),
    hintRow('Grupos que caen por debajo del promedio de su demográfico, en la escala 1 a 5'),
    headRow(['Demográfico', 'Grupo', 'Puntaje (1-5)', 'Diferencia', 'Participación (%)', 'Estado', 'Mayor brecha del demográfico']),
  )

  if (gaps.length === 0) {
    rows.push(paragraphRow('Ningún demográfico separa a sus grupos lo suficiente para reportar una brecha.'))
  }

  for (const gap of gaps) {
    const widest = gap.widest ? `${gap.widest.rowLabel}: ${gap.widest.min} en ${gap.widest.minLabel} vs ${gap.widest.max} en ${gap.widest.maxLabel} (${gap.widest.spread} pts)` : 'Sin brechas por encima del umbral'

    rows.push(
      dataRow(rows.length, [
        { value: gap.segment.label, style: 'label' },
        { value: `Promedio del demográfico: ${Math.round(gap.average * 10) / 10}`, style: 'hint' },
        { value: null },
        { value: null },
        { value: null },
        { value: null },
        { value: widest, style: 'wrap' },
      ]),
    )

    for (const outlier of gap.outliers) {
      rows.push(
        dataRow(rows.length, [
          { value: `    ${gap.segment.label}` },
          { value: outlier.row.label },
          { value: outlier.row.score, style: bandStyle(outlier.row.score) },
          { value: Math.round(outlier.gap * 10) / 10 },
          { value: outlier.row.participation },
          { value: 'Bajo el promedio', style: 'neg' },
          { value: null },
        ]),
      )
    }

    for (const masked of gap.masked) {
      rows.push(
        dataRow(rows.length, [
          { value: `    ${gap.segment.label}` },
          { value: masked.label },
          { value: 'Reservado', style: 'bx' },
          { value: null },
          { value: masked.participation },
          { value: `Menos de ${results.threshold} respuestas`, style: 'bx' },
          { value: null },
        ]),
      )
    }
  }

  /* --- voz de los colaboradores ------------------------------------------- */

  rows.push(blankRow, blockRow('Voz de los colaboradores'), hintRow(`${sentiment.total} comentarios leídos por la IA · índice ${sentiment.index ?? '—'} de 100`))

  rows.push(
    headRow(['Lectura', 'Comentarios', '% del total']),
    ...(['positive', 'neutral', 'negative'] as const).map((band, index) =>
      dataRow(index, [{ value: SENTIMENT_LABELS[band].label, style: SENTIMENT_LABELS[band].style }, { value: sentiment.counts[band] }, { value: share(sentiment.counts[band], sentiment.total) }]),
    ),
  )

  if (sentiment.topics.length > 0) {
    rows.push(
      blankRow,
      headRow(['Tema', 'Menciones', 'Positivos', 'Neutros', 'Negativos', '% negativos']),
      ...sentiment.topics.map((topic, index) =>
        dataRow(index, [{ value: topic.topic, style: 'label' }, { value: topic.total }, { value: topic.positive }, { value: topic.neutral }, { value: topic.negative }, { value: Math.round(topic.negativeShare * 10) / 10 }]),
      ),
    )
  }

  for (const [label, quote] of [
    ['Comentario más crítico', sentiment.worstQuote],
    ['Comentario más positivo', sentiment.bestQuote],
  ] as const) {
    if (!quote) continue
    rows.push(blankRow, dataRow(0, [{ value: label, style: 'label' }, { value: quote.topic }, { value: null }, { value: null }, { value: null }, { value: null }, { value: `“${quote.text}”`, style: 'wrap' }], { autoFitHeight: true }))
  }

  return { name: 'Resumen', columns: SUMMARY_COLUMNS, rows }
}
