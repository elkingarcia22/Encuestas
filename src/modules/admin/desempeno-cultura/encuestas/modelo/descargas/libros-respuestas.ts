import type { SurveyDraft } from '../surveyBuilderTypes'
import type { SegmentDefinition, SegmentFilter, SurveyResults } from '../surveyResults'
import { buildAnswerMatrix, buildOpenComments, buildQuestionBreakdowns, buildRespondentAnswers, buildRespondents, type QuestionBreakdown, type Respondent, type RespondentAnswer } from '../questionResponses'
import type { ReportRequest } from './tipos'
import { bandStyle, blankRow, dataRow, headRow, sheetNamer, share, workbook, type RowSpec, type SheetSpec, type XmlCell } from './libro'
import { flattenQuestions, questionSheet, sheetIntro, type FlatQuestion } from './hojas-comunes'

/** Los libros de respuestas individuales: «Preguntas» (una hoja por pregunta) y «Respuestas» (una fila por persona). */

// --- Individual answers ------------------------------------------------------

/**
 * The demographic each respondent carries, keyed by the segment key the report
 * filters speak. A survey can ask for a demographic the roster never stores —
 * that one simply has no column and narrows nothing.
 */
const RESPONDENT_FACETS: Readonly<Record<string, (person: Respondent) => string | null>> = {
  area: (person) => person.area,
  leader: (person) => person.leader,
  country: (person) => person.country,
  gender: (person) => person.gender,
  age: (person) => person.age,
}

/**
 * Same rule as `commentMatchesFilters`: several options of one demographic are
 * a union, different demographics intersect, and a value the measurement never
 * carried — every one of them on an anonymous survey — narrows nothing.
 */
const respondentMatchesFilters = (person: Respondent, filters: readonly SegmentFilter[], segments: readonly SegmentDefinition[]): boolean => {
  const byKey = new Map<string, string[]>()
  for (const filter of filters) {
    const segment = segments.find((candidate) => candidate.key === filter.key)
    const label = segment?.options.find((option) => option.id === filter.optionId)?.label ?? filter.optionId
    const group = byKey.get(filter.key)
    if (group) group.push(label)
    else byKey.set(filter.key, [label])
  }

  return [...byKey.entries()].every(([key, labels]) => {
    const value = RESPONDENT_FACETS[key]?.(person) ?? null
    return value === null || labels.some((label) => value === label)
  })
}

interface ResponseData {
  /** The roster, already narrowed by the population filter. */
  respondents: readonly Respondent[]
  breakdowns: ReadonlyMap<string, QuestionBreakdown>
  /** `respondentId` → what that person answered, keyed by question id. */
  answers: ReadonlyMap<string, ReadonlyMap<string, RespondentAnswer>>
  /** The demographic columns worth printing: none on an anonymous survey. */
  facets: readonly { key: string; label: string }[]
  anonymous: boolean
}

/**
 * Who answered what, read off the same allocation the individual sheets show.
 *
 * The answers are not re-sampled here: `buildAnswerMatrix` hands every tally
 * its exact slice of the roster once, so a question that reports "190 en 4"
 * lists exactly 190 people on the 4 — the export and the screen cannot drift.
 */
function buildResponseData(draft: SurveyDraft, results: SurveyResults, filters: readonly SegmentFilter[]): ResponseData {
  const roster = buildRespondents(draft, results)
  const breakdowns = buildQuestionBreakdowns(draft, results)
  const comments = buildOpenComments(draft, results, roster)
  const matrix = buildAnswerMatrix(roster, breakdowns)

  const respondents = roster.filter((person) => respondentMatchesFilters(person, filters, results.segments))
  const answers = new Map(respondents.map((person) => [person.id, buildRespondentAnswers(person, breakdowns, comments, matrix)]))

  const facets = results.segments
    .filter((segment) => RESPONDENT_FACETS[segment.key] !== undefined && respondents.some((person) => RESPONDENT_FACETS[segment.key](person) !== null))
    .map((segment) => ({ key: segment.key, label: segment.label }))

  return {
    respondents,
    breakdowns,
    answers,
    facets,
    anonymous: draft.visibility === 'anonymous',
  }
}

