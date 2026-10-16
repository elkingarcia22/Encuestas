import {
  Alert02Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
} from '@hugeicons/core-free-icons'

// Los indicadores del encabezado y los textos de los rankings vacíos.

export const INDICADORES = [
  { clave: 'vigentes', etiqueta: 'Planes vigentes', icono: BookOpen01Icon, color: 'text-muted-foreground' },
  { clave: 'completados', etiqueta: 'Completados', icono: CheckmarkCircle02Icon, color: 'text-success' },
  { clave: 'enCurso', etiqueta: 'En curso', icono: Loading03Icon, color: 'text-info' },
  { clave: 'sinIniciar', etiqueta: 'Sin iniciar', icono: Alert02Icon, color: 'text-destructive' },
] as const

// Cada vacío lleva su ilustración glass (`PrimeraVez`), no un icono de línea en un `Empty` armado a mano.
export const VACIOS = {
  estudio: {
    icono: 'glass-clock',
    titulo: 'Aún nadie ha estudiado este mes',
    descripcion: 'Cuando alguien registre tiempo de estudio, aparecerá en este ranking.',
  },
  estudioSinDatos: { icono: 'glass-chart', titulo: 'Sin datos.', descripcion: 'Cuando haya actividad de estudio, aparecerá en este ranking.' },
  areas: {
    icono: 'glass-graph',
    titulo: 'Aún no hay estudio registrado por área este mes',
    descripcion: 'El ranking se actualizará cuando haya actividad de estudio en las áreas.',
  },
  areasSinDatos: { icono: 'glass-graph', titulo: 'Sin datos de áreas.', descripcion: 'Cuando haya actividad de estudio en las áreas, aparecerá aquí.' },
}
