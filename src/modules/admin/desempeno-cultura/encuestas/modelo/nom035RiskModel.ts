import type { SurveyDraft } from "./surveyBuilder";
import {
  buildAnswerMatrix,
  buildQuestionBreakdowns,
  buildRespondents,
  type AnswerMatrix,
  type QuestionBreakdown,
  type Respondent,
} from "./questionResponses";
import type { SectionResult, SurveyResults } from "./surveyResults";
import { riskScoreOf } from "./nom035Scale";

/**
 * El riesgo persona a persona de la Guía de Referencia III.
 *
 * Vivía dentro de la pestaña de Riesgo psicosocial, pero los reportes lo
 * necesitan igual: el XLSX imprime una fila por colaborador y el PDF individual
 * una página por persona. Sacarlo a un módulo propio es lo que garantiza que el
 * número junto a un nombre en la pantalla y en el archivo sea el mismo — si el
 * reporte lo recalculara por su cuenta, dos fuentes terminarían discrepando
 * justo en el caso que hay que mirar primero.
 */

export interface CollaboratorDimensionRisk {
  id: string;
  label: string;
  /** Null cuando la persona no contestó ninguna pregunta de esta dimensión. */
  risk: number | null;
}

export interface CollaboratorRisk {
  respondent: Respondent;
  /**
   * La más alta de sus dimensiones contestadas, no el promedio entre ellas.
   * Null si no contestó ninguna.
   *
   * Mismo criterio que la canalización de acontecimientos traumáticos: basta
   * una dimensión en un nivel alto para que la persona misma quede en ese
   * nivel, así "Muy alto" en Colaboradores siempre incluye a quien tiene al
   * menos una dimensión ahí — promediar la habría diluido entre las otras
   * doce y escondido justo al caso que hay que mirar primero.
   */
  risk: number | null;
  dimensions: readonly CollaboratorDimensionRisk[];
}

/** Toda la rama, aplanada. */
export function flattenSections(sections: readonly SectionResult[]): SectionResult[] {
  return sections.flatMap((section) => [section, ...flattenSections(section.children)]);
}

/**
 * Las dimensiones —el nivel más fino de la jerarquía— son la unidad que la
 * norma pide vigilar.
 */
export const nom035Dimensions = (
  sections: readonly SectionResult[]
): readonly SectionResult[] =>
  flattenSections(sections).filter((section) => section.depth === 3 && section.n > 0);

/**
 * El riesgo de una persona, dimensión por dimensión.
 *
 * Misma fuente que el resto del informe — la asignación exacta de
 * `buildAnswerMatrix`, no un promedio aparte — así que el número que aparece
 * junto a un nombre aquí es consistente con el que esa misma respuesta pesa en
 * el mapa de calor y en el árbol de categorías.
 */
export function collaboratorRiskOf(
  respondent: Respondent,
  dimensions: readonly SectionResult[],
  breakdowns: ReadonlyMap<string, QuestionBreakdown>,
  matrix: AnswerMatrix
): CollaboratorRisk {
  const dimensionRisks = dimensions.map((dimension) => {
    const values: number[] = [];
    for (const question of dimension.questions) {
      const breakdown = breakdowns.get(question.id);
      if (!breakdown || breakdown.scaleKind !== "likert-nom035") continue;
      const tallyId = matrix.pick.get(`${respondent.id}|${question.id}`);
      const tally = breakdown.tallies.find((candidate) => candidate.id === tallyId);
      if (!tally || tally.isNsNr) continue;
      const value = Number.parseInt(tally.shortLabel, 10);
      if (!Number.isNaN(value)) values.push(value);
    }
    const risk =
      values.length === 0
        ? null
        : riskScoreOf(values.reduce((sum, value) => sum + value, 0) / values.length);
    return { id: dimension.id, label: dimension.title, risk };
  });

  const scored = dimensionRisks.filter(
    (dimension): dimension is CollaboratorDimensionRisk & { risk: number } => dimension.risk !== null
  );
  const risk = scored.length === 0 ? null : Math.max(...scored.map((dimension) => dimension.risk));

  return { respondent, risk, dimensions: dimensionRisks };
}

