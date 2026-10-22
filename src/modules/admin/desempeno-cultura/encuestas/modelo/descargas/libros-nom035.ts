import type { SurveyDraft } from '../surveyBuilderTypes'
import { formatPreviewDate } from '../previewModel'
import { heatmapBySegment, participationBySegment, type HeatmapRow, type SectionResult, type SegmentDefinition, type SurveyResults } from '../surveyResults'
import { NOM035_REQUIRED_PARTICIPATION } from '../nom035'
import { RISK_BANDS, formatRisk, organizationRiskOf, riskBandForScore, riskScoreOf } from '../nom035Scale'
import { collaboratorRiskOf, flattenSections, nom035AnswerContext, nom035Dimensions, peopleAtRiskIn } from '../nom035RiskModel'
import { channeledRoster } from './canalizados'
import type { ReportRequest } from './tipos'
import { blankRow, dataRow, headRow, hintRow, titleRow, workbook, type RowSpec, type SheetSpec, type StyleId } from './libro'

/**
 * Los libros de la NOM 035.
 *
 * No son el libro de resultados con otras etiquetas: la norma no mide
 * favorabilidad ni eNPS, mide riesgo —y lo mide al revés, donde el número alto
 * es el problema— así que sus hojas son otras. La Guía III entrega el árbol
 * categoría → dominio → dimensión con cuánta gente quedó en riesgo en cada
 * rama; la Guía I no entrega puntajes en absoluto, entrega la lista de personas
 * que hay que canalizar.
 *
 * Todo sale del mismo agregado que dibuja la pantalla — misma asignación de
 * respuestas, mismas bandas — porque un archivo que discrepe de la herramienta
 * en una sola celda deja de servir como evidencia ante una inspección.
 */

/** El color de una celda de riesgo: el verde de la favorabilidad, invertido. */
const riskStyle = (risk: number | null): StyleId => {
  if (risk === null) return 'bx'
  switch (riskBandForScore(risk).id) {
    case 'nulo':
      return 'b5'
    case 'bajo':
      return 'b4'
    case 'medio':
      return 'b3'
    case 'alto':
      return 'b2'
    default:
      return 'b1'
  }
}

const percent = (value: number): string => `${Math.round(value)} %`

const shareOf = (part: number, total: number): string => (total === 0 ? '—' : percent((part / total) * 100))

/** El nivel, escrito. Es la columna que una inspección lee primero. */
const riskLabel = (risk: number | null): string => (risk === null ? 'Sin datos' : riskBandForScore(risk).label)

const RISK_TABLE_HEAD = ['Nombre', 'Colaboradores en riesgo', '% afectados', 'Puntaje de riesgo', 'Nivel de riesgo'] as const

const RISK_TABLE_COLUMNS = [300, 130, 80, 95, 105] as const

interface RiskContext {
  respondents: ReturnType<typeof nom035AnswerContext>['respondents']
  breakdowns: ReturnType<typeof nom035AnswerContext>['breakdowns']
  matrix: ReturnType<typeof nom035AnswerContext>['matrix']
}

/** Una fila del árbol —categoría, dominio o dimensión— con su gente en riesgo. */
const riskRow = (index: number, section: SectionResult, context: RiskContext): RowSpec => {
  const risk = section.n > 0 ? riskScoreOf(section.score) : null
  const { atRisk, answered } = peopleAtRiskIn(section, context.respondents, context.breakdowns, context.matrix)
  return dataRow(index, [
    { value: `${section.numbering}. ${section.title}` },
    { value: atRisk },
    { value: shareOf(atRisk, answered) },
    { value: risk === null ? '—' : formatRisk(risk), style: riskStyle(risk) },
    { value: riskLabel(risk), style: riskStyle(risk) },
  ])
}

/** Las ramas de un nivel de la jerarquía, en el orden del árbol. */
const levelOf = (sections: readonly SectionResult[], depth: number): SectionResult[] => flattenSections(sections).filter((section) => section.depth === depth)

const levelSheet = (name: string, title: string, hint: string, sections: readonly SectionResult[], context: RiskContext): SheetSpec => ({
  name,
  columns: [...RISK_TABLE_COLUMNS],
  rows: [titleRow(title), hintRow(hint), blankRow, headRow([...RISK_TABLE_HEAD]), ...sections.map((section, index) => riskRow(index, section, context))],
})

