import { isDemographicComplete } from "./demographics";
import { LIMITE_NOMBRE_ENCUESTA, largoDe } from "./limites-texto";
import { totalParticipantCount } from "./participants";
import type { SurveyDraft } from "./surveyBuilderTypes";
import { inicioVencidoEnBorrador } from "./inicio-vencido";

/**
 * Survey builder stepper — the left panel as a sequence of steps.
 *
 * Steps fall into two groups that behave differently on purpose:
 *
 *   obligatorio  a numbered path walked in order. Each step unlocks once every
 *                previous one is complete, so the number means something.
 *   opcional     the welcome and closing pages. Always reachable — locking
 *                something optional behind progress would contradict calling
 *                it optional — and never numbered, so they stay out of the
 *                count the author is working through.
 *
 * Whether an optional page is switched on lives in its own editor, not here:
 * the menu answers "where am I", not "is this on".
 */

export type StepperStepId =
  | "general"
  | "demographics"
  | "sections"
  | "participants"
  | "pages";

/**
 * The numbered path. Order is the gate: index N needs 0…N-1 complete.
 *
 * Participants comes early because it is a decision about scope, not content:
 * who the survey is for shapes what is worth asking, so it belongs before the
 * questions rather than as an afterthought once they are written.
 */
export const REQUIRED_STEPS: readonly StepperStepId[] = [
  "general",
  "participants",
  "demographics",
  "sections",
];

/** Always reachable, never numbered. */
export const OPTIONAL_STEPS: readonly StepperStepId[] = ["pages"];

/** Every step, in menu order — required first, then optional. */
export const STEPPER_ORDER: readonly StepperStepId[] = [
  ...REQUIRED_STEPS,
  ...OPTIONAL_STEPS,
];

export const isOptionalStep = (step: StepperStepId): boolean =>
  OPTIONAL_STEPS.includes(step);

/**
 * 1-based position in the entire stepper sequence. All steps now have numbers
 * for visual consistency, including optional ones.
 */
export function stepNumber(step: StepperStepId): number | null {
  const index = STEPPER_ORDER.indexOf(step);
  return index === -1 ? null : index + 1;
}

export interface StepperStatusInput {
  draft: SurveyDraft;
  /** Step ids the author has already visited. */
  visitedSteps: ReadonlySet<StepperStepId>;
  /** At least one section with at least one question, across the whole tree. */
  hasSectionWithQuestion: boolean;
  /** Every section has at least one question (no empty sections). */
  allSectionsHaveQuestions: boolean;
  /** Every question across the whole tree has its required fields filled in. */
  allQuestionsComplete: boolean;
  /** No section or subsection title is shorter than the minimum (an empty one is fine: it is optional). */
  allSectionTitlesValid?: boolean;
}

export type StepState = "complete" | "active" | "locked" | "available";

/**
 * Whether a step is done.
 *
 * Steps with content of their own are judged on that content. Steps configured
 * elsewhere in the wizard count as done the first time they are opened — the
 * author has seen them, which is all this panel can honestly assert.
 */
export function isStepComplete(
  step: StepperStepId,
  { draft, hasSectionWithQuestion, allSectionsHaveQuestions, allQuestionsComplete, allSectionTitlesValid }: StepperStatusInput
): boolean {
  switch (step) {
    case "general":
      return (
        largoDe(draft.name) >= LIMITE_NOMBRE_ENCUESTA.min &&
        draft.startDate !== "" &&
        draft.endDate !== "" &&
        // El cierre no puede ser antes del inicio; el mismo día sí vale (encuesta de un solo día, CRE-037).
        draft.endDate >= draft.startDate &&
        // Un borrador con el inicio en el pasado no se programa hasta elegir fechas nuevas (CRE-120).
        !inicioVencidoEnBorrador(draft) &&
        draft.kind !== null
      );
    // Datos demográficos no es obligatorio: no hace falta abrirlo ni activar nada. Solo bloquea un dato
    // a medias (sin enunciado u opciones). NOM 035 es la excepción: pide al menos un dato.
    case "demographics": {
      const isNom035 = esNom035(draft);
      const areFieldsComplete = draft.demographics.fields.every(isDemographicComplete);

      if (isNom035) {
        return draft.demographics.enabled && draft.demographics.fields.length > 0 && areFieldsComplete;
      }
      return areFieldsComplete;
    }
    case "sections":
      return hasSectionWithQuestion && allSectionsHaveQuestions && allQuestionsComplete && allSectionTitlesValid !== false;
    // En el prototipo este paso nunca bloqueaba, pero su guía de uso pide al menos un participante
    // («Selecciona al menos un participante para continuar.»): aquí manda la guía.
    case "participants":
      return totalParticipantCount(draft.participants) > 0;
    // Optional pages carry content of their own, so they are judged on that
    // content while switched on — an enabled page with nothing on it isn't a
    // page anyone finished. Switched off, they are vacuously done.
    case "pages":
      return true;
  }
}

/**
 * Whether a step is reachable. Optional steps require the whole required path
 * to be complete before they open: the welcome and closing pages cap the
 * wizard, so an author shouldn't land on them while a required step is still
 * unfinished — a welcome page written before any questions exist would greet a
 * survey that can't be taken. Within the required path, a step needs every
 * earlier required step complete; optional ones never stand in the path.
 */
export function isStepReachable(
  step: StepperStepId,
  input: StepperStatusInput
): boolean {
  if (isOptionalStep(step)) {
    return REQUIRED_STEPS.every((required) => isStepComplete(required, input));
  }

  const index = REQUIRED_STEPS.indexOf(step);
  return REQUIRED_STEPS.slice(0, index).every((previous) =>
    isStepComplete(previous, input)
  );
}

/** Visual state for a single step. */
export function getStepState(
  step: StepperStepId,
  input: StepperStatusInput,
  activeStep: StepperStepId
): StepState {
  if (step === activeStep) return "active";
  if (!isStepReachable(step, input)) return "locked";
  
  // A step shouldn't look complete if the author hasn't even seen it yet,
  // even if its default content happens to be valid.
  if (!input.visitedSteps.has(step)) {
    return isOptionalStep(step) ? "locked" : "available";
  }

  if (isStepComplete(step, input)) return "complete";
  return "available";
}

/** Resolves which step the current selection points at. */
export function stepFromSelection(selection: {
  kind: string;
  id?: string;
}): StepperStepId {
  return selection.kind === "section" || selection.kind === "sections-empty"
    ? "sections"
    : (selection.id as StepperStepId);
}

/** Una NOM 035 (plantilla de la norma, de solo lectura, o con «NOM 035» en el nombre): pide al menos un dato demográfico (PAR-107). */
export function esNom035(draft: Pick<SurveyDraft, "isReadOnly" | "name">): boolean {
  return draft.isReadOnly === true || draft.name.toLowerCase().includes("nom 035");
}
