import type { IconSvgElement } from "@hugeicons/react";
import {
  ArrowHorizontalIcon,
  CheckListIcon,
  CircleArrowDown01Icon,
  DashboardSpeed01Icon,
  LeftToRightListNumberIcon,
  RadioButtonIcon,
  SlidersHorizontalIcon,
  SmileIcon,
  StarIcon,
  TextAlignLeftIcon,
} from "@hugeicons/core-free-icons";
import type { Tone } from "./tone";
import { LIMITE_ENUNCIADO, largoDe } from "./limites-texto";
import type {
  NpsFollowUps,
  QuestionOption,
  QuestionType,
  RatingType,
  ScaleType,
  SurveyQuestion,
} from "./surveyBuilderTypes";

/**
 * Catalog of question and scale types, plus the factories that keep a question
 * consistent when the author switches type.
 *
 * Everything the editor renders is driven from here — which extra selects to
 * show, which preview to draw, which footer toggles apply — so adding a type is
 * a data change rather than a new branch in the component.
 */

export interface CatalogEntry<T> {
  value: T;
  label: string;
  icon: IconSvgElement;
}

export const QUESTION_TYPES: readonly CatalogEntry<QuestionType>[] = [
  { value: "scale", label: "Escala de valoración", icon: SlidersHorizontalIcon },
  { value: "open", label: "Pregunta abierta", icon: TextAlignLeftIcon },
  { value: "single", label: "Opción única", icon: RadioButtonIcon },
  { value: "multiple", label: "Múltiples respuestas", icon: CheckListIcon },
  { value: "dropdown", label: "Desplegable", icon: CircleArrowDown01Icon },
];

export const SCALE_TYPES: readonly CatalogEntry<ScaleType>[] = [
  { value: "likert", label: "Likert (escala de preferencias)", icon: LeftToRightListNumberIcon },
  { value: "nps", label: "NPS (recomendabilidad)", icon: DashboardSpeed01Icon },
  { value: "stars", label: "Visual por estrellas", icon: StarIcon },
  { value: "emoji", label: "Visual por emociones", icon: SmileIcon },
  { value: "linear", label: "Escala lineal", icon: ArrowHorizontalIcon },
  { value: "likert-nom035", label: "Likert (NOM 035)", icon: LeftToRightListNumberIcon },
];

export const RATING_TYPES: readonly CatalogEntry<RatingType>[] = [
  { value: "frequency", label: "Frecuencia", icon: LeftToRightListNumberIcon },
  { value: "agreement", label: "Grado de acuerdo", icon: LeftToRightListNumberIcon },
  { value: "satisfaction", label: "Satisfacción", icon: LeftToRightListNumberIcon },
  { value: "importance", label: "Importancia", icon: LeftToRightListNumberIcon },
];

/** Steps a respondent sees, per rating type. Drives the Likert preview. */
export const RATING_STEPS: Readonly<Record<RatingType, readonly string[]>> = {
  agreement: [
    "Totalmente en desacuerdo",
    "En desacuerdo",
    "Neutral",
    "De acuerdo",
    "Totalmente de acuerdo",
  ],
  frequency: ["Nunca", "Casi nunca", "A veces", "Casi siempre", "Siempre"],
  satisfaction: [
    "Muy insatisfecho",
    "Insatisfecho",
    "Neutral",
    "Satisfecho",
    "Muy satisfecho",
  ],
  importance: [
    "Nada importante",
    "Poco importante",
    "Algo importante",
    "Importante",
    "Muy importante",
  ],
};

/** NOM 035 uses a fixed frequency scale that authors cannot reword. */
export const NOM_035_STEPS: readonly string[] = [
  "Siempre",
  "Casi siempre",
  "Algunas veces",
  "Casi nunca",
  "Nunca",
];

export const LINEAR_STEPS = 5;
export const STAR_STEPS = 5;
export const EMOJI_STEPS = 5;
export const NPS_MIN = 0;
export const NPS_MAX = 10;

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 200;

const labelOf = <T extends string>(entries: readonly CatalogEntry<T>[], value: T | null): string =>
  entries.find((entry) => entry.value === value)?.label ?? "";

export const questionTypeLabel = (type: QuestionType): string => labelOf(QUESTION_TYPES, type);
export const scaleTypeLabel = (kind: ScaleType | null): string => labelOf(SCALE_TYPES, kind);
export const ratingTypeLabel = (type: RatingType | null): string => labelOf(RATING_TYPES, type);

const iconOf = <T extends string>(
  entries: readonly CatalogEntry<T>[],
  value: T | null
): IconSvgElement | undefined => entries.find((entry) => entry.value === value)?.icon;

/**
 * A question row's mark: what kind of answer it asks for, as an icon on a
 * tinted chip. Each of the five types gets its own accent, so the row's tone
 * alone tells single/multiple/dropdown apart at a glance. A scale shows the
 * icon of the scale it was set to (a gauge for NPS, stars for a star rating),
 * since that is the choice the author made.
 */
