import type { IconSvgElement } from '@hugeicons/react'
import {
  Alert02Icon,
  Briefcase01Icon,
  Calendar03Icon,
  Comment01Icon,
  SecurityCheckIcon,
  Target02Icon,
  TaskDone01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'

// Datos de ejemplo del dashboard general. Todos ilustrativos: el template muestra cómo se
// compone la pantalla, no una empresa real.

export const EMPRESA = { nombre: 'Google', logo: '/google-logo.svg', inicial: 'G' }

export const USUARIO = { nombre: 'Cristian Muñoz', iniciales: 'CM' }

export { iniciales } from '@/modules/design-system/patrones/formato'

// Serie determinista con ondas suaves, para minigráficos sin datos aleatorios.
function serie(n: number, base: number, amplitud: number, pendiente: number, fase = 0) {
  return Array.from({ length: n }, (_, i) =>
    Math.round(base + amplitud * Math.sin((i + fase) / 2.2) + amplitud * 0.4 * Math.cos((i + fase) / 1.3) + pendiente * i),
  )
}

export const PERIODOS: Record<string, string> = {
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  '90d': 'Últimos 90 días',
  '12m': 'Últimos 12 meses',
}

// ── Indicadores ──

export type Indicador = {
  id: string
  titulo: string
  detalle: string
  valor: string
  variacion: number
  sufijo: string
  comparacion: string
  serie: number[]
}

export const INDICADORES: Indicador[] = [
  { id: 'personas', titulo: 'Personas activas', detalle: 'De 5.000 licencias', valor: '646', variacion: 4.2, sufijo: ' %', comparacion: 'vs. mes pasado', serie: serie(12, 560, 14, 7) },
  { id: 'vacantes', titulo: 'Vacantes abiertas', detalle: '3 con entrevistas esta semana', valor: '8', variacion: 2, sufijo: '', comparacion: 'nuevas este mes', serie: serie(12, 4, 1, 0.35, 3) },
  { id: 'formacion', titulo: 'Formación al día', detalle: 'Meta del trimestre: 85 %', valor: '74 %', variacion: 6, sufijo: ' pts', comparacion: 'vs. trimestre pasado', serie: serie(12, 60, 3, 1.2, 1) },
  { id: 'evaluaciones', titulo: 'Evaluaciones 360', detalle: 'El ciclo cierra el 30 sep', valor: '117 de 140', variacion: 9, sufijo: ' pts', comparacion: 'vs. ciclo anterior', serie: serie(12, 70, 6, 4, 2) },
]

// ── Tu día ──

export type Pendiente = {
  id: string
  titulo: string
  detalle: string
  icono: IconSvgElement
  accion: string
  urgencia?: 'hoy' | 'semana'
}

export const PENDIENTES: Pendiente[] = [
  { id: 'calibracion', titulo: 'Calibrar el equipo de Producto', detalle: 'Las 14 autoevaluaciones ya están completas.', icono: UserGroupIcon, accion: 'Calibrar', urgencia: 'hoy' },
  { id: 'vacante', titulo: 'Aprobar la vacante de Ingeniero de datos', detalle: 'La creó Marta Salas hace 2 días.', icono: Briefcase01Icon, accion: 'Aprobar', urgencia: 'hoy' },
  { id: 'recordatorio', titulo: 'Recordar el curso de seguridad', detalle: '12 personas no lo han iniciado y el plazo vence en 5 días.', icono: Alert02Icon, accion: 'Enviar', urgencia: 'semana' },
  { id: 'onboarding', titulo: 'Revisar el onboarding de Diego Ferrer', detalle: 'Entró el 6 de julio y va por el 18 % del plan.', icono: TaskDone01Icon, accion: 'Revisar' },
  { id: 'encuesta', titulo: 'Programar la encuesta de clima', detalle: 'La última se envió hace 6 meses.', icono: Calendar03Icon, accion: 'Programar' },
]

// ── Evaluaciones 360 ──

export const EVALUACIONES = {
  total: 140,
  cierre: '30 de septiembre',
  reparto: [
    { area: 'Completadas', respuestas: 117, color: 'var(--success)' },
    { area: 'En progreso', respuestas: 9, color: 'var(--warning)' },
    { area: 'Sin empezar', respuestas: 14, color: 'var(--muted-foreground)' },
  ],
}

export const SIN_EMPEZAR = [
  { id: 'p1', nombre: 'Ana Restrepo', area: 'Comercial', evaluadores: 4 },
  { id: 'p2', nombre: 'Carlos Medina', area: 'Operaciones', evaluadores: 3 },
  { id: 'p3', nombre: 'Lucía Ortega', area: 'Tecnología', evaluadores: 5 },
]

// ── Formación ──

export const FORMACION_POR_MES = [
  { mes: 'abr', iniciaron: 210, completaron: 132 },
  { mes: 'may', iniciaron: 245, completaron: 168 },
  { mes: 'jun', iniciaron: 232, completaron: 181 },
  { mes: 'jul', iniciaron: 268, completaron: 205 },
  { mes: 'ago', iniciaron: 291, completaron: 238 },
  { mes: 'sep', iniciaron: 274, completaron: 249 },
]

export const FORMACION_TOTALES = [
  { id: 'iniciaron', etiqueta: 'Iniciaron en sep', valor: '274', variacion: -5.8, sufijo: ' %' },
  { id: 'completaron', etiqueta: 'Completaron en sep', valor: '249', variacion: 4.6, sufijo: ' %' },
  { id: 'tasa', etiqueta: 'Tasa de finalización', valor: '91 %', variacion: 9, sufijo: ' pts' },
]

export const PROGRAMAS = [
  { id: 'onboarding', nombre: 'Onboarding 2026', personas: 50, cierre: '15 dic', avance: 72, icono: TaskDone01Icon },
  { id: 'liderazgo', nombre: 'Liderazgo', personas: 60, cierre: '30 nov', avance: 45, icono: Target02Icon },
  { id: 'cultura', nombre: 'Cultura Ubits', personas: 646, cierre: '30 sep', avance: 90, icono: Comment01Icon },
  { id: 'ventas', nombre: 'Ventas B2B', personas: 42, cierre: '31 oct', avance: 33, icono: Briefcase01Icon },
  { id: 'seguridad', nombre: 'Seguridad de la información', personas: 646, cierre: '16 sep', avance: 58, icono: SecurityCheckIcon },
]

// ── Vacantes ──

export type Vacante = {
  id: string
  cargo: string
  area: string
  etapa: 'Nueva' | 'Evaluación CV' | 'Entrevistas' | 'Antecedentes' | 'Oferta'
  paso: number
  candidatos: number
  nuevos: number
  reclutador: string
  diasAbierta: number
}

export const VACANTES: Vacante[] = [
  { id: 'v1', cargo: 'Ingeniero de datos', area: 'Ingeniería', etapa: 'Entrevistas', paso: 3, candidatos: 34, nuevos: 6, reclutador: 'Marta Salas', diasAbierta: 18 },
  { id: 'v2', cargo: 'Diseñadora de producto', area: 'Producto', etapa: 'Oferta', paso: 5, candidatos: 27, nuevos: 0, reclutador: 'Laura Pérez', diasAbierta: 32 },
  { id: 'v3', cargo: 'Ejecutivo comercial', area: 'Comercial', etapa: 'Nueva', paso: 1, candidatos: 4, nuevos: 4, reclutador: 'Andrés Rojas', diasAbierta: 2 },
  { id: 'v4', cargo: 'Analista de nómina', area: 'Finanzas', etapa: 'Evaluación CV', paso: 2, candidatos: 48, nuevos: 11, reclutador: 'Andrés Rojas', diasAbierta: 9 },
  { id: 'v5', cargo: 'Líder de mesa de ayuda', area: 'Operaciones', etapa: 'Antecedentes', paso: 4, candidatos: 12, nuevos: 1, reclutador: 'Laura Pérez', diasAbierta: 25 },
  { id: 'v6', cargo: 'Especialista en clima', area: 'Talento', etapa: 'Entrevistas', paso: 3, candidatos: 18, nuevos: 3, reclutador: 'Marta Salas', diasAbierta: 14 },
]

// ── Actividad ──

export type Actividad = { id: string; quien: string; que: string; cuando: string }

export const ACTIVIDAD: Actividad[] = [
  { id: 'a1', quien: 'Marta Salas', que: 'creó la vacante de Ingeniero de datos', cuando: 'Hace 2 horas' },
  { id: 'a2', quien: 'Camila Bravo', que: 'cerró el ciclo de Cultura Ubits', cuando: 'Ayer' },
  { id: 'a3', quien: 'Tomás Herrera', que: 'completó el plan de Liderazgo', cuando: 'Hace 2 días' },
  { id: 'a4', quien: 'Sofía Duarte', que: 'se sumó al equipo de Personas', cuando: 'Hace 3 días' },
]

