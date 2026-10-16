import type { IconSvgElement } from '@hugeicons/react'
import { Analytics01Icon, Calendar03Icon, CheckmarkCircle02Icon, Copy01Icon, Delete02Icon, Edit02Icon, EyeIcon, Link01Icon, QrCodeIcon, RotateLeft01Icon, UserMultipleIcon } from '@hugeicons/core-free-icons'

// Lo que se puede hacer con una encuesta según su estado. Cada estado ofrece solo lo que se puede
// hacer con él: un borrador no tiene respuestas que leer y una finalizada no tiene nada que editar.
// Lo que no aplica no aparece (no hay opciones apagadas).

export type AccionEncuesta = 'resultados' | 'vistaPrevia' | 'editar' | 'duplicar' | 'finalizar' | 'editarFechas' | 'editarParticipantes' | 'compartirEnlace' | 'descargarQr' | 'reabrir' | 'reintentarCarga' | 'eliminar'

export const ACCIONES: Record<AccionEncuesta, { etiqueta: string; icono: IconSvgElement }> = {
  resultados: { etiqueta: 'Ver resultados', icono: Analytics01Icon },
  vistaPrevia: { etiqueta: 'Vista previa', icono: EyeIcon },
  editar: { etiqueta: 'Editar', icono: Edit02Icon },
  duplicar: { etiqueta: 'Duplicar', icono: Copy01Icon },
  finalizar: { etiqueta: 'Finalizar encuesta', icono: CheckmarkCircle02Icon },
  editarFechas: { etiqueta: 'Editar fechas', icono: Calendar03Icon },
  editarParticipantes: { etiqueta: 'Editar participantes', icono: UserMultipleIcon },
  compartirEnlace: { etiqueta: 'Compartir enlace', icono: Link01Icon },
  descargarQr: { etiqueta: 'Descargar QR', icono: QrCodeIcon },
  reabrir: { etiqueta: 'Reabrir encuesta', icono: RotateLeft01Icon },
  reintentarCarga: { etiqueta: 'Reintentar la carga', icono: RotateLeft01Icon },
  eliminar: { etiqueta: 'Eliminar', icono: Delete02Icon },
}

/**
 * Las acciones de cada estado, agrupadas como se ven en el menú de la fila: primero leer, luego
 * cambiar, luego compartir. «Eliminar» siempre va al final y aparte.
 */
export const ACCIONES_POR_ESTADO: Record<string, AccionEncuesta[][]> = {
  Borrador: [['editar', 'vistaPrevia']],
  'Por iniciar': [
    ['editar', 'vistaPrevia', 'duplicar'],
    ['compartirEnlace', 'descargarQr'],
  ],
  'En progreso': [
    ['resultados', 'vistaPrevia'],
    ['editar', 'duplicar', 'editarFechas', 'editarParticipantes', 'finalizar'],
    ['compartirEnlace', 'descargarQr'],
  ],
  Finalizado: [
    ['resultados', 'vistaPrevia'],
    ['duplicar', 'reabrir'],
  ],
  // Mientras se guarda no hay nada que hacer con ella; si la carga falló, se reintenta o se elimina.
  Cargando: [],
  'Con error': [['reintentarCarga']],
}

export const accionesDe = (estado: string): AccionEncuesta[][] => ACCIONES_POR_ESTADO[estado] ?? []