const summarySheet = (draft: SurveyDraft, results: SurveyResults, request: ReportRequest, categories: readonly SectionResult[]): SheetSpec => {
  const organization = organizationRiskOf(categories)
  const dimensions = nom035Dimensions(categories)
  const inBand = (bandId: string) => dimensions.filter((dimension) => riskBandForScore(riskScoreOf(dimension.score)).id === bandId).length
  const participation = results.participation

  const rows: RowSpec[] = [
    titleRow(draft.name),
    hintRow('Guía de Referencia III · Identificación y análisis de los factores de riesgo psicosocial (NOM-035-STPS-2018)'),
    blankRow,
    headRow(['Dato', 'Valor']),
    dataRow(0, [
      { value: 'Período' },
      {
        value: `${formatPreviewDate(draft.startDate) ?? '—'} — ${formatPreviewDate(draft.endDate) ?? '—'}`,
      },
    ]),
    dataRow(1, [{ value: 'Invitados' }, { value: participation.invited }]),
    dataRow(2, [{ value: 'Respuestas completas' }, { value: participation.completed }]),
    dataRow(3, [{ value: 'Participación' }, { value: percent(participation.rate) }]),
    dataRow(4, [{ value: `Participación exigida por la norma` }, { value: percent(NOM035_REQUIRED_PARTICIPATION) }]),
    dataRow(5, [{ value: 'Nivel de riesgo organizacional' }, { value: formatRisk(organization.score), style: riskStyle(organization.score) }]),
    dataRow(6, [{ value: 'Nivel' }, { value: organization.band.label, style: riskStyle(organization.score) }]),
    blankRow,
    titleRow('Dimensiones por nivel'),
    hintRow('Las dimensiones en nivel alto y muy alto son las que obligan a un plan de acción.'),
    headRow(['Nivel', 'Dimensiones', '% del total']),
    ...RISK_BANDS.map((band, index) => dataRow(index, [{ value: band.label, style: riskStyle(band.max === Infinity ? 5 : band.max) }, { value: inBand(band.id) }, { value: shareOf(inBand(band.id), dimensions.length) }])),
  ]

  if (request.responsible) {
    rows.push(
      blankRow,
      titleRow('Responsable profesional del reporte'),
      hintRow('Quien avala la aplicación e interpretación de la NOM-035.'),
      dataRow(0, [{ value: 'Nombre' }, { value: request.responsible.name }]),
      dataRow(1, [{ value: 'Identificación' }, { value: request.responsible.id }]),
    )
  }

  return { name: 'Resumen', columns: [260, 200, 110], rows }
}

const collaboratorsSheet = (categories: readonly SectionResult[], context: RiskContext): SheetSpec => {
  const dimensions = nom035Dimensions(categories)
  const people = context.respondents.map((respondent) => collaboratorRiskOf(respondent, dimensions, context.breakdowns, context.matrix))
  const ordered = [...people].sort((a, b) => (b.risk ?? -1) - (a.risk ?? -1))

  return {
    name: 'Colaboradores',
    columns: [200, 150, 150, 110, 130, 95, 105],
    rows: [
      titleRow('Resultados por colaborador'),
      hintRow('El nivel de una persona es el más alto de sus dimensiones: basta una en riesgo alto para que quede ahí.'),
      blankRow,
      headRow(['Participante', 'Área', 'Líder', 'País', 'Dimensiones en riesgo', 'Puntaje de riesgo', 'Nivel de riesgo']),
      ...ordered.map((person, index) => {
        const atRisk = person.dimensions.filter((dimension) => dimension.risk !== null && dimension.risk >= 3.5).length
        return dataRow(index, [
          { value: person.respondent.name },
          { value: person.respondent.area ?? '—' },
          { value: person.respondent.leader ?? '—' },
          { value: person.respondent.country ?? '—' },
          { value: atRisk },
          {
            value: person.risk === null ? '—' : formatRisk(person.risk),
            style: riskStyle(person.risk),
          },
          { value: riskLabel(person.risk), style: riskStyle(person.risk) },
        ])
      }),
    ],
  }
}

const participationSheet = (results: SurveyResults, segment: SegmentDefinition): SheetSpec => {
  const rows = participationBySegment(results, segment)
  return {
    name: `Part. ${segment.label}`.slice(0, 31),
    columns: [240, 90, 100, 90, 100],
    rows: [
      titleRow(`Participación por ${segment.label.toLowerCase()}`),
      hintRow(`La norma exige el ${NOM035_REQUIRED_PARTICIPATION} % de participación: los grupos por debajo son el hueco que hay que cerrar.`),
      blankRow,
      headRow([segment.label, 'Invitados', 'Completadas', 'En progreso', 'Participación']),
      ...rows.map((row, index) => dataRow(index, [{ value: row.label }, { value: row.invited }, { value: row.completed }, { value: row.inProgress }, { value: percent(row.rate) }])),
      dataRow(rows.length, [
        { value: 'Total', style: 'label' },
        { value: results.participation.invited, style: 'label' },
        { value: results.participation.completed, style: 'label' },
        { value: results.participation.inProgress, style: 'label' },
        { value: percent(results.participation.rate), style: 'label' },
      ]),
    ],
  }
}

