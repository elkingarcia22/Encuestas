// Los tipos de recurso principal que puede tener una página: su icono en el índice y su tarjeta en «Añadir página».
//
// Los iconos son los de la exploración 1: el enlace en recuadro para lo embebido, el paquete para el SCORM, la
// presentación con barras, la lista con visto para la evaluación, el calendario para la asistencia y el globo para la
// encuesta libre. El roleplay no existe allá y se queda con sus audífonos.

import type { IconSvgElement } from '@hugeicons/react'
import {
  Calendar03Icon,
  CheckListIcon,
  Comment01Icon,
  File01Icon,
  HeadsetIcon,
  LinkSquare01Icon,
  PackageIcon,
  Pdf01Icon,
  PresentationBarChart01Icon,
  StarIcon,
  TextAlignLeftIcon,
  Video01Icon,
} from '@hugeicons/core-free-icons'
import type { TipoRecurso } from './borrador'
import orbeVoz from '@/shared/assets/orbe-voz.webp'

export const ICONO_RECURSO: Record<TipoRecurso, IconSvgElement> = {
  video: Video01Icon,
  pdf: Pdf01Icon,
  texto: TextAlignLeftIcon,
  embebido: LinkSquare01Icon,
  scorm: PackageIcon,
  'presentacion-interactiva': PresentationBarChart01Icon,
  'evaluacion-final': CheckListIcon,
  'encuesta-libre': Comment01Icon,
  'encuesta-satisfaccion': StarIcon,
  roleplay: HeadsetIcon,
  asistencia: Calendar03Icon,
}

export const ICONO_PAGINA_VACIA = File01Icon

export type TarjetaTipo = {
  id: TipoRecurso
  etiqueta: string
  /** El icono de línea de las filas del índice y de la barra del recurso principal. */
  icono: IconSvgElement
  /** La ilustración de vidrio de la tarjeta en «Añadir página»: las mismas que la exploración 1. */
  glass: string
  /** Lleva la marca de IA («Incluye asistencia con IA.»). */
  ia?: boolean
  /** Aparece pero no se puede elegir (HU-LMS-001, RN-03). */
  /**
   * Una ilustración propia en vez de un icono del set Glass. El roleplay la usa porque lo que lo distingue no es
   * «una persona», sino que es **nuestro agente** el que conversa y evalúa: el orbe con la onda de voz lo dice, y
   * `glass-profile` no decía nada (Dave, 9-oct).
   */
  imagen?: string
  deshabilitada?: boolean
  /** Solo en Crear evento (HU-LMS-020). */
  soloEvento?: boolean
}

/**
 * El orden del selector de «Añadir página» (Dave, 9-oct): primero **lo que fabrica la IA** —video, presentación,
 * roleplay y evaluación—, después los **archivos y enlaces** que trae el creador, luego las **encuestas** y al final
 * el SCORM. La asistencia cierra la lista porque solo aparece en Crear evento.
 */
export const TARJETAS_TIPO: TarjetaTipo[] = [
  { id: 'video', etiqueta: 'Video', icono: Video01Icon, glass: 'glass-video', ia: true },
  { id: 'presentacion-interactiva', etiqueta: 'Presentación interactiva', icono: PresentationBarChart01Icon, glass: 'glass-gallery', ia: true },
  // Uno solo desde el 5-oct: el setup con IA del MLP y el paso a paso del MVP, fusionados.
  { id: 'roleplay', etiqueta: 'Evaluador roleplay', icono: HeadsetIcon, glass: 'glass-profile', imagen: orbeVoz, ia: true },
  { id: 'evaluacion-final', etiqueta: 'Evaluación', icono: CheckListIcon, glass: 'glass-tick', ia: true },
  { id: 'pdf', etiqueta: 'PDF', icono: Pdf01Icon, glass: 'glass-document' },
  { id: 'embebido', etiqueta: 'Embebido', icono: LinkSquare01Icon, glass: 'glass-discovery' },
  { id: 'texto', etiqueta: 'Texto', icono: TextAlignLeftIcon, glass: 'glass-paper' },
  // Las dos encuestas del Creator de producción: la libre la arma el creador; la de satisfacción la escribió UBITS y
  // solo se lee (Dave, 7-oct).
  { id: 'encuesta-libre', etiqueta: 'Encuesta libre', icono: Comment01Icon, glass: 'glass-chat' },
  { id: 'encuesta-satisfaccion', etiqueta: 'Encuesta de satisfacción', icono: StarIcon, glass: 'glass-star' },
  { id: 'scorm', etiqueta: 'SCORM', icono: PackageIcon, glass: 'glass-folder' },
  { id: 'asistencia', etiqueta: 'Asistencia', icono: Calendar03Icon, glass: 'glass-calendar', soloEvento: true },
]