/**
 * What the individual sheets say about who the rows are.
 *
 * A population filter narrows the aggregate but cannot narrow an anonymous
 * roster — nobody in it carries a demographic to match — so the file says so
 * instead of letting the reader read "Población: Área: Producto" over rows
 * that hold everyone.
 */
const identityHint = (anonymous: boolean, filters: readonly SegmentFilter[]): string => {
  if (!anonymous) {
    return 'Encuesta pública: cada fila lleva la identidad y los demográficos de quien respondió'
  }
  return filters.length > 0 ? 'Encuesta anónima: participantes numerados, sin demográficos — por eso las filas no se acotan por población' : 'Encuesta anónima: cada fila es un participante numerado, sin identidad ni demográficos'
}

/** The cell one answer prints as: colored by its band, gray on an opt-out. */
const answerCell = (answer: RespondentAnswer | undefined): XmlCell => {
  if (!answer || answer.skipped) return { value: '' }
  if (answer.nsnr) return { value: 'NS/NR', style: 'bx' }
  if (answer.bandIndex !== null && answer.value !== null) {
    return { value: answer.value, style: bandStyle(answer.bandIndex + 1) }
  }
  return { value: answer.value ?? answer.display }
}

/** One question's own tab: its distribution, then every answer it received. */
function questionResponsesSheet(name: string, position: number, question: FlatQuestion, data: ResponseData, draft: SurveyDraft, results: SurveyResults, filters: readonly SegmentFilter[]): SheetSpec {
  const breakdown = data.breakdowns.get(question.id)
  const isOpen = breakdown?.type === 'open'

  const answered = data.respondents
    .map((person) => ({ person, answer: data.answers.get(person.id)?.get(question.id) }))
    .filter((entry): entry is { person: Respondent; answer: RespondentAnswer } => entry.answer !== undefined && !entry.answer.skipped)

  // Counted over the rows this very sheet lists, never copied from the
  // aggregate: a tab whose table and list disagree is worse than one that
  // only claims what it prints.
  const counts = new Map<string, number>()
  for (const entry of answered) {
    const labels = entry.answer.selected.length > 0 ? entry.answer.selected : [entry.answer.display]
    for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1)
  }

  const distributionRows: RowSpec[] =
    isOpen || !breakdown || breakdown.tallies.length === 0
      ? []
      : [
          headRow(['Opción', 'Respuestas', '% de las respuestas']),
          ...breakdown.tallies.map((tally, index) => {
            const count = counts.get(tally.label) ?? 0
            return dataRow(index, [
              {
                value: tally.label,
                style: tally.bandIndex !== null ? bandStyle(tally.bandIndex + 1) : tally.isNsNr ? 'bx' : undefined,
              },
              { value: count },
              { value: share(count, answered.length) },
            ])
          }),
          blankRow,
        ]

  // No "Valor" twin of the answer and no submission date: both live one column
  // wide in the "Respuestas" workbook, and a tab repeated once per question
  // pays for every extra column 24.000 times over.
  const responseHead = ['Respuesta #', 'Participante', ...data.facets.map((facet) => facet.label), 'Respuesta']

  const responseRows: RowSpec[] =
    answered.length === 0
      ? [dataRow(0, [{ value: 'Sin respuestas con esta configuración', style: 'hint' }])]
      : answered.map(({ person, answer }, index) =>
          dataRow(
            index,
            [
              { value: index + 1 },
              { value: person.name },
              ...data.facets.map((facet) => ({
                value: RESPONDENT_FACETS[facet.key](person) ?? '',
              })),
              {
                value: answer.nsnr ? 'No sabe / No responde' : answer.display,
                style: isOpen ? 'wrap' : answer.nsnr ? 'bx' : answer.bandIndex !== null ? bandStyle(answer.bandIndex + 1) : undefined,
              },
            ],
            { autoFitHeight: isOpen },
          ),
        )

  const scope = [
    breakdown?.formatLabel ?? 'Pregunta',
    `${answered.length} respuestas`,
    ...(question.score !== null ? [`Puntaje ${question.score}`] : []),
    ...(question.favorability !== null ? [`Favorabilidad ${question.favorability}%`] : []),
  ].join('  ·  ')

  return {
    name,
    columns: [70, 160, ...data.facets.map(() => 110), isOpen ? 420 : 280],
    rows: [
      ...sheetIntro(`P${position}. ${question.statement}`, draft, results, filters, `${question.sectionNumbering} ${question.sectionTitle}  ·  ${scope}  ·  ${identityHint(data.anonymous, filters)}`),
      ...distributionRows,
      headRow(responseHead),
      ...responseRows,
    ],
  }
}

