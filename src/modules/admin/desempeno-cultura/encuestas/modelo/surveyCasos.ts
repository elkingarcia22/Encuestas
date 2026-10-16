// Las encuestas «Casos ·» de QA ya no van en la lista (versión de pruebas limpia): estas dos marcas se quedan solo para
// que las pantallas que preguntan `fallaEnQA` sigan compilando; ninguna encuesta de la lista las lleva.
// La encuesta que hace fallar todo lo que puede fallar, para ver los estados de error del tablero de QA: exportarla,
// descargar su reporte, compararla, analizarla con IA, guardar su edición o pedirle textos a la IA en su constructor
// siempre falla (pedido de Elkin, 14-oct). Cada pantalla lo pregunta con `fallaEnQA`.
export const ENCUESTA_QUE_FALLA = "casos-errores";
// Su gemela en borrador, para los errores del constructor (guardado automático, la IA al escribir, importar
// participantes): una encuesta finalizada ya no se puede editar por ningún camino (14-oct).
export const BORRADOR_QUE_FALLA = "casos-errores-borrador";

/** Si alguna de estas encuestas es la de prueba que falla. */
export const fallaEnQA = (...ids: readonly (string | null | undefined)[]): boolean => ids.some((id) => id === ENCUESTA_QUE_FALLA || id === BORRADOR_QUE_FALLA);