export function questionTypeMark(
  type: QuestionType,
  scaleKind: ScaleType | null
): { icon: IconSvgElement; tone: Tone } {
  const tone = questionTypeTone(type);
  if (type === "scale") return { icon: iconOf(SCALE_TYPES, scaleKind) ?? SlidersHorizontalIcon, tone };
  return { icon: iconOf(QUESTION_TYPES, type) ?? RadioButtonIcon, tone };
}

/** The type's accent on its own, for the type chooser inside the editor —
 *  so the card you pick and the chip the closed row then shows are one color. */
export function questionTypeTone(type: QuestionType): Tone {
  if (type === "scale") return "brand";
  if (type === "open") return "neutral";
  if (type === "single") return "positive";
  if (type === "multiple") return "warning";
  return "ai";
}

/** Choice types render an editable list of answer options. */
export const hasOptions = (type: QuestionType): boolean =>
  type === "single" || type === "multiple" || type === "dropdown";

/** Scales whose ends the author labels ("Etiqueta mínima" / "máxima"). */
export const hasEndLabels = (kind: ScaleType | null): boolean =>
  kind === "stars" || kind === "emoji" || kind === "linear";

/** Likert variants ask what the scale measures. */
export const needsRatingType = (kind: ScaleType | null): boolean => kind === "likert";

/** Scales that can chain a follow-up question after the rating. */
export const supportsFollowUps = (kind: ScaleType | null): boolean =>
  kind === "nps" || kind === "stars" || kind === "emoji" || kind === "linear";

/** Opción única, múltiple y desplegable pueden sumar la opción «Otro» con campo para escribirla. */
export const supportsOther = (type: QuestionType): boolean => hasOptions(type);

/** Pregunta de profundidad de una sola línea («¿por qué?»): las de opciones y el Likert. Las demás escalas ya traen las suyas por banda. */
export const supportsDepthWhy = (question: SurveyQuestion): boolean =>
  hasOptions(question.type) || (question.type === "scale" && question.scale.kind === "likert");

export const DEPTH_WHY_DEFAULT = "¿Por qué elegiste esa opción?";
export const OTHER_OPTION_ID = "__otro__";
export const OTHER_OPTION_LABEL = "Otro";

/** Only Likert offers an explicit "no sabe / no responde" step. */
export const supportsDontKnow = (kind: ScaleType | null): boolean =>
  kind === "likert" || kind === "likert-nom035";

const emptyFollowUps = (): NpsFollowUps => ({ detractors: "", neutrals: "", promoters: "" });

export const buildOption = (label = ""): QuestionOption => ({
  id: `opt-${(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15))}`,
  label,
});

/** A question added by hand in the builder: no type yet, so the author picks it (and then the scale and rating). */
export const buildBlankQuestion = (): SurveyQuestion => {
  const base = buildQuestion();
  return { ...base, typePending: true, scale: { ...base.scale, kind: null, ratingType: null } };
};

/** A brand-new question: an unconfigured Likert, the most common case. */
export const buildQuestion = (overrides: Partial<SurveyQuestion> = {}): SurveyQuestion => ({
  id: `q-${(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15))}`,
  statement: "",
  type: "scale",
  required: true,
  scale: {
    kind: "likert",
    ratingType: "agreement",
    minLabel: "",
    maxLabel: "",
    allowDontKnow: false,
    followUpEnabled: false,
    followUps: emptyFollowUps(),
  },
  options: [],
  ...overrides,
});

/**
 * Switches a question's type, filling in whatever the new type needs and
 * leaving the rest untouched so nothing is lost on a round trip.
 */
export function changeQuestionType(question: SurveyQuestion, type: QuestionType): SurveyQuestion {
  const needsSeedOptions = hasOptions(type) && question.options.length < MIN_OPTIONS;

  return {
    ...question,
    type,
    // A scale question never gets its scale (or what hangs from it) chosen for the author: the scale type is required,
    // so it stays unset until they pick it.
    scale: question.scale,
    options: needsSeedOptions
      ? [...question.options, ...Array.from({ length: MIN_OPTIONS - question.options.length }, () => buildOption())]
      : question.options,
  };
}

/** Switches the scale, resetting the settings that do not apply to it. */
/** The end labels a scale starts with, so the author edits them instead of writing them from scratch. */
export const DEFAULT_END_LABELS: Partial<Record<ScaleType, { min: string; max: string }>> = {
  stars: { min: "Muy malo", max: "Excelente" },
  emoji: { min: "Muy insatisfecho", max: "Muy satisfecho" },
  linear: { min: "Nada", max: "Totalmente" },
};

