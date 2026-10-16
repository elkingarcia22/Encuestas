import type { ScaleLegendItem, ScaleTone } from '../favorabilityScale'

/**
 * Las leyendas que el comparativo enseña tras el botón de escala de cada
 * panel — el mismo `MeasurementScaleButton` del informe, con las bandas que
 * este dibuja. Salen de la escala de favorabilidad —como tonos con nombre, no
 * colores— para que un verde aquí sea el mismo verde que en el heatmap de una
 * encuesta.
 */

/** Cómo leer la píldora de variación de las tablas de dimensiones y preguntas. */
export const DELTA_LEGEND: readonly ScaleLegendItem[] = [
  {
    id: 'up',
    label: 'Mejora',
    range: 'sube frente a la base',
    tone: 'positive',
  },
  {
    id: 'flat',
    label: 'Sin variación',
    range: 'menos de 0,1 pp',
    tone: 'nsnr',
  },
  {
    id: 'down',
    label: 'Caída',
    range: 'baja frente a la base',
    tone: 'negative',
  },
]

export const DELTA_LEGEND_TITLE = 'Cómo leer la variación'
export const DELTA_LEGEND_DESCRIPTION = 'Cada celda muestra el valor de esa encuesta y, en las comparadas, la diferencia frente a la encuesta base. Debajo, n es cuántas respuestas hay detrás del número.'

/**
 * El eje de "Personalizar" en Secciones y Comentarios: subió, bajó, se
 * mantuvo o no hay con qué comparar esa celda. Reutiliza el mismo verde/rojo
 * de `DELTA_LEGEND` para que subir sea el mismo verde ahí y acá; "Sin dato"
 * se suma aparte porque `DELTA_LEGEND` no distingue una celda sin base de una
 * que de verdad no varió.
 */
export const DELTA_BAND_LEGEND: readonly ScaleLegendItem[] = [
  {
    id: 'up',
    label: 'Subió',
    range: 'sube frente a la base',
    tone: 'positive',
  },
  {
    id: 'down',
    label: 'Bajó',
    range: 'baja frente a la base',
    tone: 'negative',
  },
  {
    id: 'flat',
    label: 'Se mantuvo',
    range: 'menos de 0,1 pp',
    tone: 'nsnr',
  },
  {
    id: 'null',
    label: 'Sin dato',
    range: 'nada que comparar',
    tone: 'nsnr',
  },
]

export const DELTA_BAND_IDS: readonly string[] = DELTA_BAND_LEGEND.map((band) => band.id)

/** La misma píldora, leída en la tabla de comentarios: lo que varía ahí es la
 *  positividad de los comentarios, no un puntaje. */
export const COMMENTS_LEGEND_TITLE = 'Cómo leer la positividad'
export const COMMENTS_LEGEND_DESCRIPTION =
  'Cada celda es el porcentaje de comentarios que la IA leyó como positivos en esa dimensión, y debajo n es cuántos comentarios hay detrás. En las encuestas comparadas, la píldora es la diferencia en puntos porcentuales frente a la base. Abre una fila para ver la distribución completa —positivos, neutrales y negativos— y leer los comentarios.'

/**
 * El tono de una celda del heatmap, por la banda que `heatmapBandId` devuelve.
 * Es un tono con nombre de la escala de favorabilidad, no un color: la
 * pantalla lo traduce a los tokens del tema (fondo, borde y texto).
 */
export const HEATMAP_TONE: Readonly<Record<string, ScaleTone>> = {
  'heatmap-positive-strong': 'deep-positive',
  'heatmap-positive-light': 'positive',
  'heatmap-negative-light': 'softer-negative',
  'heatmap-negative-strong': 'negative',
}

/** Todo lo que no es una de las cuatro bandas — sin variación — se lee en gris. */
export const HEATMAP_NEUTRAL_TONE: ScaleTone = 'nsnr'

export const HEATMAP_LEGEND: readonly ScaleLegendItem[] = [
  { id: 'positive-strong', label: 'Mejora fuerte', range: '+5 pp o más', tone: 'deep-positive' },
  { id: 'positive-light', label: 'Mejora leve', range: '+1 a +4 pp', tone: 'positive' },
  { id: 'neutral', label: 'Sin variación', range: '0 pp', tone: HEATMAP_NEUTRAL_TONE },
  { id: 'negative-light', label: 'Caída leve', range: '−1 a −4 pp', tone: 'softer-negative' },
  { id: 'negative-strong', label: 'Caída fuerte', range: '−5 pp o menos', tone: 'negative' },
]

export const HEATMAP_LEGEND_TITLE = 'Escala del heatmap'
export const HEATMAP_LEGEND_DESCRIPTION = 'Cada celda es la diferencia, en puntos porcentuales, entre ese segmento y el promedio general de la encuesta base en esa dimensión. Los segmentos con menos de 5 respuestas quedan reservados.'
