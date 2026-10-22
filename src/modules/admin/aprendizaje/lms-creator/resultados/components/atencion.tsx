import type { IconSvgElement } from '@hugeicons/react'
import { Alert02Icon, Calendar03Icon, CheckListIcon, Clock01Icon, Comment01Icon, Megaphone01Icon, RepeatIcon, Target02Icon } from '@hugeicons/core-free-icons'
import type { AlertaAtencion } from '@/shared/components/BloqueAtencion'
import type { Hallazgo, Lectura, PestanaId, Resultados, TipoReporte } from './datos'

// Lo que hay que hacer con este contenido, en la franja de «N cosas necesitan tu atención».
//
// **Estuvo siendo una pestaña, «Análisis con IA», y dejó de serlo** (Dave, 15-oct). El problema no era cómo se veía
// sino dónde estaba: una pestaña vive por debajo del filtro de fechas, así que elegir una semana podía esconder que
// hay gente bloqueada. Aquí arriba, encima del filtro, se lee siempre y no depende de las fechas que se estén
// mirando.
//
// La franja es `BloqueAtencion`, la misma pieza que estrenó Vacantes y que ya usan Contenidos y Planes de formación:
// plegada enseña todos los asuntos en una línea y, al abrirla, una fila por asunto con su acción.
//
// **Solo entra lo que pide una acción.** Las lecturas buenas —«la tasa de finalización es alta»— se quedan fuera: en
// una franja que se llama «lo que necesita tu atención», una felicitación es ruido.

export type AccionesAtencion = {
  /** Cambiar de pestaña dentro de Resultados. */
  onIr: (destino: PestanaId) => void
  /** Abrir este contenido en el asistente, en ese paso. */
  onEditar: (ancla: string) => void
  /** Irse a otra pantalla del admin. */
  onSalir: (ruta: string) => void
  /** Preparar y bajar ese reporte. */
  onDescargar: (tipo: TipoReporte) => void
}

/** El icono de cada asunto: el de su tema, no el de su gravedad —esa ya la dice el color—. */
const ICONO: Record<string, IconSvgElement> = {
  bloqueos: Alert02Icon,
  'sin-sesion': Calendar03Icon,
  asistencia: Calendar03Icon,
  atasco: CheckListIcon,
  'intentos-media': RepeatIcon,
  difusion: Megaphone01Icon,
  finalizacion: Target02Icon,
  'a-medias': Clock01Icon,
  roleplay: Comment01Icon,
  'encuesta-comentarios': Comment01Icon,
}

const TONO: Record<Lectura, AlertaAtencion['tono']> = {
  negative: 'text-destructive',
  warning: 'text-warning',
  positive: 'text-info',
}

/**
 * Pasa los hallazgos a las alertas de la franja, cada uno con su acción enganchada.
 *
 * Función normal y no un hook: la pantalla la llama después de comprobar que el contenido existe, y un hook ahí
 * detrás rompería el orden de los hooks.
 */
export function alertasDe(resultados: Resultados, acciones: AccionesAtencion): AlertaAtencion[] {
  return resultados.hallazgos
    .filter((hallazgo) => hallazgo.tono !== 'positive')
    .map((hallazgo: Hallazgo) => ({
      id: hallazgo.id,
      icono: ICONO[hallazgo.id] ?? Alert02Icon,
      tono: TONO[hallazgo.tono],
      titulo: hallazgo.titulo,
      detalle: hallazgo.detalle,
      resumen: hallazgo.resumen,
      etiquetaAccion: hallazgo.accion.etiqueta,
      onVer: () => {
        const { editar, pestana, ruta, descargar } = hallazgo.accion
        if (editar) return acciones.onEditar(editar)
        if (pestana) return acciones.onIr(pestana)
        if (ruta) return acciones.onSalir(ruta)
        if (descargar) return acciones.onDescargar(descargar)
      },
    }))
}