export function changeScaleType(question: SurveyQuestion, kind: ScaleType): SurveyQuestion {
  // Labels the author left empty, or still the previous scale's defaults, take the new scale's defaults.
  const previous = question.scale.kind ? DEFAULT_END_LABELS[question.scale.kind] : undefined;
  const next = DEFAULT_END_LABELS[kind];
  const untouched = (value: string, old?: string) => value.trim() === "" || value === old;
  return {
    ...question,
    scale: {
      ...question.scale,
      minLabel: untouched(question.scale.minLabel, previous?.min) ? (next?.min ?? "") : question.scale.minLabel,
      maxLabel: untouched(question.scale.maxLabel, previous?.max) ? (next?.max ?? "") : question.scale.maxLabel,
      kind,
      // The rating type hangs from the scale and is required too: it is never filled in for the author.
      ratingType: needsRatingType(kind) ? question.scale.ratingType : null,
      followUpEnabled: supportsFollowUps(kind) ? question.scale.followUpEnabled : false,
      allowDontKnow: supportsDontKnow(kind) ? question.scale.allowDontKnow : false,
    },
  };
}

/** A copy of `question` with fresh ids, ready to append next to the original. */
export function duplicateQuestion(question: SurveyQuestion): SurveyQuestion {
  return {
    ...question,
    id: `q-${(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15))}`,
    scale: { ...question.scale, followUps: { ...question.scale.followUps } },
    options: question.options.map((option) => ({ ...option, id: buildOption().id })),
  };
}

/**
 * Whether two questions carry the same content. Used to tell an untouched
 * editor from one with unsaved changes, so options are compared by label and
 * position — a reordered list counts as a change, a re-keyed id does not.
 */
export function isSameQuestion(a: SurveyQuestion, b: SurveyQuestion): boolean {
  if (a.statement !== b.statement || a.type !== b.type || a.required !== b.required) {
    return false;
  }

  if (
    Boolean(a.allowOther) !== Boolean(b.allowOther) ||
    Boolean(a.depthWhyEnabled) !== Boolean(b.depthWhyEnabled) ||
    (a.depthWhyText ?? "") !== (b.depthWhyText ?? "")
  ) {
    return false;
  }

  if (
    a.scale.kind !== b.scale.kind ||
    a.scale.ratingType !== b.scale.ratingType ||
    a.scale.minLabel !== b.scale.minLabel ||
    a.scale.maxLabel !== b.scale.maxLabel ||
    a.scale.allowDontKnow !== b.scale.allowDontKnow ||
    a.scale.followUpEnabled !== b.scale.followUpEnabled ||
    a.scale.followUps.detractors !== b.scale.followUps.detractors ||
    a.scale.followUps.neutrals !== b.scale.followUps.neutrals ||
    a.scale.followUps.promoters !== b.scale.followUps.promoters
  ) {
    return false;
  }

  return (
    a.options.length === b.options.length &&
    a.options.every((option, index) => option.label === b.options[index].label)
  );
}

/** Steps previewed for a Likert question, by rating type. */
export function likertSteps(question: SurveyQuestion): readonly string[] {
  if (question.scale.kind === "likert-nom035") return NOM_035_STEPS;
  return RATING_STEPS[question.scale.ratingType ?? "agreement"];
}

/**
 * Whether a question has everything it needs to be a real, answerable
 * question — not just a row that exists. Drives whether the sections step can
 * be left: a section "with a question" that is actually blank wording, an
 * unset scale (or a scale missing what hangs from it: rating type, end labels,
 * follow-up questions), or empty answer options isn't a question anyone could
 * answer.
 */
export function isQuestionComplete(question: SurveyQuestion): boolean {
  // Empty or shorter than the minimum: both leave the question incomplete.
  if (largoDe(question.statement) < LIMITE_ENUNCIADO.min) return false;
  if (question.typePending) return false;

  if (question.type === "scale") {
    if (question.scale.kind === null) return false;
    if (needsRatingType(question.scale.kind) && question.scale.ratingType === null) return false;
    // What hangs from the scale is required as well: the end labels of the scales that have them…
    if (hasEndLabels(question.scale.kind) && (question.scale.minLabel.trim() === "" || question.scale.maxLabel.trim() === "")) return false;
    // …and, when the follow-ups are on, the three questions for low, middle and high ratings.
    if (question.scale.followUpEnabled && supportsFollowUps(question.scale.kind)) {
      const { detractors, neutrals, promoters } = question.scale.followUps;
      if ([detractors, neutrals, promoters].some((text) => text.trim() === "")) return false;
    }
  }

  if (question.depthWhyEnabled && supportsDepthWhy(question) && (question.depthWhyText ?? "").trim() === "") return false;

  if (hasOptions(question.type)) {
    if (question.options.length < MIN_OPTIONS) return false;
    if (question.options.some((option) => option.label.trim() === "")) return false;
  }

  return true;
}
