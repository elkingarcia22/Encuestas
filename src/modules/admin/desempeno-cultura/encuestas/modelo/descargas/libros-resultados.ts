import type { SurveyDraft } from '../surveyBuilderTypes'
import { flattenResultSections, heatmapBySegment, npsBySection, npsBySegmentData, participationBySegment, sectionResultsForFilters, type SegmentDefinition, type SurveyResults } from '../surveyResults'
import { buildOpenComments, buildRespondents, type Sentiment } from '../questionResponses'
import { commentMatchesFilters } from '../summaryModel'
import type { ReportRequest, XlsxSheetId } from './tipos'
import { bandStyle, blankRow, dataRow, headRow, npsScoreStyle, share, workbook, type RowSpec, type SheetSpec, type StyleId } from './libro'
import { questionSheet, sheetIntro } from './hojas-comunes'
import { summarySheet } from './hoja-resumen'
import { NPS_COLUMNS, NPS_HEAD, aiAnalysisSheet, demographicsSheet, npsDepthSheet, npsDetailRows, npsSegmentRows, questionDetailSheet } from './hojas-resultados'

// --- Reportes ---------------------------------------------------------------------

/**
 * Resultados generales: todos los niveles de análisis, una hoja por nivel.
 *
 * The reader picks which levels travel — the same list the drawer shows — so
 * the sheet order here is `XLSX_SHEETS` order, and a level nobody asked for is
 * simply absent rather than present and empty.
 */
