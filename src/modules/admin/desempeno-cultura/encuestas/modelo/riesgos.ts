import { COLLABORATORS, type Collaborator } from "./collaborators";
import { channeledRoster } from "./descargas/canalizados";
import { formatNpsScore, formatPercent, toneForFavorability, toneForNps } from "./favorabilityScale";
import { OPEN_STATUS } from "./homeMetrics";
import { draftOf } from "./homePulse";
import { NOM035_REQUIRED_PARTICIPATION, nom035VariantOf } from "./nom035";
import { nom035Dimensions } from "./nom035RiskModel";
import { organizationRiskOf, riskBandForScore, riskScoreOf } from "./nom035Scale";
import { buildOpenComments, buildRespondents, sentimentTotals } from "./questionResponses";
import { sentimentAverage } from "./sentimiento";
import { analyseSegmentGaps } from "./summaryModel";
import type { SurveyDraft } from "./surveyBuilderTypes";
import { buildSurveyResults, participationBySegment, type SurveyResults } from "./surveyResults";
import { CLOSING_SOON_DAYS, PARTICIPATION_TARGET, daysUntil, projectedProgress } from "./surveyListFilters";
import type { SurveyListItem } from "./types";

/**
 * The home's risk panel: what needs someone to act, one row per problem,
 * sorted into three groups.
 *
 * Críticas — what is lost or breaks the rules if nobody acts:
 * - `resultados`: favorability or eNPS already negative in an open survey.
 * - `meta-final`: will miss the participation target and closes within FINAL_DAYS.
 * - `nom-canalizar`: NOM 035 Guía I with people who answered "Sí" — each one
 *   has to be referred for clinical evaluation (numeral 5.7).
 * - `nom-riesgo`: NOM 035 psychosocial risk high or very high, or dimensions
 *   there, which the norm says call for control measures.
 * - `nom-participacion`: a closed NOM 035 below the 100% the norm requires.
 *
 * Necesitan atención — signals to read before they turn critical:
 * - `meta`: will miss the target with time left, keeping pace with the calendar.
 * - `anonimato`: an anonymous survey where some areas still sit under the
 *   anonymity threshold, so their results will not show.
 * - `sin-demograficos`: an open survey that asks for no demographics — its
 *   results can only be read as a whole, with no area, leader or site.
 * - `brecha`: an area far below the survey average (summaryModel's outliers).
 * - `comentarios`: open comments mostly negative.
 * - `caida`: a clear drop against the previous measurement.
 *
 * Acción manual — steps the platform will not take alone:
 * - `rezagada`: answers behind the calendar (time elapsed vs responses) — send a reminder.
 * - `areas`: areas with a handful of answers in a survey otherwise on pace — a reminder aimed at them.
 * - `revisar-comentarios`: close to closing, comments the AI could not classify with confidence.
 * - `sin-demograficos`: the same, still before opening — add them now.
 * - `borrador`: a draft that should open within DRAFT_DAYS — finish and publish.
 * - `sin-participantes`: a draft with nobody invited whose start date is near (or passed). Without participants it
 *   cannot move to «Por iniciar» nor open, so it is no routine step: media within OPENING_SOON_DAYS, alta within
 *   DRAFT_DAYS (Elkin, 13-oct). It goes before `borrador`, which only says «finish and publish».
 * - `abre`: opens within OPENING_SOON_DAYS — share the link or QR by hand.
 * - `error`: a historical upload that failed — retry it.
 */

export type RiskKind =
  | "resultados"
  | "meta-final"
  | "nom-canalizar"
  | "nom-riesgo"
  | "nom-participacion"
  | "meta"
  | "anonimato"
  | "brecha"
  | "sin-demograficos"
  | "comentarios"
  | "caida"
  | "rezagada"
  | "areas"
  | "revisar-comentarios"
  | "borrador"
  | "sin-participantes"
  | "abre"
  | "error";
export type RiskGroup = "critico" | "atencion" | "manual";

export interface RiskFact {
  label: string;
  value: string;
}

/** One thing the panel lets someone act on from the detail: a person, a question, a comment, a dimension. */
export interface RiskItem {
  id: string;
  title: string;
  detail?: string;
  /** Shown with an avatar: the item is a person. */
  person?: boolean;
}