/**
 * Preguntas: una hoja por pregunta, con todas las respuestas que recibió.
 *
 * The file used to be a single table of aggregates — the same numbers the
 * "Resultados generales" workbook already carries in its "Preguntas" sheet,
 * which made this report a duplicate rather than a report of its own. It now
 * opens on that summary and then gives every question its own tab: its
 * distribution counted over the rows below it, and one row per person who
 * answered it.
 */
export function buildQuestionsWorkbook(draft: SurveyDraft, results: SurveyResults, request: ReportRequest): string {
  const { filters } = request
  const data = buildResponseData(draft, results, filters)
  const questions = flattenQuestions(results, filters)
  const overview = questionSheet(results, filters)
  const nameFor = sheetNamer()

  const sheets: SheetSpec[] = [
    {
      name: nameFor('Resumen'),
      columns: overview.columns,
      rows: [...sheetIntro('Resultados por pregunta', draft, results, filters, `${questions.length} preguntas · cada una con su propia hoja de respuestas`), ...overview.rows],
    },
    ...questions.map((question, index) => questionResponsesSheet(nameFor(`P${index + 1} ${question.statement}`), index + 1, question, data, draft, results, filters)),
  ]

  return workbook(sheets)
}

/**
 * Respuestas: una fila por participante con todo lo que respondió.
 *
 * Read off the same allocation the individual sheets show — not re-sampled —
 * so the file re-sums into exactly the distributions the screen reports. What
 * identifies the row is the survey's own privacy setting, not a rule of the
 * export: a public measurement carries the name and the correo it already
 * shows on screen, and an anonymous one carries the stable pseudonym and no
 * demographic at all, because "Marketing, Colombia, 18–24" identifies a person
 * as reliably as a name does.
 */
export function buildAnswersWorkbook(draft: SurveyDraft, results: SurveyResults, request: ReportRequest): string {
  const { filters } = request
  const data = buildResponseData(draft, results, filters)
  const questions = flattenQuestions(results, filters)

  const rows: RowSpec[] =
    data.respondents.length === 0
      ? [dataRow(0, [{ value: 'Sin respuestas con esta configuración', style: 'hint' }])]
      : data.respondents.map((person, index) => {
          const answers = data.answers.get(person.id)
          return dataRow(index, [
            { value: index + 1 },
            { value: person.name },
            ...(data.anonymous ? [] : [{ value: person.email ?? '' }]),
            ...data.facets.map((facet) => ({
              value: RESPONDENT_FACETS[facet.key](person) ?? '',
            })),
            { value: person.status === 'complete' ? 'Completa' : 'Parcial' },
            { value: person.submittedLabel },
            ...questions.map((question) => answerCell(answers?.get(question.id))),
          ])
        })

  return workbook([
    {
      name: 'Respuestas',
      columns: [70, 160, ...(data.anonymous ? [] : [180]), ...data.facets.map(() => 110), 80, 90, ...questions.map(() => 60)],
      rows: [
        ...sheetIntro('Respuestas individuales', draft, results, filters, identityHint(data.anonymous, filters)),
        headRow(['Respuesta #', 'Participante', ...(data.anonymous ? [] : ['Correo']), ...data.facets.map((facet) => facet.label), 'Estado', 'Enviado', ...questions.map((question) => `${question.sectionNumbering} ${question.statement}`)]),
        ...rows,
      ],
    },
  ])
}
