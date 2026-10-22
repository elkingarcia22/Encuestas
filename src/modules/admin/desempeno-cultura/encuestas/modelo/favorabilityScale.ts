/**
 * La escala única de favorabilidad (portada del prototipo «Secciones y subsecciones»).
 *
 * Aquí solo viven los umbrales, las etiquetas y la lectura de cada franja. El color no: cada
 * franja lleva un `tono` con nombre y la pantalla lo traduce a los tokens del tema, así el modo
 * oscuro y los cambios de marca funcionan solos.
 */

/** Los tonos de la escala: dos rojos, el amarillo del medio, dos verdes y el gris de NS/NR. */
export type ScaleTone = "negative" | "softer-negative" | "warning" | "positive" | "deep-positive" | "nsnr";

/** Variante de `Badge` para un puntaje en cada franja. */
export type BandVariant = "negative" | "warning" | "positive";

export interface FavorabilityBand {
  id: string;
  label: string;
  /** Rango como lo dice la leyenda, p. ej. "2 a 2.9". */
  range: string;
  /** Límite superior, incluido. La última franja se queda con todo lo de arriba. */
  max: number;
  tone: ScaleTone;
  variant: BandVariant;
}

/** Una pastilla de leyenda: una franja o la sexta opción NS/NR. */
export interface ScaleLegendItem {
  id: string;
  label: string;
  range: string;
  tone: ScaleTone;
}

export const NSNR_LEGEND_ITEM: ScaleLegendItem = {
  id: "nsnr",
  label: "No sabe / No responde",
  range: "NS/NR",
  tone: "nsnr",
};

export const FAVORABILITY_BANDS: readonly FavorabilityBand[] = [
  { id: "very-unfavorable", label: "Muy desfavorable", range: "1 a 1.9", max: 1.9, tone: "negative", variant: "negative" },
  { id: "unfavorable", label: "Desfavorable", range: "2 a 2.9", max: 2.9, tone: "softer-negative", variant: "negative" },
  { id: "neutral", label: "Neutral", range: "3 a 3.9", max: 3.9, tone: "warning", variant: "warning" },
  { id: "favorable", label: "Favorable", range: "4 a 4.9", max: 4.9, tone: "positive", variant: "positive" },
  { id: "very-favorable", label: "Muy favorable", range: "5", max: Infinity, tone: "deep-positive", variant: "positive" },
];

/** La leyenda completa de la vista de preguntas: cinco franjas + NS/NR. */
export const FAVORABILITY_SCALE_LEGEND: readonly ScaleLegendItem[] = [...FAVORABILITY_BANDS, NSNR_LEGEND_ITEM];

/** Los tres niveles con que se lee un resultado en «Detalle por secciones», con NS/NR. */
export const THREE_TIER_FAVORABILITY_LEGEND: readonly ScaleLegendItem[] = [
  { id: "favorable", label: "Favorables", range: "4 a 5", tone: "positive" },
  { id: "neutral", label: "Neutrales", range: "3 a 3.9", tone: "warning" },
  { id: "unfavorable", label: "Desfavorables", range: "1 a 2.9", tone: "softer-negative" },
  NSNR_LEGEND_ITEM,
];

/** La escala con que se lee el promedio de una persona: sin NS/NR, que no entra en su promedio. */
export const PARTICIPANT_SCORE_LEGEND: readonly ScaleLegendItem[] = THREE_TIER_FAVORABILITY_LEGEND.slice(0, 3);

export interface FavorabilityTier {
  id: "unfavorable" | "neutral" | "favorable";
  label: string;
  /** Límite superior del promedio 1–5, incluido. */
  max: number;
}

export const FAVORABILITY_TIERS: readonly FavorabilityTier[] = [
  { id: "unfavorable", label: "Desfavorables", max: 2.9 },
  { id: "neutral", label: "Neutrales", max: 3.9 },
  { id: "favorable", label: "Favorables", max: Infinity },
];

/** El nivel en que cae un promedio 1–5. */
export const tierForScore = (score: number): FavorabilityTier =>
  FAVORABILITY_TIERS.find((tier) => score <= tier.max) ?? FAVORABILITY_TIERS[FAVORABILITY_TIERS.length - 1];

/** Todos los grupos que puede encender el resaltado de tres niveles, NS/NR incluido. */
export const FAVORABILITY_TIER_IDS: readonly string[] = THREE_TIER_FAVORABILITY_LEGEND.map((item) => item.id);

