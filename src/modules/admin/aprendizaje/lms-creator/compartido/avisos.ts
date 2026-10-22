import { notify } from '@/shared/components/notify'

/**
 * «Ese flujo todavía no está hecho».
 *
 * El playground tiene construida la creación de un contenido, no su edición ni su duplicado. Las puertas que llevaban
 * ahí abrían el asistente de **creación** con la ficha cargada, y quien lo probaba no sabía si al guardar reemplazaba
 * el contenido o creaba otro: confundía más que no hacer nada (Dave, 15-oct).
 *
 * Hasta que el flujo exista, el botón se queda —el sitio donde va es parte del diseño— pero lo dice en vez de llevar
 * a una pantalla que no es la suya.
 */
export const avisarFlujoPendiente = (flujo: string) =>
  notify(`El flujo de ${flujo} aún no existe`, 'Todavía no se ha construido en el playground.', 'info')
