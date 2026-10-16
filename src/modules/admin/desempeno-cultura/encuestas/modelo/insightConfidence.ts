import type { ScaleLegendItem, ScaleTone } from "./favorabilityScale";

/**
 * How sure the model is about one claim, on the report's own scale.
 *
 * Confidence is the only thing the AI tab measures that no other tab measures,
 * so it is the one legend this view owns. The three tones are borrowed rather
 * than invented — the same green, yellow and grey Favorabilidad and Comentarios
 * use — because a reader who has learned that green means "solid" two tabs ago
 * should not have to relearn it here.
 */

export type InsightConfidence = "low" | "medium" | "high";

export interface ConfidenceStyle {
  label: string;
  /** What the level actually means, for the legend. */
  meaning: string;
  /** Named tone of the favorability scale; the screen maps it to theme tokens. */
  tone: ScaleTone;
}

export const CONFIDENCE_STYLES: Readonly<Record<InsightConfidence, ConfidenceStyle>> = {
  high: {
    label: "Alta",
    meaning: "Cifra directa de la medición",
    tone: "positive",
  },
  medium: {
    label: "Media",
    meaning: "Lectura razonable, conviene verificar",
    tone: "warning",
  },
  low: {
    label: "Baja",
    meaning: "Indicio, no conclusión",
    tone: "nsnr",
  },
};

/** Best-first: the order a reader wants to see the bands explained in. */
export const CONFIDENCE_ORDER: readonly InsightConfidence[] = ["high", "medium", "low"];

export const CONFIDENCE_LEGEND: readonly ScaleLegendItem[] = CONFIDENCE_ORDER.map((id) => {
  const style = CONFIDENCE_STYLES[id];
  return {
    id,
    label: style.label,
    range: style.meaning,
    tone: style.tone,
  };
});