/** Cómo se clasifica a quien responde un NPS (un 9 es promotor). */
export const NPS_SCALE_LEGEND: readonly ScaleLegendItem[] = [
  { id: "promotores", label: "Promotores", range: "9-10", tone: "positive" },
  { id: "neutros", label: "Neutros", range: "7-8", tone: "warning" },
  { id: "detractores", label: "Detractores", range: "0-6", tone: "softer-negative" },
];

/** Cómo se lee un resultado de eNPS, de −100 a 100: otro eje que la leyenda de arriba. */
export interface NpsScoreBand {
  id: string;
  label: string;
  range: string;
  /** Límite inferior, incluido. La última franja se queda con todo lo de abajo. */
  min: number;
  tone: ScaleTone;
}

export const NPS_SCORE_BANDS: readonly NpsScoreBand[] = [
  { id: "promotores", label: "Promotores", range: "20 o más", min: 20, tone: "positive" },
  { id: "neutros", label: "Neutros", range: "0 a 19", min: 0, tone: "warning" },
  { id: "detractores", label: "Detractores", range: "bajo 0", min: -Infinity, tone: "softer-negative" },
];

/** La franja en que cae un eNPS. */
export const npsBandForScore = (score: number): NpsScoreBand =>
  NPS_SCORE_BANDS.find((band) => score >= band.min) ?? NPS_SCORE_BANDS[NPS_SCORE_BANDS.length - 1];

/** La franja en que cae un promedio 1–5. */
export const bandForScore = (score: number): FavorabilityBand =>
  FAVORABILITY_BANDS.find((band) => score <= band.max) ?? FAVORABILITY_BANDS[0];

/**
 * Cómo se lee un porcentaje de favorabilidad. Un porcentaje no tiene franjas naturales, así que
 * el producto las declara: son las mismas que cita la pestaña de IA.
 */
export const FAVORABILITY_TARGET = 70;
export const FAVORABILITY_FLOOR = 50;

export type FavorabilityVerdict = "healthy" | "watch" | "critical";

export const verdictForFavorability = (value: number): FavorabilityVerdict =>
  value >= FAVORABILITY_TARGET ? "healthy" : value >= FAVORABILITY_FLOOR ? "watch" : "critical";

export const VERDICT_COPY: Readonly<Record<FavorabilityVerdict, { label: string; variant: BandVariant }>> = {
  healthy: { label: "En rango saludable", variant: "positive" },
  watch: { label: "Requiere seguimiento", variant: "warning" },
  critical: { label: "Requiere acción", variant: "negative" },
};

/** `38.3` → `"38,3 %"`. */
export const formatPercent = (value: number): string => `${value.toFixed(1).replace(/\.0$/, "").replace(".", ",")} %`;

/** `3.42` → `"3,4"`. */
export const formatScore = (value: number): string => value.toFixed(1).replace(".", ",");

/** `+2,8 pp` / `-1,4 pp`: la diferencia entre dos porcentajes. */
export const formatDelta = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(1).replace(/\.0$/, "").replace(".", ",")} pp`;
};

/** Hacia dónde se lee una diferencia. */
export const deltaTone = (value: number): "positive" | "negative" | "neutral" =>
  value > 0.5 ? "positive" : value < -0.5 ? "negative" : "neutral";

/** El tono de una tarjeta para cada lectura, compartido entre el home y los resultados. */
export type MetricTone = "positive" | "warning" | "negative";

/** La participación se lee con el mismo piso y meta que la columna «Avance». */
export const toneForParticipation = (rate: number): MetricTone =>
  rate >= 80 ? "positive" : rate >= 50 ? "warning" : "negative";

const VERDICT_TONE: Readonly<Record<FavorabilityVerdict, MetricTone>> = {
  healthy: "positive",
  watch: "warning",
  critical: "negative",
};

export const toneForFavorability = (value: number): MetricTone => VERDICT_TONE[verdictForFavorability(value)];

const NPS_BAND_TONE: Readonly<Record<string, MetricTone>> = {
  promotores: "positive",
  neutros: "warning",
  detractores: "negative",
};

export const toneForNps = (score: number): MetricTone => NPS_BAND_TONE[npsBandForScore(score).id] ?? "warning";

/** `+12` / `-4` / `0`: un eNPS se lee con su signo. */
export const formatNpsScore = (value: number): string => `${value > 0 ? "+" : ""}${Math.round(value)}`;
