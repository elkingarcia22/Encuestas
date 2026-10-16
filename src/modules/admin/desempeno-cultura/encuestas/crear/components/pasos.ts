import { STEPPER_ORDER, isStepComplete, isStepReachable, type StepperStatusInput, type StepperStepId } from '../../modelo/stepper'
import { countQuestions } from '../../modelo/sectionTree'
import { isQuestionComplete } from '../../modelo/questionCatalog'
import { LIMITE_TITULO_SECCION, cortoDeMinimo } from '../../modelo/limites-texto'
import type { SurveyDraft, SurveyQuestion, SurveySection } from '../../modelo/surveyBuilderTypes'

// Los cinco pasos del constructor y lo que dice la barra cuando falta algo. Los textos son los del
// prototipo, tal cual: la guía de uso los cita para probar cada bloqueo.

export type PasoId = StepperStepId

// La descripción va bajo el título de la pantalla y cambia con el paso: dice qué se decide en él.
export const PASOS: { id: PasoId; titulo: string; descripcion: string }[] = [
  { id: 'general', titulo: 'Datos generales', descripcion: 'Ponle nombre a la encuesta, elige su tipo y define cuándo se abre y se cierra.' },
  { id: 'participants', titulo: 'Participantes', descripcion: 'Elige quién responde: toda la empresa, grupos o personas, o una lista desde un archivo.' },
  { id: 'demographics', titulo: 'Datos demográficos', descripcion: 'Decide con qué datos de cada persona vas a cruzar los resultados.' },
  { id: 'sections', titulo: 'Secciones y preguntas', descripcion: 'Arma las secciones y las preguntas que van a responder los participantes.' },
  { id: 'pages', titulo: 'Bienvenida y cierre', descripcion: 'Escribe lo que ven los participantes al empezar y al terminar la encuesta.' },
]

export const indiceDe = (paso: PasoId) => STEPPER_ORDER.indexOf(paso)

// Lo que falta para pasar, al pulsar «Continuar» o un paso más adelante.
export const FALTA_PARA_CONTINUAR: Record<PasoId, string> = {
  general: 'Completa el nombre, el tipo y las fechas de la encuesta para continuar.',
  participants: 'Selecciona al menos un participante para continuar.',
  demographics: 'Completa los datos demográficos que agregaste para continuar.',
  sections: 'Añade al menos una sección con preguntas para continuar.',
  pages: 'Completa los pasos anteriores para desbloquear este paso.',
}

export const SECCION_VACIA = 'Todas las secciones deben tener al menos una pregunta para continuar.'
export const PREGUNTA_INCOMPLETA = 'Completa los campos obligatorios de la pregunta señalada.'
export const TITULO_CORTO = `Los títulos de las secciones deben tener al menos ${LIMITE_TITULO_SECCION.min} caracteres.`

// La frase base de cada paso en el resumen de «Finalizar».
export const FALTA_PARA_FINALIZAR: Record<PasoId, string> = {
  general: 'Completa el nombre, el tipo y las fechas de la encuesta',
  participants: 'Selecciona al menos un participante para finalizar',
  demographics: 'Completa los datos demográficos que agregaste',
  sections: 'Añade al menos una sección con preguntas',
  pages: '',
}

// Una sección vale si tiene preguntas propias o si todo lo que cuelga de ella las tiene: una
// sección contenedora con subsecciones llenas es válida; una sin preguntas ni subsecciones, no.
export const seccionLlena = (seccion: SurveySection): boolean =>
  seccion.questions.length > 0 || (seccion.children.length > 0 && seccion.children.every(seccionLlena))

// Una pregunta completa, con la regla del motor. El enunciado del banco llega con marcado: se mira
// solo su texto.
const completa = (pregunta: SurveyQuestion) => isQuestionComplete({ ...pregunta, statement: pregunta.statement.replace(/<[^>]*>/g, '') })

// El título de una sección es opcional; si tiene algo escrito, debe llegar al mínimo.
const titulosValidos = (secciones: readonly SurveySection[]): boolean =>
  secciones.every((seccion) => !cortoDeMinimo(seccion.title, LIMITE_TITULO_SECCION.min) && titulosValidos(seccion.children))