export function buildResultsWorkbook(draft: SurveyDraft, results: SurveyResults, request: ReportRequest): string {
  const filters = request.filters
  const sections = sectionResultsForFilters(results, filters)
  const sheets: SheetSpec[] = []
  const wants = (sheet: XlsxSheetId): boolean => request.xlsxSheets.includes(sheet)

  if (wants('summary')) sheets.push(summarySheet(draft, results, filters))

  if (wants('demographics') && results.segments.length > 0) {
    sheets.push(demographicsSheet(draft, results, filters))
  }

  if (wants('sections'))
    sheets.push({
      name: 'Secciones',
      columns: [70, 340, 80, 110, 90, 60],
      rows: [
        ...sheetIntro('Favorabilidad por secciones', draft, results, filters),
        headRow(['Numeración', 'Sección', 'Puntaje (1-5)', 'Favorabilidad (%)', 'Respuestas', 'NS/NR']),
        ...flattenResultSections(sections).map((section, index) =>
          dataRow(index, [
            { value: section.numbering },
            { value: `${'    '.repeat(section.depth)}${section.title}`, style: section.depth === 0 ? 'label' : undefined },
            { value: section.n > 0 ? section.score : null, style: section.n > 0 ? bandStyle(section.score) : 'bx' },
            { value: section.n > 0 ? section.favorability : null },
            { value: section.n },
            { value: section.nsnr },
          ]),
        ),
      ],
    })

  if (wants('questions')) {
    const questions = questionSheet(results, filters)
    sheets.push({
      name: 'Preguntas',
      columns: questions.columns,
      rows: [...sheetIntro('Resultados por pregunta', draft, results, filters), ...questions.rows],
    })
  }

  if (wants('question-detail')) {
    const detail = questionDetailSheet(draft, results, filters)
    sheets.push({
      name: 'Detalle de preguntas',
      columns: detail.columns,
      rows: [...sheetIntro('Detalle por opción de respuesta', draft, results, filters, 'Incluye escalas, opción única, múltiples respuestas y preguntas abiertas'), ...detail.rows],
    })
  }

  if (wants('nps') && results.nps) {
    const nps = results.nps
    const npsPairs: readonly [string, string | number | null][] = [
      ['eNPS', nps.score],
      ['eNPS anterior', nps.previousScore],
      ['Variación (puntos)', Math.round((nps.score - nps.previousScore) * 10) / 10],
      ['Promotores', nps.promoters],
      ['Pasivos', nps.passives],
      ['Detractores', nps.detractors],
      ['% Promotores', share(nps.promoters, nps.n)],
      ['% Pasivos', share(nps.passives, nps.n)],
      ['% Detractores', share(nps.detractors, nps.n)],
      ['Respuestas', nps.n],
    ]

    sheets.push({
      name: 'eNPS',
      columns: NPS_COLUMNS,
      rows: [
        ...sheetIntro('eNPS de la medición', draft, results, filters, 'eNPS = % promotores − % detractores, de −100 a +100'),
        ...npsPairs.map(([label, value], index) =>
          dataRow(index, [
            { value: label, style: 'label' },
            { value, style: label === 'eNPS' ? npsScoreStyle(nps.score) : undefined },
          ]),
        ),
        blankRow,
        headRow([...NPS_HEAD]),
        ...npsDetailRows(npsBySection(results, filters)),
      ],
    })
  }

  const segmentByKey = (key: string): SegmentDefinition | undefined => results.segments.find((segment) => segment.key === key)

  for (const key of request.participationSegments) {
    const segment = segmentByKey(key)
    if (!segment) continue
    const rows = participationBySegment(results, segment, filters)
    sheets.push({
      name: `Participación · ${segment.label}`,
      columns: [190, 80, 95, 75, 75, 95],
      rows: [
        ...sheetIntro(`Participación por ${segment.label.toLowerCase()}`, draft, results, filters),
        headRow([segment.label, 'Invitados', 'Completadas', 'En progreso', 'Tasa (%)', 'Bajo umbral']),
        ...rows.map((row, index) =>
          dataRow(index, [{ value: row.label }, { value: row.invited }, { value: row.completed }, { value: row.inProgress }, { value: row.rate }, { value: row.belowThreshold ? 'Sí' : 'No', style: row.belowThreshold ? 'neg' : undefined }]),
        ),
      ],
    })
  }

  for (const key of request.heatmapSegments) {
    const segment = segmentByKey(key)
    if (!segment || segment.perPerson) continue
    const heatmap = heatmapBySegment(results, segment, filters)
    const flat: RowSpec[] = []
    let index = 0
    const walk = (rows: readonly (typeof heatmap.rows)[number][]) => {
      for (const row of rows) {
        flat.push(
          dataRow(index, [
            {
              value: `${'    '.repeat(row.depth)}${row.numbering} ${row.label}`,
              style: row.kind === 'section' && row.depth === 0 ? 'label' : undefined,
            },
            { value: row.total, style: bandStyle(row.total) },
            ...row.cells.map((cell) => ({
              value: cell.masked ? 'Reservado' : cell.score,
              style: cell.masked ? ('bx' as const) : bandStyle(cell.score),
            })),
          ]),
        )
        index += 1
        walk(row.children)
      }
    }
    walk(heatmap.rows)
    sheets.push({
      name: `Heatmap · ${segment.label}`,
      columns: [280, 60, ...heatmap.columns.map(() => 78)],
      rows: [
        ...sheetIntro(`Heatmap por ${segment.label.toLowerCase()}`, draft, results, filters, `Grupos con menos de ${results.threshold} respuestas se reportan como Reservado`),
        headRow(['Sección / pregunta', 'Total', ...heatmap.columns.map((column) => column.label)]),
        ...flat,
        dataRow(index, [
          { value: 'Total por grupo', style: 'label' },
          { value: null },
          ...heatmap.columnTotals.map((total) => ({
            value: total ?? 'Reservado',
            style: total === null ? ('bx' as const) : bandStyle(total),
          })),
        ]),
      ],
    })
  }

  if (results.nps) {
    for (const key of request.npsSegments) {
      const segment = segmentByKey(key)
      if (!segment || segment.perPerson) continue
      const grid = npsBySegmentData(results, segment, filters)
      sheets.push({
        name: `eNPS · ${segment.label}`,
        columns: [300, 60, ...grid.columns.map(() => 78)],
        rows: [
          ...sheetIntro(`eNPS por ${segment.label.toLowerCase()}`, draft, results, filters, `Grupos con menos de ${results.threshold} respuestas se reportan como Reservado`),
          headRow(['Dimensión / pregunta', 'Total', ...grid.columns.map((column) => column.label)]),
          ...npsSegmentRows([grid.totalRow, ...grid.sectionRows], 0),
        ],
      })
    }
  }

  if (wants('depth')) sheets.push(npsDepthSheet(draft, results, filters))

  // Last on purpose: the narrative reads after the data it rests on.
  if (wants('ai')) sheets.push(aiAnalysisSheet(draft, results, filters))

  return workbook(sheets)
}

