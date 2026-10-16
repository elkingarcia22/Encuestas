import type { MetricTone, ScaleTone } from '../../modelo/favorabilityScale'

// Los tonos de la escala de favorabilidad, en piezas de la librería: la insignia de cada tramo
// (las celdas del mapa de calor, los porcentajes de «Secciones») y el color de su punto o anillo.
// Todo sale de los tokens del tema, así que el modo oscuro funciona solo.

export type VarianteInsignia = 'success' | 'success-light' | 'warning-light' | 'destructive-outline' | 'destructive-light' | 'destructive' | 'secondary'


export const INSIGNIA_POR_TONO: Record<ScaleTone, VarianteInsignia> = {
  'deep-positive': 'success',
  positive: 'success-light',
  warning: 'warning-light',
  // Con `destructive-light` el texto queda blanco sobre rosa en claro (trampa conocida de la librería).
  'softer-negative': 'destructive-outline',
  negative: 'destructive',
  nsnr: 'secondary',
}

export const COLOR_POR_TONO: Record<ScaleTone, string> = {
  'deep-positive': 'var(--success)',
  positive: 'var(--success)',
  warning: 'var(--warning)',
  'softer-negative': 'var(--destructive)',
  negative: 'var(--destructive)',
  nsnr: 'var(--muted-foreground)',
}

/** La lectura de un porcentaje (participación o favorabilidad) en su insignia. */
export const INSIGNIA_POR_LECTURA: Record<MetricTone, 'success-light' | 'warning-light' | 'destructive-outline'> = {
  positive: 'success-light',
  warning: 'warning-light',
  negative: 'destructive-outline',
}

export const COLOR_POR_LECTURA: Record<MetricTone, string> = {
  positive: 'var(--success)',
  warning: 'var(--warning)',
  negative: 'var(--destructive)',
}

export const numero = (valor: number) => Math.round(valor).toLocaleString('es-CO')

/** Un eNPS con su signo: +12, 0, −8. */
export const conSigno = (puntaje: number) => `${puntaje > 0 ? '+' : ''}${Math.round(puntaje)}`

/** La insignia de un tono de leyenda, incluido el azul de la marca. */
export const varianteDeTono = (tono: ScaleTone | 'brand'): VarianteInsignia | 'primary-light' => (tono === 'brand' ? 'primary-light' : INSIGNIA_POR_TONO[tono])

/** El impacto estimado de un accionable (0 a 100) en su insignia. */
export const varianteImpacto = (puntaje: number) => (puntaje >= 95 ? 'success-light' : puntaje >= 85 ? 'primary-light' : puntaje >= 75 ? 'warning-light' : 'secondary')

export const FONDO_ESCALA: Record<ScaleTone | 'brand', string> = {
  'deep-positive': 'color-mix(in srgb, var(--success) 35%, transparent)',
  positive: 'color-mix(in srgb, var(--success) 15%, transparent)',
  warning: 'color-mix(in srgb, var(--warning) 30%, transparent)',
  'softer-negative': 'color-mix(in srgb, var(--destructive) 15%, transparent)',
  negative: 'color-mix(in srgb, var(--destructive) 35%, transparent)',
  nsnr: 'var(--muted)',
  brand: 'color-mix(in srgb, var(--primary) 15%, transparent)',
}

export const TEXTO_ESCALA: Record<ScaleTone | 'brand', string> = {
  'deep-positive': 'color-mix(in srgb, var(--success) 70%, black)',
  positive: 'color-mix(in srgb, var(--success) 70%, black)',
  warning: 'color-mix(in srgb, var(--warning) 70%, black)',
  'softer-negative': 'color-mix(in srgb, var(--destructive) 70%, black)',
  negative: 'color-mix(in srgb, var(--destructive) 70%, black)',
  nsnr: 'var(--muted-foreground)',
  brand: 'var(--primary)',
}
