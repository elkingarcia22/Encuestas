import { AI_FOCUSES, findFocus } from "./aiSectionThemes";
import {
  AI_BRIEF_LIMITS,
  type AiQuestionStyle,
  type AiScope,
  type AiSectionsBrief,
} from "./aiSectionGenerator";

/**
 * Lo que el chat entiende de lo que el autor escribe.
 *
 * El generador sigue pidiendo el mismo brief de siempre —dónde, qué temas,
 * cómo se responde, de qué tamaño—; lo que cambia es de dónde salen esas
 * respuestas: antes de un formulario de cinco pasos y ahora de una frase. Este
 * archivo es la traducción entre las dos cosas, y vive aparte del panel porque
 * es la única parte del chat que se puede razonar —y corregir— sin abrir la
 * pantalla.
 */

/** Las cuatro decisiones que el generador necesita, en el orden en que se piden. */
export type SectionsCriterionId = "scope" | "focuses" | "style" | "size";

export interface ChatChip {
  label: string;
  value: string;
}

/**
 * Busca una palabra clave como comienzo de palabra, no dentro de otra: «única» no está en
 * «comunicación», ni «ia» en «familia». Las palabras cortas (tres letras o menos) se exigen enteras.
 * (Corrección del playground: el prototipo buscaba subcadenas.)
 */