/**
 * Comentarios: las respuestas abiertas, filtradas por sentimiento, tema y población.
 *
 * The file is the Preguntas tab's comment list, not the eNPS follow-ups: it is
 * built from the same `buildOpenComments` the screen reads, so a reader who
 * narrowed by theme there recognises every row here — theme included, which is
 * the column the eNPS verbatims never had.
 */
export function buildCommentsWorkbook(draft: SurveyDraft, results: SurveyResults, request: ReportRequest): string {
  const wanted = new Set<Sentiment>(request.commentSentiments)
  // An empty theme list means "todos": a measurement can pick up a theme the
  // configuration never saw, and dropping it silently would be worse than
  // exporting one row more than the reader ticked.
  const topics = new Set(request.commentTopics)

  const respondents = buildRespondents(draft, results)
  const comments = buildOpenComments(draft, results, respondents).filter((comment) => wanted.has(comment.aiSentiment) && (topics.size === 0 || topics.has(comment.topic)) && commentMatchesFilters(comment, request.filters, results.segments))

  // Singular here, plural in `SENTIMENT_LABELS`: that one labels a count
  // ("14 Negativos"), this one labels one comment's own reading.
  const reading: Readonly<Record<Sentiment, { label: string; style: StyleId }>> = {
    positive: { label: 'Positivo', style: 'pos' },
    neutral: { label: 'Neutral', style: 'neu' },
    negative: { label: 'Negativo', style: 'neg' },
  }
  const order: readonly Sentiment[] = ['positive', 'neutral', 'negative']

  const scopeHint = [
    wanted.size === 3
      ? 'Todos los sentimientos'
      : `Sentimientos: ${order
          .filter((id) => wanted.has(id))
          .map((id) => reading[id].label)
          .join(', ')}`,
    topics.size === 0 ? 'Todos los temas' : `Temas: ${[...topics].join(', ')}`,
  ].join('  ·  ')

  const rows: RowSpec[] =
    comments.length === 0
      ? [dataRow(0, [{ value: 'Sin comentarios con esta configuración', style: 'hint' }])]
      : comments.map((comment, index) =>
          dataRow(
            index,
            [
              { value: `${comment.sectionNumbering} ${comment.sectionTitle}`.trim() },
              { value: comment.questionStatement },
              { value: comment.text, style: 'wrap' },
              {
                value: reading[comment.aiSentiment].label,
                style: reading[comment.aiSentiment].style,
              },
              { value: comment.aiConfidence },
              { value: comment.topic, style: 'label' },
              { value: comment.area ?? 'Anónimo' },
              { value: comment.country ?? 'Anónimo' },
              { value: comment.submittedLabel },
            ],
            { autoFitHeight: true },
          ),
        )

  return workbook([
    {
      name: 'Comentarios',
      columns: [150, 230, 340, 90, 80, 130, 120, 110, 100],
      rows: [...sheetIntro('Comentarios de los colaboradores', draft, results, request.filters, scopeHint), headRow(['Sección', 'Pregunta', 'Comentario', 'Sentimiento', 'Confianza IA', 'Tema', 'Área', 'País', 'Enviado']), ...rows],
    },
  ])
}
