import type { SurveyDraft } from '../surveyBuilderTypes'
import type { SurveyResults } from '../surveyResults'
import { buildAnswerMatrix, buildQuestionBreakdowns, buildRespondents, screeningPositives, type Respondent } from '../questionResponses'

/**
 * A quién hay que canalizar, tras la Guía de Referencia I.
 *
 * La regla de la Guía I es que un solo "Sí" ya obliga a canalizar, así que el
 * veredicto se cuenta sobre las mismas respuestas que muestra la pestaña de
 * Preguntas y la de Canalización: el libro de casos y la pantalla no pueden
 * discrepar en quién queda canalizado.
 *
 * `buildRespondents` solo devuelve a quien respondió: quien no contestó no
 * aparece aquí, y ese es justo el hueco que la norma no perdona.
 */
export interface ChanneledPerson extends Respondent {
  channeled: boolean
  /** A cuántas preguntas contestó "Sí". Una basta para canalizar. */
  affirmatives: number
}

export function channeledRoster(draft: SurveyDraft, results: SurveyResults): readonly ChanneledPerson[] {
  const respondents = buildRespondents(draft, results)
  const breakdowns = buildQuestionBreakdowns(draft, results)
  const positives = screeningPositives(breakdowns, buildAnswerMatrix(respondents, breakdowns))

  return respondents.map((person) => {
    const affirmatives = positives.get(person.id) ?? 0
    return { ...person, affirmatives, channeled: affirmatives > 0 }
  })
}