/**
 * El listado completo de colaboradores con su riesgo, de una sola llamada.
 *
 * Es el camino que usan los reportes: la pestaña ya tiene calculadas sus
 * piezas y las pasa una a una, pero un archivo se genera fuera de React y no
 * tiene dónde memorizarlas.
 */
export function nom035CollaboratorRisks(
  draft: SurveyDraft,
  results: SurveyResults,
  sections: readonly SectionResult[]
): readonly CollaboratorRisk[] {
  const respondents = buildRespondents(draft, results);
  const breakdowns = buildQuestionBreakdowns(draft, results);
  const matrix = buildAnswerMatrix(respondents, breakdowns);
  const dimensions = nom035Dimensions(sections);
  return respondents.map((respondent) =>
    collaboratorRiskOf(respondent, dimensions, breakdowns, matrix)
  );
}

/** Todas las preguntas de una rama, incluidas las de sus descendientes. */
export const branchQuestions = (section: SectionResult) =>
  flattenSections([section]).flatMap((node) => node.questions);

/**
 * El riesgo de una persona dentro de una rama cualquiera del árbol.
 *
 * `collaboratorRiskOf` responde por dimensión porque es el nivel que la norma
 * obliga a vigilar; una categoría o un dominio agrupan varias, así que su
 * lectura por persona tiene que promediar todas las preguntas de la rama, no
 * solo las que cuelgan directamente del nodo.
 */
export function branchRiskForPerson(
  respondentId: string,
  section: SectionResult,
  breakdowns: ReadonlyMap<string, QuestionBreakdown>,
  matrix: AnswerMatrix
): number | null {
  const values: number[] = [];
  for (const question of branchQuestions(section)) {
    const breakdown = breakdowns.get(question.id);
    if (!breakdown || breakdown.scaleKind !== "likert-nom035") continue;
    const tallyId = matrix.pick.get(`${respondentId}|${question.id}`);
    const tally = breakdown.tallies.find((candidate) => candidate.id === tallyId);
    if (!tally || tally.isNsNr) continue;
    const value = Number.parseInt(tally.shortLabel, 10);
    if (!Number.isNaN(value)) values.push(value);
  }
  if (values.length === 0) return null;
  return riskScoreOf(values.reduce((sum, value) => sum + value, 0) / values.length);
}

/**
 * Cuántas personas quedan en riesgo alto o muy alto dentro de una rama.
 *
 * Es la cifra que encabeza cada fila del reporte: la norma no pregunta cuánto
 * promedia una categoría sino a cuánta gente le está pasando, y un promedio
 * tranquilo puede esconder a un grupo entero en el extremo.
 */
export function peopleAtRiskIn(
  section: SectionResult,
  respondents: readonly Respondent[],
  breakdowns: ReadonlyMap<string, QuestionBreakdown>,
  matrix: AnswerMatrix
): { atRisk: number; answered: number } {
  let atRisk = 0;
  let answered = 0;
  for (const respondent of respondents) {
    const risk = branchRiskForPerson(respondent.id, section, breakdowns, matrix);
    if (risk === null) continue;
    answered += 1;
    if (risk >= 3.5) atRisk += 1;
  }
  return { atRisk, answered };
}

/** Las tres piezas que todo reporte de la Guía III vuelve a necesitar. */
export function nom035AnswerContext(draft: SurveyDraft, results: SurveyResults) {
  const respondents = buildRespondents(draft, results);
  const breakdowns = buildQuestionBreakdowns(draft, results);
  const matrix = buildAnswerMatrix(respondents, breakdowns);
  return { respondents, breakdowns, matrix };
}
