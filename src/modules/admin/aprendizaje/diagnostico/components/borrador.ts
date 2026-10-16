import type { Medida } from './programacion'

// El borrador del assessment que se está creando. Vive fuera del componente para que salir del asistente y volver no
// pierda lo que se llevaba, igual que en Crear contenido.
//
// **Es de juguete**: al recargar la página no queda nada, porque el playground no tiene base de datos. Lo que importa
// es que el prototipo cuente bien la historia — en UBITS el assessment no existe hasta terminar el paso 1; de ahí en
// adelante queda como borrador y se guarda solo.

export type BorradorAssessment = {
  planId: string | null
  nombre: string
  nombreTocado: boolean
  resultadosVisibles: boolean
  inicial: Medida
  seguimiento: Medida
  /** El paso más lejano al que se llegó: desde el 2 ya hay borrador y empieza el autoguardado. */
  visitado: number
}

const SIN_MEDIDA: Medida = { programar: false, ventana: undefined }

export const borradorVacio = (): BorradorAssessment => ({
  planId: null,
  nombre: '',
  nombreTocado: false,
  resultadosVisibles: true,
  inicial: SIN_MEDIDA,
  seguimiento: SIN_MEDIDA,
  visitado: 1,
})

let actual: BorradorAssessment = borradorVacio()

export const getBorradorAssessment = () => actual

export function guardarBorradorAssessment(cambio: Partial<BorradorAssessment>) {
  actual = { ...actual, ...cambio }
}

export function limpiarBorradorAssessment() {
  actual = borradorVacio()
}

/** Nada tocado: se entró a mirar y no se llenó ningún campo, así que no hay nada que confirmar al salir. */
export function sinTocar(borrador: BorradorAssessment) {
  return !borrador.planId && !borrador.nombre.trim() && borrador.visitado === 1
}