const preguntasCompletas = (secciones: readonly SurveySection[]): boolean =>
  secciones.every((seccion) => seccion.questions.every(completa) && preguntasCompletas(seccion.children))

/** Los ids de todas las preguntas incompletas, en el orden del árbol: las que se marcan en rojo al intentar avanzar. */
export function preguntasIncompletas(secciones: readonly SurveySection[]): string[] {
  return secciones.flatMap((seccion) => [...seccion.questions.filter((pregunta) => !completa(pregunta)).map((pregunta) => pregunta.id), ...preguntasIncompletas(seccion.children)])
}

/** La primera pregunta incompleta, en el orden del árbol: la que «Finalizar» abre para revisar. */
export function primeraIncompleta(secciones: readonly SurveySection[]): string | null {
  for (const seccion of secciones) {
    const propia = seccion.questions.find((pregunta) => !completa(pregunta))
    if (propia) return propia.id
    const enHijas = primeraIncompleta(seccion.children)
    if (enHijas) return enHijas
  }
  return null
}

export function estadoDelBorrador(borrador: SurveyDraft, visitados: ReadonlySet<PasoId>): StepperStatusInput {
  return {
    draft: borrador,
    visitedSteps: visitados,
    hasSectionWithQuestion: countQuestions(borrador.sections) > 0,
    allSectionsHaveQuestions: borrador.sections.every(seccionLlena),
    allQuestionsComplete: preguntasCompletas(borrador.sections),
    allSectionTitlesValid: titulosValidos(borrador.sections),
  }
}

export const pasoCompleto = (paso: PasoId, estado: StepperStatusInput) => isStepComplete(paso, estado)
export const pasoAlcanzable = (paso: PasoId, estado: StepperStatusInput) => isStepReachable(paso, estado)

/** El primer paso obligatorio que falta, y el mensaje de por qué. */
export function primerPendiente(estado: StepperStatusInput, hasta: PasoId): { paso: PasoId; mensaje: string } | null {
  for (const paso of STEPPER_ORDER.slice(0, indiceDe(hasta) + 1)) {
    if (paso === 'pages') continue
    if (pasoCompleto(paso, estado)) continue
    if (paso === 'sections' && estado.hasSectionWithQuestion && !estado.allSectionsHaveQuestions) return { paso, mensaje: SECCION_VACIA }
    if (paso === 'sections' && estado.hasSectionWithQuestion && !estado.allQuestionsComplete) return { paso, mensaje: PREGUNTA_INCOMPLETA }
    if (paso === 'sections' && estado.hasSectionWithQuestion && estado.allSectionTitlesValid === false) return { paso, mensaje: TITULO_CORTO }
    return { paso, mensaje: FALTA_PARA_CONTINUAR[paso] }
  }
  return null
}

/**
 * «Finalizar» revisa los cinco pasos a la vez: todos los que fallan se marcan en rojo y sale un solo
 * mensaje con el primero y cuántos más quedan.
 */
export function resumenFinalizar(estado: StepperStatusInput): { fallidos: PasoId[]; mensaje: string } {
  const fallidos = STEPPER_ORDER.filter((paso) => paso !== 'pages' && !pasoCompleto(paso, estado))
  if (fallidos.length === 0) return { fallidos, mensaje: '' }
  const primero = fallidos[0]
  const base =
    primero === 'sections' && estado.hasSectionWithQuestion && !estado.allQuestionsComplete
      ? 'Completa los campos obligatorios de la pregunta señalada'
      : primero === 'sections' && estado.hasSectionWithQuestion && estado.allSectionsHaveQuestions && estado.allSectionTitlesValid === false
        ? TITULO_CORTO.slice(0, -1)
        : FALTA_PARA_FINALIZAR[primero]
  const resto = fallidos.length - 1
  return { fallidos, mensaje: resto === 0 ? `${base}.` : `${base} y ${resto} ${resto === 1 ? 'paso más' : 'pasos más'} por completar.` }
}
