import type { BandVariant, MetricTone, ScaleLegendItem, ScaleTone } from "./favorabilityScale";

/**
 * La escala de riesgo de la NOM 035.
 *
 * Es la misma paleta de favorabilidad leída al revés, y esa inversión es el
 * punto: la NOM 035 se contesta en una escala cerrada Siempre → Nunca donde
 * "Siempre" es el extremo malo, así que un 5 —el mejor número en cualquier
 * otra medición del producto— aquí sería el peor. Para no tener dos verdes
 * distintos conviviendo en la misma app, el resto de los resultados sigue
 * calculando su promedio de 1 a 5 como siempre y aquí se le da la vuelta una
 * sola vez, en `riskScoreOf`. De ese modo el heatmap, las tarjetas y los chips
 * siguen siendo los mismos componentes, con los mismos tokens de color.
 *
 * Los cortes (0–1.4 nulo, 1.5–2.4 bajo, …) son los que publica la guía de
 * referencia III, no una elección de diseño.
 */

export interface RiskBand {
  id: string;
  label: string;
  /** Rango tal como lo enuncia la leyenda, p. ej. "2.5 a 3.4". */
  range: string;
  /** Cota superior, inclusive. La última banda recoge todo lo que quede arriba. */
  max: number;
  /** El tono de la escala con que se pinta la banda; la pantalla lo traduce a tokens. */
  scaleTone: ScaleTone;
  variant: BandVariant;
  tone: MetricTone;
}

export const RISK_BANDS: readonly RiskBand[] = [
  {
    id: "nulo",
    label: "Nulo",
    range: "0 a 1.4",
    max: 1.4,
    scaleTone: "deep-positive",
    variant: "positive",
    tone: "positive",
  },
  {
    id: "bajo",
    label: "Bajo",
    range: "1.5 a 2.4",
    max: 2.4,
    scaleTone: "positive",
    variant: "positive",
    tone: "positive",
  },
  {
    id: "medio",
    label: "Medio",
    range: "2.5 a 3.4",
    max: 3.4,
    scaleTone: "warning",
    variant: "warning",
    tone: "warning",
  },
  {
    id: "alto",
    label: "Alto",
    range: "3.5 a 4.4",
    max: 4.4,
    scaleTone: "softer-negative",
    variant: "negative",
    tone: "negative",
  },
  {
    id: "muy-alto",
    label: "Muy alto",
    range: "4.5 a 5",
    max: Infinity,
    scaleTone: "negative",
    variant: "negative",
    tone: "negative",
  },
];

/**
 * El promedio 1–5 que ya calcula el resto del producto, leído como riesgo.
 *
 * El pipeline puntúa la caja 5 como la mejor respuesta; en la NOM 035 la caja
 * 5 es "Nunca", es decir ausencia de riesgo. Así que el riesgo es el reflejo
 * exacto del promedio: 5 sano → 1 de riesgo.
 */
export const riskScoreOf = (score: number): number => 6 - score;

/** La favorabilidad del pipeline es, en la NOM 035, ausencia de riesgo. */
export const riskPercentOf = (favorability: number): number => 100 - favorability;

export const riskBandForScore = (risk: number): RiskBand =>
  RISK_BANDS.find((band) => risk <= band.max) ?? RISK_BANDS[RISK_BANDS.length - 1];

/** Los cinco ids, para sembrar `useResultsFilters` con esta escala en vez de
 *  la de favorabilidad — el "Resaltar" arranca con las cinco bandas activas. */
export const RISK_BAND_IDS: readonly string[] = RISK_BANDS.map((band) => band.id);

/** La banda en la que cae una sección a partir de su promedio 1–5. */
export const riskBandForSectionScore = (score: number): RiskBand =>
  riskBandForScore(riskScoreOf(score));

export const RISK_SCALE_LEGEND: readonly ScaleLegendItem[] = RISK_BANDS.map((band) => ({
  id: band.id,
  label: band.label,
  range: band.range,
  tone: band.scaleTone,
}));

/**
 * Un eje de resaltado: su texto y las bandas que se pueden dejar encendidas.
 * Versión mínima, sin paleta: cada banda lleva su tono y la pantalla lo pinta.
 */
export interface RiskHighlightScale {
  title: string;
  description: string;
  bands: readonly ScaleLegendItem[];
}

/**
 * "Resaltar por nivel de riesgo" — el "Personalizar" de Preguntas cuando la
 * medición es la NOM 035. Reemplaza a "Resaltar por favorabilidad": ahí las
 * bandas son Favorables/Neutrales/Desfavorables y hay un NS/NR que la norma
 * nunca ofrece, ninguna de las dos cosas describe esta escala.
 */
export const RISK_HIGHLIGHT: RiskHighlightScale = {
  title: "Resaltar por nivel de riesgo",
  description: "Desmarca un nivel para atenuar sus resultados; lo marcado mantiene su color.",
  bands: RISK_SCALE_LEGEND,
};

/** `3.42` → `"3,4"`. Un puntaje de riesgo se lee con un decimal, como todo el resto. */
export const formatRisk = (risk: number): string => risk.toFixed(1).replace(".", ",");

/**
 * El nivel de riesgo de toda la organización: el promedio ponderado de sus
 * categorías. La norma lo pide como una sola cifra porque de ella depende qué
 * acciones queda obligado a tomar el centro de trabajo.
 */
export interface OrganizationRisk {
  score: number;
  band: RiskBand;
}

export const organizationRiskOf = (
  sections: readonly { score: number; n: number }[]
): OrganizationRisk => {
  const answered = sections.filter((section) => section.n > 0);
  const weight = answered.reduce((total, section) => total + section.n, 0);
  const score =
    weight === 0
      ? 0
      : answered.reduce((total, section) => total + riskScoreOf(section.score) * section.n, 0) /
        weight;
  return { score, band: riskBandForScore(score) };
};