/** El heatmap aplanado: una fila por rama del árbol, una columna por grupo. */
const heatmapSheet = (results: SurveyResults, segment: SegmentDefinition): SheetSpec => {
  const data = heatmapBySegment(results, segment)
  const flatten = (rows: readonly HeatmapRow[]): HeatmapRow[] => rows.flatMap((row) => (row.kind === 'section' ? [row, ...flatten(row.children)] : []))
  const rows = flatten(data.rows)

  return {
    name: `Heatmap ${segment.label}`.slice(0, 31),
    columns: [280, ...data.columns.map(() => 90), 90],
    rows: [
      titleRow(`Matriz de riesgo por ${segment.label.toLowerCase()}`),
      hintRow('Cada celda es el puntaje de riesgo del grupo en esa rama; los grupos bajo el umbral de anonimato se reportan como reservados.'),
      blankRow,
      headRow(['Concepto', ...data.columns.map((column) => column.label), 'Total']),
      ...rows.map((row, index) => {
        const total = row.total === null ? null : riskScoreOf(row.total)
        return dataRow(index, [
          { value: `${'    '.repeat(Math.max(0, row.depth - 1))}${row.numbering}. ${row.label}` },
          ...row.cells.map((cell) => {
            const risk = cell.score === null ? null : riskScoreOf(cell.score)
            return cell.masked ? { value: 'Reservado', style: 'bx' as StyleId } : { value: risk === null ? '—' : formatRisk(risk), style: riskStyle(risk) }
          }),
          { value: total === null ? '—' : formatRisk(total), style: riskStyle(total) },
        ])
      }),
    ],
  }
}

/** Los demográficos que el lector eligió para un bloque, en el orden del catálogo. */
const chosen = (results: SurveyResults, keys: readonly string[]): readonly SegmentDefinition[] => results.segments.filter((segment) => !segment.perPerson && keys.includes(segment.key))

/**
 * El libro de la Guía III: el árbol completo, la gente, y —si el lector los
 * pidió— los cortes por demográfico.
 */
export function buildNom035RiskWorkbook(draft: SurveyDraft, results: SurveyResults, request: ReportRequest): string {
  const context = nom035AnswerContext(draft, results)
  const categories = results.sections

  const sheets: SheetSpec[] = [
    summarySheet(draft, results, request, categories),
    levelSheet('Categorías', 'Resultados por categoría', 'El primer nivel de la Guía III. El puntaje va de 1 a 5 y el 5 es el extremo de riesgo.', levelOf(categories, 1), context),
    levelSheet('Dominios', 'Resultados por dominio', 'El segundo nivel: cada dominio cuelga de una categoría.', levelOf(categories, 2), context),
    levelSheet('Dimensiones', 'Resultados por dimensión', 'El nivel que la norma obliga a vigilar: una dimensión en alto o muy alto dispara el plan de acción.', levelOf(categories, 3), context),
    collaboratorsSheet(categories, context),
  ]

  for (const segment of chosen(results, request.participationSegments)) {
    sheets.push(participationSheet(results, segment))
  }
  for (const segment of chosen(results, request.heatmapSegments)) {
    sheets.push(heatmapSheet(results, segment))
  }

  return workbook(sheets)
}

/**
 * El libro de la Guía I: la lista de casos.
 *
 * Aquí no hay puntaje que promediar. Un solo "Sí" en el cuestionario obliga a
 * canalizar, así que el archivo es el registro de quién queda canalizado, con
 * el área y el líder que tienen que enterarse.
 */
export function buildNom035CasesWorkbook(draft: SurveyDraft, results: SurveyResults): string {
  const roster = channeledRoster(draft, results)
  const channeled = roster.filter((person) => person.channeled)
  const ordered = [...roster].sort((a, b) => Number(b.channeled) - Number(a.channeled) || b.affirmatives - a.affirmatives)

  const summary: SheetSpec = {
    name: 'Resumen',
    columns: [260, 140],
    rows: [
      titleRow(draft.name),
      hintRow('Guía de Referencia I · Acontecimientos traumáticos severos (NOM-035-STPS-2018)'),
      blankRow,
      headRow(['Dato', 'Valor']),
      dataRow(0, [{ value: 'Invitados' }, { value: results.participation.invited }]),
      dataRow(1, [{ value: 'Respuestas completas' }, { value: results.participation.completed }]),
      dataRow(2, [{ value: 'Participación' }, { value: percent(results.participation.rate) }]),
      dataRow(3, [{ value: 'Colaboradores por canalizar' }, { value: channeled.length, style: channeled.length > 0 ? 'neg' : 'pos' }]),
      dataRow(4, [{ value: 'Sin indicadores' }, { value: roster.length - channeled.length, style: 'pos' }]),
      blankRow,
      hintRow('Un solo acontecimiento reportado con síntomas basta para canalizar: la norma no admite promediar estos casos.'),
    ],
  }

  const cases: SheetSpec = {
    name: 'Colaboradores',
    columns: [200, 150, 150, 110, 120, 130],
    rows: [
      titleRow('Resultados por colaborador'),
      hintRow('Ordenados por estado: primero quienes requieren canalización.'),
      blankRow,
      headRow(['Participante', 'Área', 'Líder', 'País', 'Respuestas afirmativas', 'Estado']),
      ...ordered.map((person, index) =>
        dataRow(index, [
          { value: person.name },
          { value: person.area ?? '—' },
          { value: person.leader ?? '—' },
          { value: person.country ?? '—' },
          { value: person.affirmatives },
          {
            value: person.channeled ? 'Por canalizar' : 'Sin indicadores',
            style: person.channeled ? 'neg' : 'pos',
          },
        ]),
      ),
    ],
  }

  return workbook([summary, cases])
}