const hasWord = (text: string, word: string): boolean => {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}${word.length <= 3 ? "\\b" : ""}`).test(text);
};

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/* ------------------------------------------------------------------ *
 * Vocabulario
 * ------------------------------------------------------------------ */

/**
 * Cómo se nombra cada tema fuera del catálogo.
 *
 * Nadie escribe "reconocimiento": escribe "el salario" o "que no valoran lo
 * que hago". Sin estas palabras el chat tendría que preguntar por los temas
 * siempre, que es justo el paso que la conversación viene a ahorrarse.
 */
const FOCUS_KEYWORDS: Readonly<Record<string, readonly string[]>> = {
  liderazgo: ["liderazgo", "lider", "lideres", "jefe", "jefatura", "supervisor", "manager"],
  comunicacion: ["comunicacion", "informacion", "transparencia", "dialogo", "entero", "comunican"],
  reconocimiento: ["reconocimiento", "salario", "sueldo", "compensacion", "equidad", "valoran", "valoracion"],
  desarrollo: ["desarrollo", "carrera", "crecimiento", "aprendizaje", "capacitacion", "formacion", "ascenso"],
  carga: ["carga", "estres", "sobrecarga", "ritmo", "equilibrio", "balance", "horas extra", "burnout"],
  cultura: ["cultura", "valores", "proposito", "pertenencia", "identidad"],
  bienestar: ["bienestar", "salud", "mental", "emocional", "clima", "seguridad"],
  herramientas: ["herramienta", "herramientas", "recursos", "tecnologia", "procesos", "equipos", "sistemas"],
  ia: ["ia", "inteligencia artificial", "automatizacion", "copilot", "chatgpt"],
};

const STYLE_KEYWORDS: readonly { style: AiQuestionStyle; words: readonly string[] }[] = [
  { style: "mixed", words: ["mixta", "mixtas", "combinad", "mezcla", "variada"] },
  { style: "open", words: ["abierta", "abiertas", "libre", "texto libre", "comentario"] },
  { style: "multiple", words: ["multiple", "multiples", "varias opciones", "casillas", "checkbox"] },
  { style: "dropdown", words: ["desplegable", "dropdown", "lista desplegable"] },
  { style: "single", words: ["opcion unica", "unica", "seleccion simple", "una sola opcion"] },
  { style: "scale", words: ["escala", "likert", "acuerdo", "puntuacion", "calificacion", "1 a 5"] },
];

export const STYLE_LABELS: Readonly<Record<AiQuestionStyle, string>> = {
  scale: "Escala de acuerdo",
  single: "Opción única",
  multiple: "Opción múltiple",
  dropdown: "Lista desplegable",
  open: "Abiertas",
  mixed: "Mixtas",
};

const STYLE_HINTS: Readonly<Record<AiQuestionStyle, string>> = {
  scale: "comparables entre sí",
  single: "una sola respuesta",
  multiple: "varias respuestas",
  dropdown: "lista compacta",
  open: "respuesta libre",
  mixed: "escala + una abierta al cierre",
};

export const SCOPE_CHIPS: readonly ChatChip[] = [
  { label: "Esta sección", value: "section" },
  { label: "Toda la encuesta", value: "survey" },
];

export const FOCUS_CHIPS: readonly ChatChip[] = AI_FOCUSES.map((focus) => ({
  label: focus.label,
  value: focus.id,
}));

export const STYLE_CHIPS: readonly ChatChip[] = (
  Object.keys(STYLE_LABELS) as AiQuestionStyle[]
).map((style) => ({
  label: `${STYLE_LABELS[style]} — ${STYLE_HINTS[style]}`,
  value: style,
}));

export const focusLabel = (id: string): string => findFocus(id)?.label ?? id;

export const styleLabel = (style: AiQuestionStyle): string => STYLE_LABELS[style];

/* ------------------------------------------------------------------ *
 * Tamaños
 * ------------------------------------------------------------------ */

export interface SizePreset extends ChatChip {
  sizes: Pick<
    AiSectionsBrief,
    "sectionCount" | "subsectionCount" | "subsubsectionCount" | "questionCount"
  >;
}

/**
 * El tamaño como tres opciones y no como cuatro contadores.
 *
 * Los contadores eran cuatro preguntas seguidas sin respuesta obvia —¿cuántas
 * sub-subsecciones quiere alguien que todavía no ha visto la encuesta?—. En una
 * conversación se ofrece la forma entera, ya armada, y quien tenga un número en
 * la cabeza lo escribe: el parser lo lee igual.
 */
export function sizePresets(scope: AiScope): readonly SizePreset[] {
  if (scope === "section") {
    return [
      {
        label: "Corta — 2 subsecciones × 4 preguntas",
        value: "corta",
        sizes: { sectionCount: 1, subsectionCount: 2, subsubsectionCount: 0, questionCount: 4 },
      },
      {
        label: "Estándar — 3 subsecciones × 5 preguntas",
        value: "estandar",
        sizes: { sectionCount: 1, subsectionCount: 3, subsubsectionCount: 0, questionCount: 5 },
      },
      {
        label: "Completa — 4 subsecciones × 6 preguntas",
        value: "completa",
        sizes: { sectionCount: 1, subsectionCount: 4, subsubsectionCount: 0, questionCount: 6 },
      },
    ];
  }

  return [
    {
      label: "Corta — 2 secciones × 2 subsecciones × 4 preguntas",
      value: "corta",
      sizes: { sectionCount: 2, subsectionCount: 2, subsubsectionCount: 0, questionCount: 4 },
    },
    {
      label: "Estándar — 3 secciones × 3 subsecciones × 5 preguntas",
      value: "estandar",
      sizes: { sectionCount: 3, subsectionCount: 3, subsubsectionCount: 0, questionCount: 5 },
    },
    {
      label: "Completa — 5 secciones × 3 subsecciones × 6 preguntas",
      value: "completa",
      sizes: { sectionCount: 5, subsectionCount: 3, subsubsectionCount: 0, questionCount: 6 },
    },
  ];
}

/* ------------------------------------------------------------------ *
 * Parser
 * ------------------------------------------------------------------ */

const WORD_NUMBERS: Readonly<Record<string, number>> = {
  un: 1,
  una: 1,
  uno: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
};

const NUMBER_PATTERN = `(\\d+|${Object.keys(WORD_NUMBERS).join("|")})`;

const readNumber = (raw: string): number | null => {
  const digits = Number.parseInt(raw, 10);
  if (!Number.isNaN(digits)) return digits;
  return WORD_NUMBERS[raw] ?? null;
};

const clamp = (value: number, { min, max }: { min: number; max: number }): number =>
  Math.max(min, Math.min(max, value));

/** Busca "3 secciones", "cinco preguntas"… y devuelve el número acotado. */
function countFor(text: string, nouns: string, limits: { min: number; max: number }): number | null {
  const match = text.match(new RegExp(`${NUMBER_PATTERN}\\s*(?:${nouns})`));
  if (!match) return null;
  const value = readNumber(match[1]);
  return value === null ? null : clamp(value, limits);
}

/**
 * Lee un mensaje suelto y saca de él todo lo que el brief pueda recibir.
 *
 * Devuelve solo lo que encontró: lo que no aparece queda sin tocar, para que un
 * mensaje posterior —la respuesta a una pregunta del chat— no borre lo que ya
 * se había entendido.
 */
export function parseSectionsMessage(
  text: string,
  options: { canScopeToSection: boolean }
): Partial<AiSectionsBrief> {
  const norm = normalize(text);
  const patch: Partial<AiSectionsBrief> = {};

  // Alcance. Solo se interpreta cuando hay dos posibles: sin sección abierta,
  // "aquí" no significa nada que el generador pueda usar.
  if (options.canScopeToSection) {
    if (/\b(esta seccion|aqui|dentro de la seccion|en esta seccion)\b/.test(norm)) {
      patch.scope = "section";
    } else if (/\b(toda la encuesta|la encuesta completa|encuesta entera|desde cero)\b/.test(norm)) {
      patch.scope = "survey";
    }
  }

  // Temas
  const focuses = AI_FOCUSES.filter((focus) => {
    const words = FOCUS_KEYWORDS[focus.id] ?? [];
    return [...words, normalize(focus.label)].some((word) => hasWord(norm, word));
  }).map((focus) => focus.id);
  if (focuses.length > 0) patch.focuses = focuses;

  // Estilo de respuesta
  const style = STYLE_KEYWORDS.find((entry) => entry.words.some((word) => hasWord(norm, word)));
  if (style) patch.questionStyle = style.style;

  // Tamaño. "subsecciones" se busca antes que "secciones" porque la segunda
  // está contenida en la primera y se la comería.
  const subsubsections = countFor(norm, "sub-?sub-?secciones?", AI_BRIEF_LIMITS.subsubsectionCount);
  const subsections = countFor(norm, "sub-?secciones?|subtemas?", AI_BRIEF_LIMITS.subsectionCount);
  const sections = countFor(norm, "secciones?|bloques?|dimensiones?", AI_BRIEF_LIMITS.sectionCount);
  const questions = countFor(norm, "preguntas?|items?", AI_BRIEF_LIMITS.questionCount);

  if (subsubsections !== null) patch.subsubsectionCount = subsubsections;
  if (subsections !== null) patch.subsectionCount = subsections;
  if (sections !== null) patch.sectionCount = sections;
  if (questions !== null) patch.questionCount = questions;

  return patch;
}

/**
 * Un tamaño a medias es un tamaño: quien pidió "5 preguntas" y nada más no
 * quiere que se le vuelva a preguntar por la forma del árbol, así que los
 * huecos se rellenan con la propuesta estándar de su alcance.
 */
export function completeSizes(brief: AiSectionsBrief): AiSectionsBrief {
  const [, standard] = sizePresets(brief.scope ?? "survey");
  return {
    ...brief,
    sectionCount: brief.sectionCount > 0 ? brief.sectionCount : standard.sizes.sectionCount,
    subsectionCount:
      brief.subsectionCount > 0 ? brief.subsectionCount : standard.sizes.subsectionCount,
    questionCount: brief.questionCount > 0 ? brief.questionCount : standard.sizes.questionCount,
  };
}

export function mergeBrief(
  brief: AiSectionsBrief,
  patch: Partial<AiSectionsBrief>
): AiSectionsBrief {
  return { ...brief, ...patch };
}

/** Lo que todavía falta, en el orden en que tiene sentido preguntarlo. */
export function missingSectionsCriteria(
  brief: AiSectionsBrief,
  canScopeToSection: boolean
): SectionsCriterionId[] {
  const missing: SectionsCriterionId[] = [];
  if (canScopeToSection && brief.scope === null) missing.push("scope");
  if (brief.focuses.length === 0) missing.push("focuses");
  if (brief.questionStyle === null) missing.push("style");
  const hasSize =
    brief.sectionCount > 0 ||
    brief.subsectionCount > 0 ||
    brief.subsubsectionCount > 0 ||
    brief.questionCount > 0;
  if (!hasSize) missing.push("size");
  return missing;
}

/* ------------------------------------------------------------------ *
 * Cómo se cuenta lo entendido
 * ------------------------------------------------------------------ */

/**
 * "Entendido: en esta sección · liderazgo y comunicación · 5 preguntas".
 *
 * El chat repite lo que entendió antes de preguntar lo que falta: es la única
 * forma de que el autor corrija una lectura equivocada antes de que se
 * convierta en veinte preguntas que no pidió.
 */
export function describeUnderstood(patch: Partial<AiSectionsBrief>): string[] {
  const parts: string[] = [];
  if (patch.scope) {
    parts.push(patch.scope === "section" ? "en esta sección" : "en toda la encuesta");
  }
  if (patch.focuses && patch.focuses.length > 0) {
    parts.push(joinNatural(patch.focuses.map(focusLabel)));
  }
  if (patch.questionStyle) {
    parts.push(styleLabel(patch.questionStyle).toLowerCase());
  }
  const sizeBits: string[] = [];
  if (patch.sectionCount) sizeBits.push(plural(patch.sectionCount, "sección", "secciones"));
  if (patch.subsectionCount)
    sizeBits.push(plural(patch.subsectionCount, "subsección", "subsecciones"));
  if (patch.questionCount) sizeBits.push(plural(patch.questionCount, "pregunta", "preguntas"));
  if (sizeBits.length > 0) parts.push(sizeBits.join(" × "));
  return parts;
}

/** El resumen que el chat dice justo antes de generar. */
export function describeBrief(brief: AiSectionsBrief): string {
  const where = brief.scope === "section" ? "en esta sección" : "en la encuesta";
  const temas = joinNatural(brief.focuses.map(focusLabel));
  const forma =
    brief.scope === "section"
      ? `${plural(brief.subsectionCount, "subsección", "subsecciones")} con ${plural(
          brief.questionCount,
          "pregunta",
          "preguntas"
        )} cada una`
      : `${plural(brief.sectionCount, "sección", "secciones")} × ${plural(
          brief.subsectionCount,
          "subsección",
          "subsecciones"
        )} × ${plural(brief.questionCount, "pregunta", "preguntas")}`;
  return `${temas} ${where}: ${forma}, ${styleLabel(
    brief.questionStyle ?? "scale"
  ).toLowerCase()}.`;
}

function joinNatural(items: readonly string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

const plural = (count: number, singular: string, many: string): string =>
  `${count} ${count === 1 ? singular : many}`;
