import type { MetricTone } from '../modelo/favorabilityScale'
import type { Tone } from '../modelo/tone'

// Los acentos con nombre del prototipo, traducidos a los tokens del tema. El IconTile «soft» toma
// el color de esta clase de texto.
export const TEXTO_POR_TONO: Record<Tone, string> = {
  brand: 'text-primary',
  positive: 'text-success',
  warning: 'text-warning',
  neutral: 'text-muted-foreground',
  ai: 'text-primary',
  violet: 'text-info',
}

// El estado de cada encuesta en su etiqueta. Mismos tonos que los estados de Vacantes.
export const VARIANTE_ESTADO: Record<string, 'success-light' | 'warning-light' | 'info-light' | 'destructive-light' | 'outline'> = {
  'En progreso': 'info-light',
  Finalizado: 'success-light',
  'Por iniciar': 'warning-light',
  Borrador: 'outline',
  // Las encuestas de la carga histórica mientras se guardan, y si la carga se cae a mitad de camino.
  Cargando: 'info-light',
  'Con error': 'destructive-light',
}

// El color de cada lectura en los minigráficos, como variable del tema.
export const COLOR_TONO: Record<MetricTone, string> = {
  positive: 'var(--success)',
  warning: 'var(--warning)',
  negative: 'var(--destructive)',
}
