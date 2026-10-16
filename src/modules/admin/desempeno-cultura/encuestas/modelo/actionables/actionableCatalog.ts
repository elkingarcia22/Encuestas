import {
  Mortarboard01Icon,
  SearchList01Icon,
  StethoscopeIcon,
  Target02Icon,
  UserSearch01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { Tone } from "../tone";
import type { AlertTarget } from "../summaryModel";
import type { ScaleLegendItem, ScaleTone } from "../favorabilityScale";

/**
 * Qué es un accionable y a qué módulo puede llegar.
 *
 * Aquí viven solo la forma y el vocabulario: los accionables concretos no se
 * escriben, se derivan de la medición en `buildActionables.ts`. Un catálogo
 * fijo diría "plan de formación" en todas las encuestas; lo que el usuario
 * necesita leer es "plan de formación en Liderazgo para los 11 líderes,
 * porque esa sección quedó en 42%".
 */

export type ActionableModuleId = "desempeno" | "aprendizaje" | "seleccion" | "diagnostico";

export interface ActionableModule {
  id: ActionableModuleId;
  label: string;
  /** Una línea sobre qué clase de acciones dispara este módulo. */
  description: string;
  icon: IconSvgElement;
  tone: Tone;
}

/**
 * Orden de las estanterías: primero Desempeño, que es donde vive el ciclo.
 *
 * Las encuestas de pulso no son un módulo aparte: medir el clima, fijar el
 * objetivo, evaluar en 360 y ubicar a la persona en la matriz son cuatro
 * momentos del mismo producto. Separarlos obligaba a leer "Encuestas" y
 * "Desempeño" como dos destinos cuando el pulso existe, precisamente, para
 * comprobar si el objetivo se cumplió.
 */
export const ACTIONABLE_MODULES: readonly ActionableModule[] = [
  {
    id: "desempeno",
    label: "Desempeño",
    description:
      "Pulsos, objetivos, evaluación 360 y matriz de talento: medir el clima y volverlo un entregable del líder.",
    icon: Target02Icon,
    tone: "brand",
  },
  {
    id: "aprendizaje",
    label: "Aprendizaje",
    description: "Planes, rutas y contenido: formación construida sobre lo que la gente pidió.",
    icon: Mortarboard01Icon,
    tone: "violet",
  },
  {
    id: "seleccion",
    label: "Selección",
    description: "Dashboard y plantillas de entrevista: lo que se dice al entrar y al salir mejora el sourcing.",
    icon: UserSearch01Icon,
    tone: "warning",
  },
  {
    id: "diagnostico",
    label: "Diagnóstico",
    description: "Assessments: soporte escalonado en bienestar antes de que el talento colapse.",
    icon: StethoscopeIcon,
    tone: "neutral",
  },
];

export const MODULE_BY_ID: Readonly<Record<ActionableModuleId, ActionableModule>> = Object.fromEntries(
  ACTIONABLE_MODULES.map((module) => [module.id, module])
) as Record<ActionableModuleId, ActionableModule>;

/* ------------------------------------------------------------- población */

/** Alguien —o algún grupo— dentro de la población que recibe la acción. */
export interface AudienceMember {
  id: string;
  name: string;
  /** Su área, su equipo o cuánta gente representa. */
  meta: string;
}

/**
 * A quién alcanza la acción.
 *
 * Un accionable sin población es una intención; con ella es una decisión —
 * "17 líderes" y "los 84 de Operaciones" se aprueban distinto. Por eso
 * `members` existe: el lector tiene que poder desplegar y ver *quiénes*
 * antes de encender nada.
 */
export interface ActionableAudience {
  /** "11 líderes con equipo a cargo", "77 colaboradores de Operaciones". */
  label: string;
  /** Cuánta gente alcanza. 0 cuando no se puede contar. */
  people: number;
  /** De qué corte sale: "Área · Operaciones", "Toda la medición". */
  source: string;
  /** La lista concreta, desplegable. Vacía cuando la población no es nominal. */
  members: readonly AudienceMember[];
  /** Cómo se llama lo que hay en la lista: "líderes", "colaboradores", "áreas". */
  memberNoun: string;
}

/** Una cifra de la medición que sostiene el accionable. */
export interface ActionableEvidence {
  label: string;
  value: string;
  /** La pestaña donde el lector puede comprobarla. */
  target?: AlertTarget;
}

/**
 * La tarea que el accionable crea. **Todos** la tienen.
 *
 * Tareas es el mecanismo por el que el producto se conecta: un plan de
 * formación asignado no es trabajo hecho, es trabajo pendiente, y la tarea es
 * lo que lo vuelve seguible. Solo se marca cuando el entregable está completo,
 * así que `completion` no es una fecha — es una condición.
 */
export interface ActionableTask {
  /** A quién se le asigna: "Cada uno de los 11 líderes". */
  assignee: string;
  /** Cómo se llama la tarea en su bandeja. */
  title: string;
  /** Qué tiene que pasar para que quede en check. */
  completion: string;
}

/** Una línea de lo que queda montado: un curso, un resultado clave, una pregunta. */
export interface DeliverableItem {
  id: string;
  label: string;
  /** Duración, formato, meta — lo que distingue una línea de la siguiente. */
  meta?: string;
}

/**
 * Lo que el accionable deja hecho en el módulo destino, desplegado.
 *
 * Si es un plan de formación hay que poder ver los cursos; si son objetivos,
 * los resultados clave; si es un pulso, las preguntas. Aprobar a ciegas lo que
 * se va a publicar en nombre de RRHH no es una decisión, es un acto de fe.
 */
export interface ActionableDeliverable {
  /** "3 cursos del plan", "1 objetivo y 3 resultados clave". */
  title: string;
  icon: IconSvgElement;
  items: readonly DeliverableItem[];
}

export interface Actionable {
  id: string;
  module: ActionableModuleId;
  /** La funcionalidad concreta dentro del módulo: "Planes", "Objetivos"… */
  feature: string;
  icon: IconSvgElement;
  /** El titular, ya con el tema y la población dentro. */
  title: string;
  /** Qué señal de *esta* medición lo dispara, con sus cifras. */
  trigger: string;
  /** Qué queda montado en el módulo destino si se activa. */
  outcome: string;
  /** Valor estratégico para UX y producto, 0–100. */
  score: number;
  /** Por qué vale la pena: la justificación de producto. */
  rationale: string;
  audience: ActionableAudience;
  /** Los temas concretos a trabajar, sacados de las preguntas peor evaluadas. */
  topics: readonly string[];
  evidence: readonly ActionableEvidence[];
  deliverable: ActionableDeliverable;
  task: ActionableTask;
  /**
   * Cómo se lee su avance: "completaron el plan", "aceptaron el objetivo".
   *
   * La parada de Seguimiento cuenta siempre lo mismo —cuántos de cuántos—,
   * pero decir "completaron la tarea" en los catorce borra justo el hecho de
   * qué es lo que está a medias.
   */
  progressLabel: string;
  /**
   * La acción la ejecuta la IA, no una plantilla del módulo.
   *
   * Cambia el tono de la ficha al degradado de IA, que el producto reserva
   * para acciones donde la IA genera algo —no para temas *sobre* IA—, así que
   * marcarlo aquí es lo que hace que se vea distinto sin excepciones sueltas
   * repartidas por los componentes.
   */
  ai?: boolean;
  /** Cuándo sugiere lanzarse; el usuario puede cambiarlo al activar. */
  suggestedLaunch: LaunchTiming;
  /** La cadencia que la señal sugiere; el usuario puede cambiarla al activar. */
  suggestedCadence: ReminderCadence;
}

export const MAX_SCORE = 100;

/** El tono con el que se dibuja un accionable: el de su módulo, salvo IA. */
export const actionableTone = (actionable: Actionable): Tone =>
  actionable.ai ? "ai" : MODULE_BY_ID[actionable.module].tone;

/* ----------------------------------------------------------- activación */

/** Cuándo sale la acción. */
export type LaunchTiming = "now" | "in7" | "in30" | "nextCycle";

export interface LaunchOption {
  id: LaunchTiming;
  label: string;
  hint: string;
}

export const LAUNCH_OPTIONS: readonly LaunchOption[] = [
  { id: "now", label: "Al activar", hint: "Sale hoy mismo, apenas guardes la activación." },
  { id: "in7", label: "En 7 días", hint: "Una semana de margen para avisar a los líderes antes de que llegue." },
  { id: "in30", label: "En 30 días", hint: "El plazo estándar para medir efecto: da tiempo a que la acción anterior ocurra." },
  {
    id: "nextCycle",
    label: "Próximo ciclo",
    hint: "Espera a la apertura del siguiente ciclo de objetivos o de formación para no partir el actual.",
  },
];

export const LAUNCH_BY_ID: Readonly<Record<LaunchTiming, LaunchOption>> = Object.fromEntries(
  LAUNCH_OPTIONS.map((option) => [option.id, option])
) as Record<LaunchTiming, LaunchOption>;

/** Cada cuánto vuelve a recordarse la tarea mientras siga sin completarse. */
export type ReminderCadence = "once" | "daily" | "weekly" | "biweekly" | "monthly";

export interface ReminderCadenceOption {
  id: ReminderCadence;
  label: string;
  /** Cómo se lee la elección, en una línea, debajo del conmutador. */
  hint: string;
}

export const REMINDER_CADENCES: readonly ReminderCadenceOption[] = [
  { id: "once", label: "Una vez", hint: "Un solo aviso al asignar la tarea, sin recordatorios posteriores." },
  { id: "daily", label: "Diario", hint: "Recuerda cada día hasta que la tarea quede en check." },
  { id: "weekly", label: "Semanal", hint: "Recuerda cada semana mientras la tarea siga abierta." },
  { id: "biweekly", label: "Quincenal", hint: "Recuerda cada dos semanas mientras la tarea siga abierta." },
  { id: "monthly", label: "Mensual", hint: "Un recordatorio al mes: para tareas que necesitan tiempo de maduración." },
];

export const CADENCE_BY_ID: Readonly<Record<ReminderCadence, ReminderCadenceOption>> = Object.fromEntries(
  REMINDER_CADENCES.map((option) => [option.id, option])
) as Record<ReminderCadence, ReminderCadenceOption>;

/** Lo que el usuario decide al encender un accionable. */
export interface ActivationConfig {
  launch: LaunchTiming;
  cadence: ReminderCadence;
  /** Alguien revisa la acción antes de que llegue al módulo destino. */
  requiresReview: boolean;
}

export const defaultActivation = (actionable: Actionable): ActivationConfig => ({
  launch: actionable.suggestedLaunch,
  cadence: actionable.suggestedCadence,
  requiresReview: true,
});

/* --------------------------------------------------------------- lectura */

export function byScoreDesc(a: Actionable, b: Actionable): number {
  return b.score - a.score || a.title.localeCompare(b.title, "es");
}

export interface ActionableShelf {
  module: ActionableModule;
  items: readonly Actionable[];
}

/** Las estanterías: un módulo destino con sus accionables, de mayor a menor puntaje. */
export function buildActionableShelves(items: readonly Actionable[]): readonly ActionableShelf[] {
  return ACTIONABLE_MODULES.map((module) => ({
    module,
    items: items.filter((item) => item.module === module.id).sort(byScoreDesc),
  })).filter((shelf) => shelf.items.length > 0);
}

export function matchesActionableQuery(actionable: Actionable, query: string): boolean {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length === 0) return true;
  const module = MODULE_BY_ID[actionable.module];
  return normalize(
    [
      actionable.title,
      actionable.feature,
      module.label,
      actionable.trigger,
      actionable.outcome,
      actionable.rationale,
      actionable.audience.label,
      actionable.task.title,
      ...actionable.topics,
      ...actionable.deliverable.items.map((item) => item.label),
      ...actionable.audience.members.map((member) => member.name),
    ].join(" ")
  ).includes(normalizedQuery);
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Cómo se lee un puntaje: la misma escala en la ficha, el foco y el drawer. */
export function describeScore(score: number): string {
  if (score >= 95) return "Valor máximo";
  if (score >= 85) return "Valor alto";
  if (score >= 75) return "Valor medio";
  return "Valor a validar";
}

/**
 * Una pastilla de la leyenda de impacto. Igual que `ScaleLegendItem`, salvo que
 * "Valor alto" se pinta con el color de marca, que no es un tono de la escala.
 */
export interface ImpactLegendItem extends Omit<ScaleLegendItem, "tone"> {
  tone: ScaleTone | Extract<Tone, "brand">;
}

/**
 * Qué significa el impacto, para el botón de escala del reporte.
 *
 * El puntaje es una estimación de cuánto mueve la aguja el accionable —no una
 * medición de la encuesta—, y eso hay que decirlo: un "98/100" sin explicar se
 * lee como un dato del estudio.
 */
export const IMPACT_LEGEND: readonly ImpactLegendItem[] = [
  { id: "maximo", label: "Valor máximo", range: "95 a 100", tone: "positive" },
  { id: "alto", label: "Valor alto", range: "85 a 94", tone: "brand" },
  { id: "medio", label: "Valor medio", range: "75 a 84", tone: "warning" },
  { id: "validar", label: "Valor a validar", range: "menos de 75", tone: "nsnr" },
];

export const IMPACT_DESCRIPTION =
  "Cuánto mueve la aguja este accionable, estimado por la fuerza de la señal que lo dispara, el tamaño de la población que alcanza y qué tan directo es su efecto. No es una cifra de la encuesta: es la prioridad sugerida para decidir por dónde empezar.";

/** El icono del estado vacío de la búsqueda. */
export const ACTIONABLE_SEARCH_ICON = SearchList01Icon;
