/**
 * Con qué versión del primer paso arranca el constructor.
 *
 * El prototipo tenía dos: «Datos generales» (cinco preguntas, `guided`) y «Parametrización» (cuatro bloques,
 * `parametrizado`). En el playground solo vive la parametrización, que es la que veía cualquiera en el prototipo.
 * El tipo conserva las dos porque la lógica de pasos (`cicloStepper`) todavía las distingue; todo el constructor
 * la llama con `parametrizado`.
 */
export type CicloSetupFlow = "guided" | "parametrizado";

export const CICLO_SETUP_FLOW: CicloSetupFlow = "parametrizado";
