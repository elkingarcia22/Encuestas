// Las encuestas «Casos ·» de QA ya no van en la lista (versión de pruebas limpia): estas dos marcas se quedan solo para
// que las pantallas que preguntan `fallaEnQA` sigan compilando; ninguna encuesta de la lista las lleva.
export const ENCUESTA_QUE_FALLA = "casos-errores";
export const BORRADOR_QUE_FALLA = "casos-errores-borrador";

/** Si alguna de estas encuestas es la de prueba que falla. */
export const fallaEnQA = (...ids: readonly (string | null | undefined)[]): boolean => ids.some((id) => id === ENCUESTA_QUE_FALLA || id === BORRADOR_QUE_FALLA);