export interface SurveyRisk {
  id: string;
  kind: RiskKind;
  group: RiskGroup;
  survey: SurveyListItem;
  title: string;
  summary: string;
  facts: readonly RiskFact[];
  /** People invited who have not answered yet — who a reminder reaches. */
  pending: number;
  daysLeft: number | null;
  /** What the detail lists to act on, one by one or all at once. */
  items?: readonly RiskItem[];
}

/** How many questions or dimensions a list offers: the worst ones, not the whole survey. */
const WORST_COUNT = 5;

/** Closes this soon and still short of the target: no time left to recover by pace alone. */
export const FINAL_DAYS = 3;
/** Answers this many points behind the share of time elapsed read as lagging. */
export const LAG_POINTS = 20;
/** Drops against the previous measurement worth a look. */
export const FAVORABILITY_DROP = 5;
export const NPS_DROP = 10;
/** A scheduled survey opening within this many days asks for its link to be shared. */
export const OPENING_SOON_DAYS = 7;
/** A draft this close to its start date should be published. */
export const DRAFT_DAYS = 3;
/** Under this share of answers an area gap is noise, not a finding. */
const READABLE_PARTICIPATION = 50;
/** Below this the AI's reading of a comment needs a person. */
const AI_CONFIDENCE_FLOOR = 70;

const GROUP_ORDER: Record<RiskGroup, number> = { critico: 0, atencion: 1, manual: 2 };

