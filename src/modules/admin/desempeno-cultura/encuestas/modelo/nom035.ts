/**
 * Las dos mediciones de la NOM 035 y lo que las distingue del resto.
 *
 * La norma mexicana no es "otra encuesta de clima": se responde en una escala
 * cerrada (Siempre → Nunca), se lee como riesgo y no como favorabilidad, y
 * obliga a dos entregables distintos. Por eso sus resultados cambian de
 * pestañas en vez de reusar las de una medición normal.
 *
 * La Guía de Referencia III levanta los factores de riesgo psicosocial y se
 * reporta por categoría → dominio → dimensión. La Guía de Referencia I detecta
 * quién vivió un acontecimiento traumático severo, y su resultado no es un
 * puntaje sino una lista de personas a canalizar.
 */

export const NOM035_RIESGO_SURVEY_ID = "nom035-riesgo-2026";
export const NOM035_ACONTECIMIENTOS_SURVEY_ID = "nom035-acontecimientos-2026";

export type Nom035Variant = "riesgo" | "acontecimientos";

export const nom035VariantOf = (surveyId: string): Nom035Variant | null => {
  if (surveyId === NOM035_RIESGO_SURVEY_ID) return "riesgo";
  if (surveyId === NOM035_ACONTECIMIENTOS_SURVEY_ID) return "acontecimientos";
  return null;
};

/** Cuánta participación exige la norma: el 100%, sin excepción. */
export const NOM035_REQUIRED_PARTICIPATION = 100;
