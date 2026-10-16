import { effectiveSentiment, type OpenComment, type Respondent, type Sentiment } from "./questionResponses";
import type { SegmentDefinition, SegmentFilter } from "./surveyResults";

// El sentimiento de un comentario abierto y su promedio (portado de «sentimentScale» y
// «summaryModel» del prototipo). Solo la lógica: el color lo pone la pantalla con el tema.

export const SENTIMENT_ORDER: readonly Sentiment[] = ["positive", "neutral", "negative"];

export const SENTIMENT_LABELS: Readonly<Record<Sentiment, { label: string; plural: string; range: string }>> = {
  positive: { label: "Positivo", plural: "positivos", range: "a favor" },
  neutral: { label: "Neutral", plural: "neutrales", range: "sin carga" },
  negative: { label: "Negativo", plural: "negativos", range: "en contra" },
};

/** Por debajo de esta confianza, el sentimiento que puso la IA se marca para revisar. */
export const AI_CONFIDENCE_FLOOR = 70;

/** El peso de cada sentimiento en el promedio, de 0 a 100. */
export const SENTIMENT_WEIGHT: Readonly<Record<Sentiment, number>> = { positive: 100, neutral: 50, negative: 0 };
export const SENTIMENT_POSITIVE_FLOOR = 60;
export const SENTIMENT_NEGATIVE_CEILING = 40;

export interface SentimentAverage {
  index: number | null;
  type: Sentiment;
  counted: number;
}

export function sentimentAverage(totals: Readonly<Record<Sentiment, number>>): SentimentAverage {
  const counted = SENTIMENT_ORDER.reduce((sum, id) => sum + totals[id], 0);
  if (counted === 0) return { index: null, type: "neutral", counted: 0 };
  const index = SENTIMENT_ORDER.reduce((sum, id) => sum + totals[id] * SENTIMENT_WEIGHT[id], 0) / counted;
  return {
    index,
    type: index >= SENTIMENT_POSITIVE_FLOOR ? "positive" : index <= SENTIMENT_NEGATIVE_CEILING ? "negative" : "neutral",
    counted,
  };
}

/** Los demográficos que un comentario lleva consigo (solo en encuestas públicas). */
// Área y país los lleva el comentario; líder, edad y género salen de quien lo escribió. Los grupos personalizados no
// se conocen por persona, así que no se ofrecen.
export const COMMENT_FILTER_KEYS: readonly string[] = ["area", "country", "leader", "age", "gender"];

/** La clave del demográfico sin el prefijo de la encuesta: «open-clima-q3-2026-dem-country» es «country». */
export const claveDemografico = (key: string): string => (key.includes("-dem-") ? key.slice(key.lastIndexOf("-dem-") + 5) : key);

/**
 * Si un comentario pasa los filtros. Solo se respeta lo que se sabe de él (lo suyo y lo de quien lo escribió): en una
 * encuesta anónima no hay demográficos, y entonces se conserva en vez de inventarle un grupo.
 */
export function commentMatchesFilters(
  comment: OpenComment,
  filters: readonly SegmentFilter[],
  segments: readonly SegmentDefinition[] = [],
  persona: Pick<Respondent, "leader" | "age" | "gender"> | null = null,
): boolean {
  const byKey = new Map<string, string[]>();
  for (const filter of filters) {
    const segment = segments.find((candidate) => candidate.key === filter.key);
    const label = segment?.options.find((option) => option.id === filter.optionId)?.label ?? filter.optionId;
    byKey.set(filter.key, [...(byKey.get(filter.key) ?? []), label]);
  }
  return [...byKey.entries()].every(([rawKey, labels]) => {
    const key = claveDemografico(rawKey);
    const value =
      key === "area" ? comment.area : key === "country" ? comment.country : key === "leader" || key === "age" || key === "gender" ? (persona?.[key] ?? null) : null;
    return value === null || labels.some((label) => value === label);
  });
}

/** Lo que se muestra de la lista de comentarios: varios sentimientos, varios temas y solo los corregidos. Vacío es «todos». */
export type FiltrosComentarios = { temas: readonly string[]; sentimientos: readonly Sentiment[]; soloCorregidos: boolean };
export const SIN_FILTROS_COMENTARIOS: FiltrosComentarios = { temas: [], sentimientos: [], soloCorregidos: false };

export function pasaFiltros(comentario: OpenComment, filtros: FiltrosComentarios, correcciones: ReadonlyMap<string, Sentiment>): boolean {
  if (filtros.sentimientos.length > 0 && !filtros.sentimientos.includes(effectiveSentiment(comentario, correcciones))) return false
  if (filtros.temas.length > 0 && !filtros.temas.includes(comentario.topic)) return false
  return !filtros.soloCorregidos || correcciones.has(comentario.id)
}