const count = (n: number, one: string, many: string) => `${n.toLocaleString("es-CO")} ${n === 1 ? one : many}`;
const listOf = (items: readonly string[]) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`);

export const pendingOf = (survey: SurveyListItem): number => {
  const invited = Number(survey.participants.replace(/\D/g, "")) || 0;
  return Math.max(0, invited - Math.round((invited * survey.progress) / 100));
};

export const daysLeftText = (days: number | null): string =>
  days === null ? "Sin fecha de cierre" : days <= 0 ? "Cierra hoy" : days === 1 ? "Cierra mañana" : `Cierra en ${days} días`;

const isNom = (survey: SurveyListItem): boolean => survey.type === "NOM 035" || nom035VariantOf(survey.id) !== null;

/** Share of the field period already gone, 0–100; null without readable dates. */
function elapsedShare(survey: SurveyListItem, today: Date): number | null {
  const sinceStart = daysUntil(survey.startDate, today);
  const untilEnd = daysUntil(survey.endDate, today);
  if (sinceStart === null || untilEnd === null) return null;
  const total = untilEnd - sinceStart;
  return total > 0 ? Math.min(100, Math.max(0, (-sinceStart / total) * 100)) : null;
}

const personOf = (person: Collaborator): RiskItem => ({ id: person.id, title: person.name, detail: `${person.area} · ${person.email}`, person: true });

/** Who has not answered yet: the invited people after the ones who did. Bounded by the directory. */
function pendingPeople(survey: SurveyListItem): readonly RiskItem[] {
  const invited = Number(survey.participants.replace(/\D/g, "")) || 0;
  return COLLABORATORS.slice(Math.max(0, invited - pendingOf(survey)), invited).map(personOf);
}

/** Who is missing in some areas: each area's people after the ones who answered there. */
function pendingInAreas(rows: readonly { label: string; completed: number; invited: number }[]): readonly RiskItem[] {
  return rows.flatMap((row) => COLLABORATORS.filter((person) => person.area === row.label).slice(row.completed, row.invited).map(personOf));
}

function participationFacts(survey: SurveyListItem, days: number | null, projected: number | null, elapsed: number | null): RiskFact[] {
  // Today's participation is not listed: the panel shows it as a bar against the target.
  return [
    ...(elapsed !== null ? [{ label: "Tiempo transcurrido", value: formatPercent(Math.round(elapsed)) }] : []),
    ...(projected !== null ? [{ label: "Proyección al cierre", value: formatPercent(projected) }] : []),
    { label: "Sin responder", value: count(pendingOf(survey), "persona", "personas") },
    { label: "Cierre", value: `${survey.endDate} · ${daysLeftText(days).toLowerCase()}` },
  ];
}

type Base = Pick<SurveyRisk, "survey" | "pending" | "daysLeft">;
type Push = (risk: Omit<SurveyRisk, keyof Base | "id"> & { id?: string }) => void;

/** NOM 035 reads risk, not favorability, and stays an obligation after it closes. */
function nomRisks(survey: SurveyListItem, draft: SurveyDraft, results: SurveyResults, push: Push): void {
  if (survey.status === "Finalizado" && survey.progress < NOM035_REQUIRED_PARTICIPATION) {
    push({
      kind: "nom-participacion",
      group: "critico",
      title: "No cumple la participación de la norma",
      summary: `Cerró con ${formatPercent(survey.progress)} y la NOM 035 exige el ${NOM035_REQUIRED_PARTICIPATION}% del personal.`,
      facts: [
        { label: "Participación", value: formatPercent(survey.progress) },
        { label: "Exigida", value: formatPercent(NOM035_REQUIRED_PARTICIPATION) },
        { label: "Faltan", value: count(pendingOf(survey), "persona", "personas") },
      ],
      items: pendingPeople(survey),
    });
  }
  if (nom035VariantOf(survey.id) === "acontecimientos") {
    const people = channeledRoster(draft, results).filter((person) => person.channeled);
    const channeled = people.length;
    if (channeled > 0) {
      push({
        kind: "nom-canalizar",
        group: "critico",
        title: "Personas por canalizar",
        summary: `${count(channeled, "persona reportó", "personas reportaron")} un acontecimiento traumático severo y deben ir a evaluación clínica.`,
        facts: [
          { label: "Por canalizar", value: count(channeled, "persona", "personas") },
          { label: "Fundamento", value: "NOM 035, numeral 5.7" },
        ],
        items: people.map((person) => ({
          id: person.id,
          title: person.name,
          detail: `${person.area ?? "Sin área"} · ${count(person.affirmatives, "respuesta afirmativa", "respuestas afirmativas")}`,
          person: true,
        })),
      });
    }
    return;
  }
  const organization = organizationRiskOf(results.sections);
  const atRisk = nom035Dimensions(results.sections).filter((dimension) => ["alto", "muy-alto"].includes(riskBandForScore(riskScoreOf(dimension.score)).id));
  if (["alto", "muy-alto"].includes(organization.band.id) || atRisk.length > 0) {
    push({
      kind: "nom-riesgo",
      group: "critico",
      title: "Riesgo psicosocial que exige medidas",
      summary: `${count(atRisk.length, "dimensión está", "dimensiones están")} en riesgo alto o muy alto: la norma pide medidas de control.`,
      facts: [
        { label: "Riesgo de la organización", value: organization.band.label },
        { label: "Dimensiones en riesgo alto", value: String(atRisk.length) },
      ],
      items: atRisk.map((dimension) => ({ id: dimension.id, title: dimension.title, detail: `Riesgo ${riskBandForScore(riskScoreOf(dimension.score)).label.toLowerCase()} · ${count(dimension.n, "respuesta", "respuestas")}` })),
    });
  }
}

/**
 * Area-level reading of an open survey. Lagging areas only when the survey as a whole keeps pace (otherwise the
 * general reminder already reaches them); outliers only with half the people in (with fewer, a gap is noise).
 */
function areaRisks(survey: SurveyListItem, draft: SurveyDraft, results: SurveyResults, paceAtRisk: boolean, push: Push): void {
  const area = results.segments.find((segment) => segment.key === "area") ?? results.segments.find((segment) => !segment.perPerson);
  if (!area) return;
  const rows = participationBySegment(results, area);
  const lagging = paceAtRisk ? [] : rows.filter((row) => row.sparse);
  if (lagging.length > 0) {
    push({
      kind: "areas",
      group: "manual",
      title: count(lagging.length, "área rezagada", "áreas rezagadas"),
      summary: `${listOf(lagging.map((row) => row.label))} ${lagging.length === 1 ? "casi no ha" : "casi no han"} respondido.`,
      facts: lagging.map((row) => ({ label: row.label, value: `${formatPercent(Math.round(row.rate))} · ${row.completed} de ${row.invited}` })),
      items: pendingInAreas(lagging),
    });
  }
  const hidden = draft.visibility === "anonymous" ? rows.filter((row) => row.belowThreshold && !row.sparse) : [];
  if (hidden.length > 0) {
    push({
      kind: "anonimato",
      group: "atencion",
      title: "Áreas bajo el mínimo de anonimato",
      summary: `${listOf(hidden.map((row) => row.label))} no ${hidden.length === 1 ? "llega" : "llegan"} a ${results.threshold} respuestas: sus resultados no se mostrarán.`,
      facts: [{ label: "Mínimo para mostrar", value: count(results.threshold, "respuesta", "respuestas") }, ...hidden.map((row) => ({ label: row.label, value: count(row.completed, "respuesta", "respuestas") }))],
      items: pendingInAreas(hidden),
    });
  }
  const gaps = survey.progress >= READABLE_PARTICIPATION ? analyseSegmentGaps(area, results, []) : null;
  const outlier = gaps?.outliers[0];
  if (gaps && outlier && outlier.row.score !== null) {
    push({
      kind: "brecha",
      group: "atencion",
      title: `${outlier.row.label} muy por debajo del resto`,
      summary: `Puntúa ${formatPercent(Math.round(Math.abs(outlier.gap) * 100))} por debajo del promedio de la encuesta.`,
      facts: [
        { label: outlier.row.label, value: outlier.row.score.toFixed(1).replace(".", ",") },
        { label: "Promedio de la encuesta", value: gaps.average.toFixed(1).replace(".", ",") },
      ],
      items: gaps.outliers.map((other) => ({
        id: other.row.id,
        title: other.row.label,
        detail: `Puntúa ${other.row.score === null ? "—" : other.row.score.toFixed(1).replace(".", ",")} · ${formatPercent(Math.round(Math.abs(other.gap) * 100))} bajo el promedio`,
      })),
    });
  }
}

/** What people wrote: mostly negative, or — close to closing, before results get shared — read by the AI without enough confidence. */
function commentRisks(draft: SurveyDraft, results: SurveyResults, closingSoon: boolean, push: Push): void {
  const comments = buildOpenComments(draft, results, buildRespondents(draft, results));
  if (comments.length === 0) return;
  const average = sentimentAverage(sentimentTotals(comments, new Map()));
  if (average.type === "negative") {
    const negatives = comments.filter((comment) => comment.aiSentiment === "negative");
    const topics = [...new Set(negatives.map((comment) => comment.topic))].slice(0, 3);
    push({
      kind: "comentarios",
      group: "atencion",
      title: "Comentarios mayormente negativos",
      summary: topics.length ? `Se repiten ${listOf(topics.map((topic) => topic.toLowerCase()))}.` : "La mayoría de lo escrito es negativo.",
      facts: [
        { label: "Comentarios", value: String(comments.length) },
        { label: "Negativos", value: String(negatives.length) },
      ],
      items: negatives.slice(0, 20).map((comment) => ({ id: comment.id, title: comment.text, detail: `${comment.topic} · ${comment.respondentName}` })),
    });
  }
  const unsureComments = comments.filter((comment) => comment.aiConfidence < AI_CONFIDENCE_FLOOR);
  const unsure = unsureComments.length;
  if (closingSoon && unsure > 0) {
    push({
      kind: "revisar-comentarios",
      group: "manual",
      title: "Comentarios por revisar",
      summary: `La IA no clasificó ${count(unsure, "comentario", "comentarios")} con seguridad: confirma su sentimiento.`,
      facts: [
        { label: "Por revisar", value: String(unsure) },
        { label: "Comentarios en total", value: String(comments.length) },
      ],
      items: unsureComments.slice(0, 20).map((comment) => ({ id: comment.id, title: comment.text, detail: `La IA lo leyó como ${{ positive: "positivo", neutral: "neutral", negative: "negativo" }[comment.aiSentiment]} · confianza ${Math.round(comment.aiConfidence)}%` })),
    });
  }
}

const worstQuestions = (results: SurveyResults): readonly RiskItem[] =>
  results.rankedQuestions.slice(0, WORST_COUNT).map((question) => ({
    id: question.id,
    title: question.statement,
    detail: `${question.sectionTitle} · ${question.favorability === null ? "sin favorabilidad" : `${formatPercent(question.favorability)} favorable`}`,
  }));

function resultRisks(survey: SurveyListItem, results: SurveyResults, push: Push): void {
  // An eNPS survey has no agreement scales, so no favorability to judge: only its eNPS counts.
  const measuresFavorability = results.rankedQuestions.length > 0;
  const favorabilityNegative = measuresFavorability && toneForFavorability(results.favorability) === "negative";
  const npsNegative = results.nps !== null && toneForNps(results.nps.score) === "negative";
  const facts = [
    ...(measuresFavorability ? [{ label: "Favorabilidad", value: `${formatPercent(results.favorability)} (antes ${formatPercent(results.previousFavorability)})` }] : []),
    ...(results.nps ? [{ label: "eNPS", value: `${formatNpsScore(results.nps.score)} (antes ${formatNpsScore(results.nps.previousScore)})` }] : []),
    { label: "Participación hoy", value: formatPercent(survey.progress) },
  ];
  if (favorabilityNegative || npsNegative) {
    push({
      kind: "resultados",
      group: "critico",
      title: "Resultados en terreno negativo",
      summary: favorabilityNegative && npsNegative ? "La favorabilidad y el eNPS están en negativo." : favorabilityNegative ? "La favorabilidad está en negativo." : "El eNPS está en negativo.",
      facts,
      items: worstQuestions(results),
    });
    return;
  }
  const favorabilityDrop = measuresFavorability ? results.previousFavorability - results.favorability : 0;
  const npsDrop = results.nps ? results.nps.previousScore - results.nps.score : 0;
  if (favorabilityDrop >= FAVORABILITY_DROP || npsDrop >= NPS_DROP) {
    push({
      kind: "caida",
      group: "atencion",
      title: "Bajó frente a la medición anterior",
      summary: favorabilityDrop >= FAVORABILITY_DROP ? `La favorabilidad cayó ${Math.round(favorabilityDrop)} puntos.` : `El eNPS cayó ${Math.round(npsDrop)} puntos.`,
      facts,
      items: worstQuestions(results),
    });
  }
}

/** The pace of an open survey: behind the calendar, short of the target, or out of time. */
function paceRisks(survey: SurveyListItem, today: Date, push: Push): boolean {
  const days = daysUntil(survey.endDate, today);
  const projected = projectedProgress(survey, today);
  const elapsed = elapsedShare(survey, today);
  const facts = participationFacts(survey, days, projected, elapsed);
  const items = pendingPeople(survey);
  const missesTarget = projected !== null && projected < PARTICIPATION_TARGET;
  if (missesTarget && days !== null && days <= FINAL_DAYS) {
    push({ kind: "meta-final", group: "critico", title: "No llegará a la meta de participación", summary: `${daysLeftText(days)} y va para ${formatPercent(projected)}, lejos del ${PARTICIPATION_TARGET}%.`, facts, items });
    return true;
  }
  if (elapsed !== null && elapsed - survey.progress >= LAG_POINTS) {
    push({ kind: "rezagada", group: "manual", title: "Respuestas atrasadas frente al tiempo", summary: `Pasó el ${formatPercent(Math.round(elapsed))} del plazo y respondió el ${formatPercent(survey.progress)}.`, facts, items });
    return true;
  }
  if (missesTarget) {
    push({ kind: "meta", group: "atencion", title: "La meta de participación está en riesgo", summary: `A este ritmo cerrará con ${formatPercent(projected)}, por debajo del ${PARTICIPATION_TARGET}%.`, facts, items });
    return true;
  }
  return false;
}

/** No demographics at all: the block is off or has no fields. The results screen then says it can only read the total. */
function demographicsRisk(survey: SurveyListItem, push: Push): void {
  const demographics = draftOf(survey).demographics;
  if (demographics.enabled && demographics.fields.length > 0) return;
  const open = survey.status === OPEN_STATUS;
  push({
    kind: "sin-demograficos",
    group: open ? "atencion" : "manual",
    title: "No recoge datos demográficos",
    summary: open
      ? "Sus resultados solo se podrán leer en total, sin áreas, líderes ni sedes. Quienes ya respondieron no tendrán esos datos."
      : "Sus resultados solo se podrán leer en total, sin áreas, líderes ni sedes. Agrégalos antes de que abra.",
    facts: [
      { label: "Datos demográficos", value: demographics.enabled ? "Sin campos" : "Desactivados" },
      { label: "Estado", value: survey.status },
      { label: "Participantes", value: `${survey.participants} personas` },
    ],
  });
}

function scheduledRisks(survey: SurveyListItem, today: Date, push: Push): void {
  const untilStart = daysUntil(survey.startDate, today);
  const sinNadie = survey.participants.replace(/\D/g, "") === "0" || survey.participants === "";
  if (survey.status === "Borrador" && sinNadie && untilStart !== null && untilStart <= OPENING_SOON_DAYS) {
    push({
      kind: "sin-participantes",
      group: untilStart <= DRAFT_DAYS ? "critico" : "atencion",
      title: untilStart < 0 ? "Debía abrir y no tiene participantes" : untilStart === 0 ? "Abre hoy y no tiene participantes" : untilStart === 1 ? "Abre mañana y no tiene participantes" : `Abre en ${untilStart} días y no tiene participantes`,
      summary: "Sin participantes no puede pasar a «Por iniciar» ni abrir. Elige a quién va dirigida.",
      facts: [
        { label: "Inicio previsto", value: survey.startDate },
        { label: "Participantes", value: "Ninguno" },
      ],
    });
    return;
  }
  if (survey.status === "Borrador" && untilStart !== null && untilStart <= DRAFT_DAYS) {
    push({
      kind: "borrador",
      group: "manual",
      title: untilStart < 0 ? "Debía abrir y sigue en borrador" : untilStart === 0 ? "Abre hoy y sigue en borrador" : `Abre en ${untilStart} días y sigue en borrador`,
      summary: untilStart < 0 ? "Nunca se envió porque sigue en borrador. Elige fechas nuevas y finalízala para programarla." : "Termínala y publícala, o cambia la fecha de inicio.",
      facts: [
        { label: "Inicio previsto", value: survey.startDate },
        { label: "Cierre", value: survey.endDate },
      ],
    });
    return;
  }
  if (survey.status !== "Por iniciar") return;
  if (survey.participants.replace(/\D/g, "") === "0" || survey.participants === "") {
    push({
      kind: "sin-participantes",
      group: "manual",
      title: "Programada sin participantes",
      summary: "Abrirá sin nadie a quien enviarla. Elige a quién va dirigida.",
      facts: [{ label: "Abre", value: survey.startDate }],
    });
    return;
  }
  if (untilStart !== null && untilStart >= 0 && untilStart <= OPENING_SOON_DAYS) {
    push({
      kind: "abre",
      group: "manual",
      title: untilStart === 0 ? "Abre hoy" : untilStart === 1 ? "Abre mañana" : `Abre en ${untilStart} días`,
      summary: "Comparte el enlace o el QR con quienes no reciben correo.",
      facts: [
        { label: "Abre", value: survey.startDate },
        { label: "Cierra", value: survey.endDate },
        { label: "Invitados", value: `${survey.participants} personas` },
      ],
    });
  }
}

export function surveyRisks(surveys: readonly SurveyListItem[], today: Date): SurveyRisk[] {
  const risks: SurveyRisk[] = [];
  for (const survey of surveys) {
    const base: Base = { survey, pending: pendingOf(survey), daysLeft: daysUntil(survey.endDate, today) };
    const push: Push = (risk) => risks.push({ ...base, ...risk, id: `${survey.id}:${risk.kind}` });

    if (survey.status === "Con error") {
      push({ kind: "error", group: "manual", title: "La carga falló", summary: "La encuesta histórica no se guardó. Hay que volver a intentarlo.", facts: [{ label: "Estado", value: "Con error" }] });
      continue;
    }
    if (survey.status === "Borrador" || survey.status === "Por iniciar" || survey.status === OPEN_STATUS) demographicsRisk(survey, push);
    if (survey.status === "Borrador" || survey.status === "Por iniciar") {
      scheduledRisks(survey, today, push);
      continue;
    }
    if (isNom(survey) && (survey.status === OPEN_STATUS || survey.status === "Finalizado")) {
      const draft = draftOf(survey);
      nomRisks(survey, draft, buildSurveyResults({ draft, item: survey }), push);
      if (survey.status !== OPEN_STATUS) continue;
    }
    if (survey.status !== OPEN_STATUS) continue;

    // Sin riesgo de «pasó su fecha de cierre»: la plataforma cierra sola la encuesta al llegar esa fecha.
    if (base.daysLeft !== null && base.daysLeft < 0) continue;

    const paceAtRisk = paceRisks(survey, today, push);
    const draft = draftOf(survey);
    const results = buildSurveyResults({ draft, item: survey });
    // Sin respuestas (o anónima por debajo del mínimo) no hay resultados que leer: Resultados muestra su estado vacío, así
    // que aquí tampoco salen casos que los lean (terreno negativo, brechas, comentarios). Los de participación sí quedan.
    const respondidas = results.participation.completed;
    if (respondidas === 0 || (draft.visibility === "anonymous" && respondidas < results.threshold)) continue;
    if (!isNom(survey)) resultRisks(survey, results, push);
    areaRisks(survey, draft, results, paceAtRisk, push);
    commentRisks(draft, results, base.daysLeft !== null && base.daysLeft <= CLOSING_SOON_DAYS, push);
  }
  return risks.sort((a, b) => GROUP_ORDER[a.group] - GROUP_ORDER[b.group] || (a.daysLeft ?? 999) - (b.daysLeft ?? 999));
}
