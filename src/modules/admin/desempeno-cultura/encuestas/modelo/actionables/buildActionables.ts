import {
  AiBrain01Icon,
  Award01Icon,
  BookOpen01Icon,
  ChartHistogramIcon,
  CheckListIcon,
  DashboardSquare01Icon,
  File01Icon,
  GridIcon,
  Mortarboard01Icon,
  Radar01Icon,
  StethoscopeIcon,
  Target02Icon,
  Task01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { COLLABORATORS } from "../collaborators";
import { unitFromSeed, type SegmentDefinition, type SurveyResults } from "../surveyResults";
import { SCOPE_ALL, analyseSegmentGaps, findingsAtLevel, resolveScope, type Finding } from "../summaryModel";
import type { Actionable, ActionableAudience, ActionableEvidence, AudienceMember } from "./actionableCatalog";

/**
 * Los accionables de *esta* medición.
 *
 * Nada aquí está escrito de antemano: la peor sección decide el tema del plan
 * de formación, el grupo con mayor brecha decide a quién va dirigido, quiénes
 * lideran deciden a quién se le asigna la tarea. Un catálogo fijo diría lo
 * mismo en todas las encuestas, y entonces no sería un accionable — sería un
 * folleto.
 *
 * Todo sale del mismo modelo que el Análisis con IA (`summaryModel`), así que
 * las dos pestañas no pueden discrepar sobre cuál fue la sección más baja.
 */

/* ------------------------------------------------------------------ señales */

interface GroupSignal {
  segmentKey: string;
  segmentLabel: string;
  label: string;
  score: number;
  /** Distancia al promedio de su propio corte, negativa. */
  gap: number;
  invited: number;
  completed: number;
}

interface Signals {
  /** Secciones de peor a mejor. */
  worstSections: readonly Finding[];
  /** Preguntas de peor a mejor. */
  worstQuestions: readonly Finding[];
  /** Grupos por debajo del promedio de su corte, el más lejano primero. */
  worstGroups: readonly GroupSignal[];
  /** Quiénes lideran, con el área que llevan. */
  leaders: readonly AudienceMember[];
  leaderSegment: SegmentDefinition | null;
}

const pct = (value: number): string => `${Math.round(value)} %`;
const count = (value: number): string => new Intl.NumberFormat("es-CO").format(value);
const score1 = (value: number): string => value.toFixed(1).replace(".", ",");

/** El enunciado de una pregunta como tema: sin el punto final, que en una lista sobra. */
const asTopic = (finding: Finding): string => finding.title.replace(/\s*\.\s*$/, "");

/** "77 colaboradores de Operaciones" — la frase que va dentro de un titular. */
const peopleOf = (group: GroupSignal): string =>
  `${count(group.invited)} ${group.invited === 1 ? "colaborador" : "colaboradores"} de ${group.label}`;

/** Una duración estable por tema, para que un curso no cambie de largo al re-renderizar. */
const lessonsFor = (seed: string): string => {
  const lessons = 3 + Math.floor(unitFromSeed(`${seed}:lessons`) * 4);
  const minutes = 25 + Math.floor(unitFromSeed(`${seed}:minutes`) * 40);
  return `${lessons} lecciones · ${minutes} min`;
};

function readSignals(results: SurveyResults): Signals {
  const scope = resolveScope(results, SCOPE_ALL);
  const worstSections = findingsAtLevel(scope, "section");
  const worstQuestions = findingsAtLevel(scope, "question");

  const leaderSegment =
    results.segments.find((segment) => segment.key === "leader" || /l[ií]der/i.test(segment.label)) ?? null;

  // El área que lleva cada líder sale del directorio: una lista de nombres sin
  // contexto no le sirve a quien tiene que aprobar a quién le llega la tarea.
  const areaByLeader = new Map<string, string>();
  for (const person of COLLABORATORS) {
    if (person.leader && !areaByLeader.has(person.leader)) areaByLeader.set(person.leader, person.area);
  }

  const leaders: readonly AudienceMember[] = (leaderSegment?.options ?? [])
    .filter((option) => option.label !== "Sin líder")
    .map((option) => ({
      id: option.id,
      name: option.label,
      meta: areaByLeader.get(option.label) ?? "Equipo a cargo",
    }));

  // Los cortes por persona (Colaborador, Líder) no son grupos comparables: cada
  // opción es alguien, no una población, y una brecha entre dos personas no es
  // una brecha organizacional.
  const worstGroups = results.segments
    .filter((segment) => !segment.perPerson && segment !== leaderSegment)
    .flatMap((segment) => {
      const gaps = analyseSegmentGaps(segment, results, []);
      if (!gaps) return [];
      return gaps.outliers.map((outlier) => ({
        segmentKey: segment.key,
        segmentLabel: segment.label,
        label: outlier.row.label,
        score: outlier.row.score ?? 0,
        gap: outlier.gap,
        invited: outlier.row.invited,
        completed: outlier.row.completed,
      }));
    })
    .sort((a, b) => a.gap - b.gap);

  return { worstSections, worstQuestions, worstGroups, leaders, leaderSegment };
}

/** Cuántas personas de un grupo se listan antes de resumir el resto. */
const MEMBER_SAMPLE = 12;

/** Las personas de un área, con su líder, para desplegar la población. */
function membersOfArea(area: string, limit = MEMBER_SAMPLE): readonly AudienceMember[] {
  return COLLABORATORS.filter((person) => person.area === area)
    .slice(0, limit)
    .map((person) => ({ id: person.id, name: person.name, meta: person.leader ?? person.area }));
}

/* ------------------------------------------------------------ constructores */

/**
 * Los accionables que la medición sostiene, de mayor a menor valor.
 *
 * Cada bloque devuelve `null` cuando la señal que lo justifica no existe —sin
 * eNPS no hay seguimiento a detractores, sin brechas no hay ruta focalizada—,
 * y la lista final se queda solo con lo que la encuesta puede respaldar.
 */
export function buildActionables(results: SurveyResults): readonly Actionable[] {
  const signals = readSignals(results);

  return [
    pulseControl(results, signals),
    focusedPulse(signals),
    detractorPulse(results),
    leadershipPlan(signals),
    aiCourse(signals),
    groupReinforcement(signals),
    contentRequest(signals),
    climateOkr(results, signals),
    review360(signals),
    talentMatrix(results, signals),
    burnoutAssessment(results, signals),
    attritionTag(results, signals),
    interviewTemplates(signals),
    certificateGate(results),
  ].filter((actionable): actionable is Actionable => actionable !== null);
}

/* ------------------------------------------- Desempeño · medir el efecto */

/** El pulso de control: sin él, activar accionables es lanzar a ciegas. */
function pulseControl(results: SurveyResults, signals: Signals): Actionable | null {
  const worst = signals.worstSections[0];
  if (!worst) return null;

  const sections = signals.worstSections.slice(0, 3);
  const audience: ActionableAudience = {
    label: `${count(results.participation.invited)} colaboradores medidos`,
    people: results.participation.invited,
    source: "Toda la medición",
    members: COLLABORATORS.slice(0, MEMBER_SAMPLE).map((person) => ({
      id: person.id,
      name: person.name,
      meta: person.area,
    })),
    memberNoun: "colaboradores",
  };

  return {
    id: "pulso-control",
    progressLabel: "respondieron el pulso",
    module: "desempeno",
    feature: "Encuestas",
    icon: Radar01Icon,
    title: `Pulso de control a 30 días sobre ${worst.title}`,
    trigger: `${worst.title} cerró en ${pct(worst.favorability)} de favorabilidad, la sección más baja de la medición. Un pulso corto a los 30 días de lanzar los accionables —misma población, misma escala— dice si movieron la aguja o no.`,
    outcome: `Queda programado un pulso de ${sections.length} preguntas, comparable contra esta medición, que se lanza en la fecha elegida.`,
    score: 98,
    rationale:
      "Cierra el ciclo: sin una medición de control, activar acciones es gasto sin evidencia. Este es el accionable que convierte al resto en un experimento con resultado.",
    audience,
    topics: sections.map((section) => `${section.title} · ${pct(section.favorability)} hoy`),
    evidence: [
      { label: `Favorabilidad de ${worst.title}`, value: pct(worst.favorability), target: "favorability" },
      { label: "Favorabilidad general", value: pct(results.favorability), target: "favorability" },
      { label: "Población comparable", value: count(results.participation.invited), target: "participation" },
    ],
    deliverable: {
      title: `${sections.length} preguntas del pulso`,
      icon: CheckListIcon,
      items: sections.map((section) => ({
        id: section.id,
        label: signals.worstQuestions.find((question) => question.parent.includes(section.title))
          ? asTopic(signals.worstQuestions.find((question) => question.parent.includes(section.title))!)
          : `¿Cómo calificas ${section.title.toLowerCase()} hoy?`,
        meta: `${section.title} · escala 1 a 5`,
      })),
    },
    task: {
      assignee: `Cada uno de los ${count(results.participation.invited)} colaboradores`,
      title: "Responder el pulso de control",
      completion:
        "Queda completada cuando la persona envía el pulso. A quien no lo haya enviado le vuelve el recordatorio con la cadencia elegida.",
    },
    suggestedLaunch: "in30",
    suggestedCadence: "weekly",
  };
}

/** El pulso focalizado en el grupo que más se separa del promedio. */
function focusedPulse(signals: Signals): Actionable | null {
  const group = signals.worstGroups[0];
  if (!group) return null;

  const questions = signals.worstQuestions.slice(0, 3);

  return {
    id: "pulso-focalizado",
    progressLabel: "respondieron el diagnóstico",
    module: "desempeno",
    feature: "Encuestas",
    icon: Task01Icon,
    title: `Pulso focalizado en ${group.label}`,
    trigger: `${group.label} promedia ${score1(group.score)} sobre 5, ${score1(Math.abs(group.gap))} puntos por debajo del promedio de ${group.segmentLabel}. Una encuesta corta y solo para ese grupo pregunta por qué, en vez de deducirlo del agregado.`,
    outcome: `Queda creada una encuesta de diagnóstico dirigida únicamente a ${peopleOf(group)}, con preguntas abiertas sobre lo que más los separa.`,
    score: 88,
    rationale:
      "Una brecha dice dónde mirar, no qué pasó. Preguntarle al grupo directamente evita construir un plan sobre una hipótesis del equipo de RRHH.",
    audience: {
      label: peopleOf(group),
      people: group.invited,
      source: `${group.segmentLabel} · ${group.label}`,
      members: membersOfArea(group.label),
      memberNoun: "colaboradores",
    },
    topics: signals.worstSections.slice(0, 2).map((section) => section.title),
    evidence: [
      { label: `Promedio de ${group.label}`, value: score1(group.score), target: "favorability" },
      { label: "Distancia al promedio del corte", value: score1(group.gap), target: "favorability" },
      { label: "Personas en el grupo", value: count(group.invited), target: "participation" },
    ],
    deliverable: {
      title: `${questions.length + 1} preguntas de la encuesta`,
      icon: CheckListIcon,
      items: [
        ...questions.map((question) => ({
          id: question.id,
          label: asTopic(question),
          meta: "Escala 1 a 5",
        })),
        {
          id: "abierta",
          label: `¿Qué tendría que cambiar en ${group.label} para que esto mejore?`,
          meta: "Respuesta abierta",
        },
      ],
    },
    task: {
      assignee: `Los ${count(group.invited)} de ${group.label}`,
      title: `Responder el diagnóstico de ${group.label}`,
      completion: "Queda completada cuando la persona envía la encuesta.",
    },
    suggestedLaunch: "in7",
    suggestedCadence: "weekly",
  };
}

/** Solo si la encuesta midió eNPS: preguntar a quien puntuó bajo. */
function detractorPulse(results: SurveyResults): Actionable | null {
  const nps = results.nps;
  if (!nps || nps.detractors === 0) return null;

  return {
    id: "pulso-detractores",
    progressLabel: "respondieron el seguimiento",
    module: "desempeno",
    feature: "Encuestas",
    icon: Task01Icon,
    title: `Seguimiento anónimo a los ${count(nps.detractors)} detractores`,
    trigger: `El eNPS quedó en ${nps.score} con ${count(nps.detractors)} detractores sobre ${count(nps.n)} respuestas. Un seguimiento anónimo de dos preguntas les da el espacio para decir qué tendría que cambiar.`,
    outcome:
      "Queda programada una encuesta anónima, solo para quienes puntuaron de 0 a 6, que no expone su identidad a nadie.",
    score: 84,
    rationale:
      "El eNPS dice cuánta gente no recomendaría la empresa, nunca por qué. El seguimiento convierte un número de tablero en una lista de motivos accionables.",
    audience: {
      label: `${count(nps.detractors)} detractores`,
      people: nps.detractors,
      source: "eNPS · puntuaciones de 0 a 6",
      // Anónimo por diseño: la lista existiría, pero mostrarla rompería la
      // promesa que hace la encuesta.
      members: [],
      memberNoun: "detractores",
    },
    topics: ["Motivo de la puntuación", "Qué tendría que cambiar para subirla"],
    evidence: [
      { label: "eNPS", value: `${nps.score}`, target: "nps" },
      { label: "Detractores", value: count(nps.detractors), target: "nps" },
      { label: "Respuestas", value: count(nps.n), target: "nps" },
    ],
    deliverable: {
      title: "2 preguntas del seguimiento",
      icon: CheckListIcon,
      items: [
        { id: "motivo", label: "¿Qué explica mejor tu puntuación?", meta: "Opción múltiple" },
        { id: "cambio", label: "¿Qué tendría que cambiar para que la subieras?", meta: "Respuesta abierta" },
      ],
    },
    task: {
      assignee: `Los ${count(nps.detractors)} detractores`,
      title: "Responder el seguimiento anónimo",
      completion:
        "Queda completada al enviar. El avance se reporta solo como total: nadie ve quién respondió ni quién falta.",
    },
    suggestedLaunch: "in7",
    suggestedCadence: "once",
  };
}

/* ------------------------------------------------------------- Aprendizaje */

/** El plan de formación para los líderes, con el tema que salió peor. */
function leadershipPlan(signals: Signals): Actionable | null {
  const worst = signals.worstSections[0];
  if (!worst) return null;

  const leaders = signals.leaders;
  const leaderCount = leaders.length;
  const audienceLabel =
    leaderCount > 0
      ? `${count(leaderCount)} ${leaderCount === 1 ? "líder" : "líderes"} con equipo a cargo`
      : "Los líderes con equipo a cargo";

  const topics = signals.worstQuestions.slice(0, 3);

  return {
    id: "plan-lideres",
    progressLabel: "completaron el plan",
    module: "aprendizaje",
    feature: "Planes",
    icon: BookOpen01Icon,
    title: `Plan de formación en ${worst.title} para ${leaderCount > 0 ? `${count(leaderCount)} líderes` : "los líderes"}`,
    trigger: `${worst.title} quedó en ${pct(worst.favorability)} de favorabilidad, la sección más baja de la medición. Las preguntas peor evaluadas apuntan a comportamientos de liderazgo, no a política de empresa, así que el plan se arma para quien tiene equipo a cargo.`,
    outcome: `Queda un plan de ${topics.length} cursos de la biblioteca, uno por tema, asignado a ${audienceLabel.toLowerCase()}.`,
    score: 100,
    rationale:
      "Automatiza el diseño instruccional y lo ata a la demanda real: el plan no sale de un catálogo, sale de las tres preguntas que la gente calificó más bajo.",
    audience: {
      label: audienceLabel,
      people: leaderCount,
      source: signals.leaderSegment ? `${signals.leaderSegment.label} · toda la organización` : "Líderes con equipo",
      members: leaders,
      memberNoun: "líderes",
    },
    topics: topics.map(asTopic),
    evidence: [
      { label: `Favorabilidad de ${worst.title}`, value: pct(worst.favorability), target: "favorability" },
      ...topics.slice(0, 2).map(
        (question): ActionableEvidence => ({
          label: asTopic(question),
          value: pct(question.favorability),
          target: "questions",
        })
      ),
    ],
    deliverable: {
      title: `${topics.length} cursos del plan`,
      icon: Mortarboard01Icon,
      items: topics.map((question) => ({
        id: question.id,
        label: asTopic(question),
        meta: lessonsFor(question.id),
      })),
    },
    task: {
      assignee: `Cada uno de los ${count(leaderCount)} líderes`,
      title: `Completar el plan de formación en ${worst.title}`,
      completion: `Queda completada solo cuando el líder termina los ${topics.length} cursos del plan. Mientras falte uno, la tarea sigue abierta y el recordatorio sigue llegando.`,
    },
    suggestedLaunch: "now",
    suggestedCadence: "weekly",
  };
}

/** Refuerzo dirigido al grupo que peor está, no a toda la empresa. */
/**
 * El curso que la biblioteca no tiene, escrito por la IA con la evidencia de
 * la medición.
 *
 * Se distingue del plan de formación en que aquel *arma* una ruta con lo que
 * ya existe; este *crea* el contenido cuando lo que existe no habla del
 * problema que la encuesta encontró.
 */
function aiCourse(signals: Signals): Actionable | null {
  const worst = signals.worstSections[0];
  if (!worst || signals.leaders.length === 0) return null;

  const leaders = signals.leaders;
  const questions = signals.worstQuestions.slice(0, 3);

  return {
    id: "curso-ia-lideres",
    progressLabel: "completaron el curso",
    module: "aprendizaje",
    feature: "LMS Creator",
    icon: AiBrain01Icon,
    ai: true,
    title: `Curso de ${worst.title} generado con IA para ${count(leaders.length)} líderes`,
    trigger: `${worst.title} quedó en ${pct(worst.favorability)} y las preguntas que lo hunden son muy específicas de esta organización. En vez de buscar un curso de catálogo que se le parezca, la IA escribe uno a la medida con los enunciados y las cifras de esta medición como material de partida.`,
    outcome: `Queda un borrador de curso de ${questions.length + 1} módulos —guion, ejemplos y evaluación final— listo para revisar y publicar, ya asignado a ${count(leaders.length)} líderes.`,
    score: 94,
    rationale:
      "La biblioteca nunca va a tener un curso sobre el problema exacto de una empresa. Generarlo cierra la distancia entre el hallazgo y el contenido sin esperar un ciclo de producción.",
    audience: {
      label: `${count(leaders.length)} ${leaders.length === 1 ? "líder con equipo a cargo" : "líderes con equipo a cargo"}`,
      people: leaders.length,
      source: signals.leaderSegment ? `${signals.leaderSegment.label} · toda la organización` : "Líderes con equipo",
      members: leaders,
      memberNoun: "líderes",
    },
    topics: questions.map(asTopic),
    evidence: [
      { label: `Favorabilidad de ${worst.title}`, value: pct(worst.favorability), target: "favorability" },
      { label: "Preguntas que alimentan el guion", value: `${questions.length}`, target: "questions" },
      { label: "Líderes asignados", value: count(leaders.length), target: "participation" },
    ],
    deliverable: {
      title: `${questions.length + 1} módulos del curso`,
      icon: AiBrain01Icon,
      items: [
        ...questions.map((question, index) => ({
          id: question.id,
          label: `Módulo ${index + 1}: ${asTopic(question)}`,
          meta: `${lessonsFor(`${question.id}:ia`)} · generado con IA`,
        })),
        {
          id: "evaluacion",
          label: `Evaluación final: ${worst.title} en tu equipo`,
          meta: "10 preguntas · caso práctico",
        },
      ],
    },
    task: {
      assignee: `Cada uno de los ${count(leaders.length)} líderes`,
      title: `Completar el curso de ${worst.title}`,
      completion: `Queda completada cuando el líder termina los ${questions.length} módulos y aprueba la evaluación final.`,
    },
    suggestedLaunch: "in7",
    suggestedCadence: "weekly",
  };
}

function groupReinforcement(signals: Signals): Actionable | null {
  const group = signals.worstGroups[0];
  const worst = signals.worstSections[0];
  if (!group || !worst) return null;

  const topics = signals.worstQuestions.slice(0, 2);

  return {
    id: "refuerzo-grupo",
    progressLabel: "completaron la ruta",
    module: "aprendizaje",
    feature: "Planes",
    icon: Mortarboard01Icon,
    title: `Ruta de refuerzo para ${group.label}`,
    trigger: `${group.label} está ${score1(Math.abs(group.gap))} puntos por debajo del promedio de ${group.segmentLabel}. El refuerzo va solo a ese grupo: mandar el mismo contenido a toda la empresa diluye el mensaje y quema la biblioteca.`,
    outcome: `Queda una ruta corta asignada a ${peopleOf(group)}, con avance visible por persona para su líder.`,
    score: 90,
    rationale:
      "Formación proporcional al problema: el grupo que peor está recibe más, y el resto de la organización no paga el costo de atención de un problema que no tiene.",
    audience: {
      label: peopleOf(group),
      people: group.invited,
      source: `${group.segmentLabel} · ${group.label}`,
      members: membersOfArea(group.label),
      memberNoun: "colaboradores",
    },
    topics: [worst.title, ...topics.map(asTopic)],
    evidence: [
      { label: `Promedio de ${group.label}`, value: score1(group.score), target: "favorability" },
      { label: "Distancia al promedio", value: score1(group.gap), target: "favorability" },
      { label: "Personas alcanzadas", value: count(group.invited), target: "participation" },
    ],
    deliverable: {
      title: `${topics.length + 1} contenidos de la ruta`,
      icon: Mortarboard01Icon,
      items: [
        { id: `${group.segmentKey}-intro`, label: `Diagnóstico corto: ${worst.title}`, meta: lessonsFor(group.label) },
        ...topics.map((question) => ({
          id: question.id,
          label: asTopic(question),
          meta: lessonsFor(`${question.id}:ruta`),
        })),
      ],
    },
    task: {
      assignee: `Los ${count(group.invited)} de ${group.label}`,
      title: `Completar la ruta de refuerzo de ${group.label}`,
      completion: "Queda completada cuando la persona termina los contenidos de la ruta.",
    },
    suggestedLaunch: "in7",
    suggestedCadence: "biweekly",
  };
}

/** Pedirle a los expertos internos el contenido que la biblioteca no tiene. */
function contentRequest(signals: Signals): Actionable | null {
  const topic = signals.worstQuestions[0];
  if (!topic) return null;

  return {
    id: "curso-expres",
    progressLabel: "entregaron el contenido",
    module: "aprendizaje",
    feature: "LMS Creator",
    icon: ChartHistogramIcon,
    title: `Curso exprés sobre "${shorten(asTopic(topic))}"`,
    trigger: `"${asTopic(topic)}" es la pregunta peor evaluada de la medición (${pct(topic.favorability)} favorable sobre ${count(topic.n)} respuestas). Se pide a los expertos internos grabar un contenido corto sobre ese punto exacto.`,
    outcome: "Queda una solicitud de grabación en LMS Creator, con el enunciado y la cifra que la motivó adjuntos.",
    score: 78,
    rationale:
      "Fomenta el contenido generado internamente resolviendo una fricción real e inmediata, en vez de comprar catálogo genérico.",
    audience: {
      label: "Expertos internos del tema",
      people: 0,
      source: "Aprendizaje · solicitud de contenido",
      members: [],
      memberNoun: "expertos",
    },
    topics: [asTopic(topic)],
    evidence: [
      { label: "Pregunta peor evaluada", value: pct(topic.favorability), target: "questions" },
      { label: "Respuestas", value: count(topic.n), target: "questions" },
    ],
    deliverable: {
      title: "Guion sugerido del curso",
      icon: CheckListIcon,
      items: [
        { id: "que", label: `Qué está pasando con "${shorten(asTopic(topic), 40)}"`, meta: "Contexto · 5 min" },
        { id: "como", label: "Cómo lo resolvemos aquí", meta: "Práctica · 10 min" },
        { id: "cierre", label: "Qué esperamos ver en el próximo pulso", meta: "Cierre · 3 min" },
      ],
    },
    task: {
      assignee: "Experto interno asignado",
      title: "Grabar el curso exprés",
      completion: "Queda completada cuando el contenido está publicado en la biblioteca.",
    },
    suggestedLaunch: "in7",
    suggestedCadence: "weekly",
  };
}

function certificateGate(results: SurveyResults): Actionable {
  return {
    id: "nps-certificado",
    progressLabel: "respondieron la encuesta del curso",
    module: "aprendizaje",
    feature: "Certificados",
    icon: Award01Icon,
    title: "Encuesta del curso como requisito del certificado",
    trigger: `Esta medición cerró con ${pct(results.participation.rate)} de participación. En las encuestas de curso el mismo problema se resuelve dentro del flujo: responder la satisfacción es el paso previo a descargar el certificado.`,
    outcome: "Queda activado el bloqueo: el certificado se emite automáticamente al enviar la encuesta de satisfacción.",
    score: 76,
    rationale:
      "Garantiza tasa de respuesta cercana al 100 % donde sí se puede exigir, que es lo que permite limpiar la calidad de la biblioteca.",
    audience: {
      label: "Quien termina un curso certificable",
      people: 0,
      source: "Aprendizaje · Certificados",
      members: [],
      memberNoun: "personas",
    },
    topics: ["Satisfacción del curso", "Emisión del certificado"],
    evidence: [
      { label: "Participación de esta medición", value: pct(results.participation.rate), target: "participation" },
    ],
    deliverable: {
      title: "Regla que queda activa",
      icon: CheckListIcon,
      items: [
        { id: "encuesta", label: "Encuesta de satisfacción al terminar el curso", meta: "3 preguntas" },
        { id: "certificado", label: "Emisión y descarga del certificado", meta: "Automática al enviar" },
      ],
    },
    task: {
      assignee: "Quien termina el curso",
      title: "Responder la encuesta del curso",
      completion: "Queda completada al enviarla, y es lo que libera el certificado.",
    },
    suggestedLaunch: "now",
    suggestedCadence: "once",
  };
}

/* ------------------------------------------ Desempeño · ciclo del líder */

function climateOkr(results: SurveyResults, signals: Signals): Actionable | null {
  const group = signals.worstGroups[0];
  const worst = signals.worstSections[0];
  if (!group || !worst) return null;

  const target = Math.min(100, Math.round(worst.favorability) + 15);
  const npsLine = results.nps ? ` El eNPS de la medición está en ${results.nps.score}.` : "";
  const leader = signals.leaders.find((member) => member.meta === group.label);

  return {
    id: "okr-clima",
    progressLabel: "aceptaron el objetivo",
    module: "desempeno",
    feature: "Objetivos",
    icon: Target02Icon,
    title: `OKR de clima para el líder de ${group.label}`,
    trigger: `${group.label} promedia ${score1(group.score)} sobre 5, por debajo del promedio de ${group.segmentLabel}.${npsLine} Se propone un objetivo de mejora de clima para el ciclo vigente, con ${worst.title} como resultado clave.`,
    outcome: `Queda propuesto el objetivo en el ciclo actual de ${leader?.name ?? `el líder de ${group.label}`}, listo para que lo acepte y empiece a medirse.`,
    score: 96,
    rationale:
      "Convierte el clima en un entregable medible del líder y no en un informe que se archiva: si no está en sus objetivos, compite con todo lo demás y pierde.",
    audience: {
      label: leader ? `${leader.name}, líder de ${group.label}` : `Líder de ${group.label}`,
      people: 1,
      source: `${group.segmentLabel} · ${group.label}`,
      members: leader ? [leader] : [],
      memberNoun: "líderes",
    },
    topics: [`Subir ${worst.title} de ${pct(worst.favorability)} a ${target} %`, `Cerrar la brecha de ${score1(Math.abs(group.gap))} puntos`],
    evidence: [
      { label: `Promedio de ${group.label}`, value: score1(group.score), target: "favorability" },
      { label: `Favorabilidad de ${worst.title}`, value: pct(worst.favorability), target: "favorability" },
      ...(results.nps ? [{ label: "eNPS", value: `${results.nps.score}`, target: "nps" as const }] : []),
    ],
    deliverable: {
      title: "1 objetivo y 3 resultados clave",
      icon: Target02Icon,
      items: [
        {
          id: "objetivo",
          label: `Mejorar el clima de ${group.label} en el ciclo actual`,
          meta: "Objetivo",
        },
        {
          id: "kr-1",
          label: `Subir ${worst.title} de ${pct(worst.favorability)} a ${target} %`,
          meta: "Resultado clave · se mide en el pulso de control",
        },
        {
          id: "kr-2",
          label: `Llevar el promedio de ${group.label} de ${score1(group.score)} al promedio del corte`,
          meta: "Resultado clave",
        },
        {
          id: "kr-3",
          label: "Completar el plan de formación de liderazgo del área",
          meta: "Resultado clave · se marca con la tarea del plan",
        },
      ],
    },
    task: {
      assignee: leader ? leader.name : `Líder de ${group.label}`,
      title: "Aceptar el OKR de clima y reportar su avance",
      completion:
        "Queda completada cuando el objetivo está aceptado en el ciclo y sus tres resultados clave alcanzan la meta.",
    },
    suggestedLaunch: "nextCycle",
    suggestedCadence: "monthly",
  };
}

function review360(signals: Signals): Actionable | null {
  const worst = signals.worstSections[0];
  if (!worst || signals.leaders.length === 0) return null;

  const leaders = signals.leaders;
  const questions = signals.worstQuestions.slice(0, 3);

  return {
    id: "peso-360",
    progressLabel: "revisaron su evidencia",
    module: "desempeno",
    feature: "Evaluación 360",
    icon: UserGroupIcon,
    title: `Evaluación 360 de ${count(leaders.length)} líderes centrada en ${worst.title}`,
    trigger: `Los equipos calificaron ${worst.title} en ${pct(worst.favorability)}, la sección más baja. En vez de evaluar la competencia con el formulario genérico, la 360 del próximo ciclo sube su peso y precarga como comportamientos las ${questions.length} preguntas que peor salieron.`,
    outcome: `Queda configurada la 360 de ${count(leaders.length)} líderes con la competencia de liderazgo ponderada y la evidencia de esta medición adjunta a cada evaluado.`,
    score: 90,
    rationale:
      "Cruza el pulso continuo con la evaluación formal y elimina el sesgo de memoria de fin de año: la 360 llega con datos de todo el periodo, no de las últimas semanas.",
    audience: {
      label: `${count(leaders.length)} ${leaders.length === 1 ? "líder evaluado" : "líderes evaluados"}`,
      people: leaders.length,
      source: signals.leaderSegment ? `${signals.leaderSegment.label} · toda la organización` : "Líderes con equipo",
      members: leaders,
      memberNoun: "líderes",
    },
    topics: questions.map(asTopic),
    evidence: [
      { label: `Favorabilidad de ${worst.title}`, value: pct(worst.favorability), target: "favorability" },
      { label: "Líderes evaluados", value: count(leaders.length), target: "participation" },
      { label: "Comportamientos precargados", value: `${questions.length}`, target: "questions" },
    ],
    deliverable: {
      title: `${questions.length + 1} ítems de la competencia`,
      icon: CheckListIcon,
      items: [
        {
          id: "peso",
          label: "Liderazgo sube de peso estándar a competencia crítica del ciclo",
          meta: "Ponderación",
        },
        ...questions.map((question) => ({
          id: question.id,
          label: asTopic(question),
          meta: `Comportamiento · ${pct(question.favorability)} en esta medición`,
        })),
      ],
    },
    task: {
      assignee: `Cada uno de los ${count(leaders.length)} líderes`,
      title: "Revisar la evidencia precargada de su 360",
      completion:
        "Queda completada cuando el líder revisa sus comportamientos precargados antes de que el ciclo de 360 abra. Sin esa revisión el ciclo no arranca para él.",
    },
    suggestedLaunch: "nextCycle",
    suggestedCadence: "weekly",
  };
}

/**
 * La matriz de talento, con los líderes que la medición pone en duda.
 *
 * No es una regla abstracta: son los líderes de las áreas que quedaron bajo el
 * promedio, con nombre, los que entran al comité con una marca encima.
 */
function talentMatrix(results: SurveyResults, signals: Signals): Actionable | null {
  const worst = signals.worstGroups[0];
  if (!worst) return null;

  // Un solo corte: `worstGroups` mezcla los recortes de todos los demográficos
  // —Área, País, Edad—, y contarlos juntos produciría un "8 áreas" que no es
  // cierto. La matriz habla del corte al que pertenece el grupo más bajo.
  const groups = signals.worstGroups.filter((group) => group.segmentKey === worst.segmentKey);
  const flaggedAreas = new Set(groups.map((group) => group.label));
  const flaggedLeaders = signals.leaders.filter((leader) => flaggedAreas.has(leader.meta));
  const groupsLine =
    groups.length === 1
      ? `Un grupo de ${worst.segmentLabel} quedó`
      : `${count(groups.length)} grupos de ${worst.segmentLabel} quedaron`;

  return {
    id: "matriz-talento",
    progressLabel: "quedaron revisados en el comité",
    module: "desempeno",
    feature: "Matriz de talento",
    icon: GridIcon,
    title:
      flaggedLeaders.length > 0
        ? `Marcar en la matriz de talento a ${count(flaggedLeaders.length)} líderes con clima bajo`
        : `Marcar el clima de ${worst.segmentLabel} en la matriz de talento`,
    trigger: `${groupsLine} bajo el promedio de su corte —${worst.label} en ${score1(worst.score)} sobre 5—. Sus líderes entran a la calibración con el clima del equipo como dato visible, y quedan bloqueados para saltar a alto potencial hasta que se recupere.`,
    outcome: `Queda el clima como eje visible de la matriz: ${flaggedLeaders.length > 0 ? `${count(flaggedLeaders.length)} líderes marcados` : "los grupos bajo promedio marcados"} y el salto a la caja de alto potencial bloqueado con justificación.`,
    score: 87,
    rationale:
      "Evita promover perfiles que entregan números y destruyen equipos: el falso positivo más caro de un proceso de talento, y el que la matriz sola no detecta.",
    audience: {
      label:
        flaggedLeaders.length > 0
          ? `${count(flaggedLeaders.length)} ${flaggedLeaders.length === 1 ? "líder marcado" : "líderes marcados"}`
          : "Comité de talento",
      people: flaggedLeaders.length,
      source: `${worst.segmentLabel} · grupos bajo el promedio`,
      members: flaggedLeaders,
      memberNoun: "líderes",
    },
    topics: [
      "Clima del equipo como criterio de potencial",
      "Bloqueo del salto a alto potencial",
      "Justificación visible en la calibración",
    ],
    evidence: [
      { label: `Promedio de ${worst.label}`, value: score1(worst.score), target: "favorability" },
      { label: `Grupos de ${worst.segmentLabel} bajo el promedio`, value: `${groups.length}`, target: "favorability" },
      { label: "Favorabilidad general", value: pct(results.favorability), target: "favorability" },
    ],
    deliverable: {
      title: `${groups.length} grupos en la matriz`,
      icon: GridIcon,
      items: groups.map((group) => ({
        id: `${group.segmentKey}-${group.label}`,
        label: group.label,
        meta: `${score1(group.score)} sobre 5 · ${score1(group.gap)} vs. promedio`,
      })),
    },
    task: {
      assignee: "Responsable del comité de talento",
      title: "Revisar los líderes marcados antes de la calibración",
      completion:
        "Queda completada cuando el comité deja constancia, líder por líder, de qué decidió con el clima de su equipo sobre la mesa.",
    },
    suggestedLaunch: "nextCycle",
    suggestedCadence: "monthly",
  };
}

/* -------------------------------------------------------------- Diagnóstico */

function burnoutAssessment(results: SurveyResults, signals: Signals): Actionable | null {
  const group = signals.worstGroups[0];
  if (!group) return null;

  return {
    id: "assessment-burnout",
    progressLabel: "tomaron el assessment",
    module: "diagnostico",
    feature: "Assessments",
    icon: StethoscopeIcon,
    title: `Assessment de burnout en privado para ${group.label}`,
    trigger: `${group.label} promedia ${score1(group.score)} sobre 5, ${score1(Math.abs(group.gap))} puntos bajo el promedio de ${group.segmentLabel}. A esas personas se les sugiere en privado —nunca a su líder— un assessment de validación de burnout.`,
    outcome: `Queda la sugerencia privada activa para ${peopleOf(group)}, con resultado visible solo para la persona y para bienestar.`,
    score: 92,
    rationale:
      "Soporte escalonado antes del colapso: la persona recibe ayuda sin quedar señalada, que es la única forma de que la use.",
    audience: {
      label: peopleOf(group),
      people: group.invited,
      source: `${group.segmentLabel} · ${group.label}`,
      members: membersOfArea(group.label),
      memberNoun: "colaboradores",
    },
    topics: ["Carga de trabajo", "Agotamiento emocional", "Confidencialidad del resultado"],
    evidence: [
      { label: `Promedio de ${group.label}`, value: score1(group.score), target: "favorability" },
      { label: "Personas alcanzadas", value: count(group.invited), target: "participation" },
      { label: "Favorabilidad general", value: pct(results.favorability), target: "favorability" },
    ],
    deliverable: {
      title: "3 bloques del assessment",
      icon: CheckListIcon,
      items: [
        { id: "carga", label: "Carga y ritmo de trabajo", meta: "6 preguntas" },
        { id: "agotamiento", label: "Agotamiento emocional", meta: "8 preguntas" },
        { id: "recursos", label: "Recursos y red de apoyo", meta: "5 preguntas" },
      ],
    },
    task: {
      assignee: `Los ${count(group.invited)} de ${group.label}`,
      title: "Tomar el assessment de burnout",
      completion:
        "Queda completada al terminarlo. El líder ve cuántos lo tomaron, nunca quiénes ni con qué resultado.",
    },
    suggestedLaunch: "now",
    suggestedCadence: "weekly",
  };
}

/* --------------------------------------------------------------- Selección */

function attritionTag(results: SurveyResults, signals: Signals): Actionable | null {
  const group = signals.worstGroups[0];
  if (!group) return null;

  return {
    id: "riesgo-fuga",
    progressLabel: "ajustaron su proceso",
    module: "seleccion",
    feature: "Dashboard",
    icon: DashboardSquare01Icon,
    title: `Marcar riesgo de fuga en las vacantes de ${group.label}`,
    trigger: `${group.label} está entre los grupos más bajos de la medición (${score1(group.score)} sobre 5). Las respuestas negativas de onboarding a 30 días en esa área alertan al reclutador y marcan la vacante con un tag de riesgo de fuga.`,
    outcome: `Queda el tag activo en el dashboard de Selección para las vacantes de ${group.label}, con el histórico de clima del área a la vista.`,
    score: 88,
    rationale:
      "Permite iterar el proceso de adopción rápido y anticipar rotación temprana antes de que se vuelva una vacante repetida.",
    audience: {
      label: `Reclutadores de ${group.label}`,
      people: 0,
      source: `${group.segmentLabel} · ${group.label}`,
      members: [],
      memberNoun: "reclutadores",
    },
    topics: ["Onboarding a 30 días", "Tag de riesgo de fuga en la vacante"],
    evidence: [
      { label: `Promedio de ${group.label}`, value: score1(group.score), target: "favorability" },
      { label: "Favorabilidad general", value: pct(results.favorability), target: "favorability" },
    ],
    deliverable: {
      title: "Qué muestra la vacante marcada",
      icon: CheckListIcon,
      items: [
        { id: "tag", label: "Tag de riesgo de fuga visible en el pipeline", meta: "Señal" },
        { id: "historico", label: `Histórico de clima de ${group.label}`, meta: "Contexto" },
        { id: "onboarding", label: "Respuestas de onboarding a 30 días del área", meta: "Evidencia" },
      ],
    },
    task: {
      assignee: `Reclutador de ${group.label}`,
      title: "Revisar el proceso de la vacante marcada",
      completion: "Queda completada cuando el reclutador deja registrado el ajuste al proceso.",
    },
    suggestedLaunch: "in7",
    suggestedCadence: "weekly",
  };
}

function interviewTemplates(signals: Signals): Actionable | null {
  const worst = signals.worstSections[0];
  if (!worst) return null;

  const questions = signals.worstQuestions.slice(0, 2);

  return {
    id: "plantillas-entrevista",
    progressLabel: "aprobaron la plantilla",
    module: "seleccion",
    feature: "Plantillas",
    icon: File01Icon,
    title: `Indagar ${worst.title} en las entrevistas de selección`,
    trigger: `${worst.title} es el motivo recurrente en esta medición y en las encuestas de salida. Se sugiere actualizar las plantillas de entrevista para indagar ese punto con los candidatos, antes de contratar.`,
    outcome: "Quedan propuestas las preguntas nuevas en la plantilla de entrevista, para que el reclutador las apruebe.",
    score: 74,
    rationale:
      "Cierra el ciclo del talento: la data de salida retroalimenta el sourcing en vez de morir en un informe de rotación.",
    audience: {
      label: "Equipo de selección",
      people: 0,
      source: "Selección · plantillas de entrevista",
      members: [],
      memberNoun: "reclutadores",
    },
    topics: questions.map(asTopic),
    evidence: [{ label: `Favorabilidad de ${worst.title}`, value: pct(worst.favorability), target: "favorability" }],
    deliverable: {
      title: `${questions.length} preguntas propuestas`,
      icon: CheckListIcon,
      items: questions.map((question) => ({
        id: question.id,
        label: `Cuéntame de una vez en que ${lowerFirst(asTopic(question))}`,
        meta: "Pregunta de comportamiento",
      })),
    },
    task: {
      assignee: "Equipo de selección",
      title: "Aprobar las preguntas nuevas de la plantilla",
      completion: "Queda completada cuando la plantilla actualizada se publica para los procesos abiertos.",
    },
    suggestedLaunch: "in30",
    suggestedCadence: "once",
  };
}

/* ------------------------------------------------------------------ utils */

/** Un enunciado largo no cabe en un titular; el texto completo vive en el detalle. */
function shorten(value: string, max = 48): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

/** Para encajar un enunciado dentro de otra frase. */
function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}
