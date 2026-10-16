import type { IconSvgElement } from '@hugeicons/react'
import {
  AlertCircleIcon,
  Briefcase01Icon,
  Calendar03Icon,
  ChartAverageIcon,
  LockPasswordIcon,
  Megaphone02Icon,
  TaskDaily01Icon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'

export type Kpi = {
  title: string
  sub: string
  value: string
  delta: string
  up: boolean
  deltaNote: string
  spark: number[]
  to: string
}

export const KPIS: Kpi[] = [
  { title: 'Personas activas', sub: 'De 5.000 licencias', value: '646', delta: '+4,2 %', up: true, deltaNote: 'vs. mes pasado', spark: [4, 6, 11, 17, 23, 25, 26], to: '/admin/tareas' },
  { title: 'Vacantes abiertas', sub: '3 con entrevistas esta semana', value: '8', delta: '+2', up: true, deltaNote: 'nuevas este mes', spark: [8, 8, 9, 10, 17, 21, 22], to: '/admin/seleccion/exploraciones/uno' },
  { title: 'Formación al día', sub: 'Objetivo del trimestre: 85 %', value: '74 %', delta: '+6 pts', up: true, deltaNote: 'vs. trimestre pasado', spark: [5, 7, 15, 18, 21, 22, 24], to: '/admin/aprendizaje/lms-creator' },
  { title: 'Evaluaciones 360', sub: 'El ciclo cierra el 30 sep', value: '117/140', delta: '+9 pts', up: true, deltaNote: 'vs. ciclo anterior', spark: [3, 4, 8, 14, 20, 24, 27], to: '/suite-ai/chat/evaluaciones' },
]

export type DayTask = {
  icon: IconSvgElement
  title: string
  text: string
  cta: string
  today: boolean
  toast: string
  to?: string
}

export const DAY_TASKS: DayTask[] = [
  { icon: UserMultiple02Icon, title: 'Calibrar el equipo de Producto', text: 'Las 14 autoevaluaciones ya están completas.', cta: 'Calibrar', today: true, toast: 'Calibración de Producto', to: '/suite-ai/chat/evaluaciones' },
  { icon: Briefcase01Icon, title: 'Aprobar la vacante de Ingeniero de datos', text: 'La creó Marta Salas hace 2 días.', cta: 'Aprobar', today: true, toast: 'Vacante aprobada', to: '/admin/seleccion/exploraciones/uno' },
  { icon: AlertCircleIcon, title: 'Recordar el curso de seguridad', text: '12 personas no lo han iniciado y el plazo vence en 5 días.', cta: 'Enviar', today: false, toast: 'Recordatorio enviado a 12 personas' },
  { icon: TaskDaily01Icon, title: 'Revisar el onboarding de Diego Ferrer', text: 'Entró el 6 de julio y va por el 18 % del plan.', cta: 'Revisar', today: false, toast: 'Onboarding de Diego Ferrer', to: '/admin/aprendizaje/lms-creator' },
  { icon: Calendar03Icon, title: 'Programar la encuesta de clima', text: 'La última se envió hace 6 meses.', cta: 'Programar', today: false, toast: 'Encuesta de clima programada' },
]

export const TRAINING_STATS = [
  { label: 'Iniciaron en sep', value: '274', delta: '−5,8 %', up: false },
  { label: 'Completaron en sep', value: '249', delta: '+4,6 %', up: true },
  { label: 'Tasa de finalización', value: '91 %', delta: '+9 pts', up: true },
]

export const TRAINING_SERIES = [
  { month: 'may', iniciaron: 212, completaron: 168 },
  { month: 'jun', iniciaron: 238, completaron: 190 },
  { month: 'jul', iniciaron: 261, completaron: 214 },
  { month: 'ago', iniciaron: 291, completaron: 238 },
  { month: 'sep', iniciaron: 274, completaron: 249 },
]

export type Program = {
  icon: IconSvgElement
  title: string
  meta: string
  pct: number
}

export const PROGRAMS: Program[] = [
  { icon: TaskDaily01Icon, title: 'Onboarding 2026', meta: '50 personas · cierra el 15 dic', pct: 72 },
  { icon: ChartAverageIcon, title: 'Liderazgo', meta: '60 personas · cierra el 30 nov', pct: 45 },
  { icon: Megaphone02Icon, title: 'Cultura Ubits', meta: '646 personas · cierra el 30 sep', pct: 90 },
  { icon: Briefcase01Icon, title: 'Ventas B2B', meta: '42 personas · cierra el 31 oct', pct: 33 },
  { icon: LockPasswordIcon, title: 'Seguridad de la información', meta: '646 personas · cierra el 16 sep', pct: 58 },
]

export type Vacancy = {
  role: string
  meta: string
  stage: string
  step: string
  pct: number
  cands: string
  fresh: string
  initials: string
  owner: string
}

export const VACANCIES: Vacancy[] = [
  { role: 'Ingeniero de datos', meta: 'Ingeniería · 18 días abierta', stage: 'Entrevistas', step: '3 de 5', pct: 60, cands: '34', fresh: '6 nuevos', initials: 'MS', owner: 'Marta Salas' },
  { role: 'Diseñadora de producto', meta: 'Producto · 32 días abierta', stage: 'Oferta', step: '5 de 5', pct: 100, cands: '27', fresh: 'Sin nuevos', initials: 'LP', owner: 'Laura Pérez' },
  { role: 'Ejecutivo comercial', meta: 'Comercial · 2 días abierta', stage: 'Nueva', step: '1 de 5', pct: 20, cands: '4', fresh: '4 nuevos', initials: 'AR', owner: 'Andrés Rojas' },
  { role: 'Analista de nómina', meta: 'Finanzas · 9 días abierta', stage: 'Evaluación CV', step: '2 de 5', pct: 40, cands: '48', fresh: '11 nuevos', initials: 'AR', owner: 'Andrés Rojas' },
  { role: 'Líder de mesa de ayuda', meta: 'Operaciones · 25 días abierta', stage: 'Antecedentes', step: '4 de 5', pct: 80, cands: '12', fresh: '1 nuevo', initials: 'LP', owner: 'Laura Pérez' },
  { role: 'Especialista en clima', meta: 'Talento · 14 días abierta', stage: 'Entrevistas', step: '3 de 5', pct: 60, cands: '18', fresh: '3 nuevos', initials: 'MS', owner: 'Marta Salas' },
]

export const EVAL_SEGMENTS = [
  { key: 'completadas', label: 'Completadas', value: 117 },
  { key: 'progreso', label: 'En progreso', value: 9 },
  { key: 'pendientes', label: 'Sin empezar', value: 14 },
]

export const EVAL_PENDING = [
  { initials: 'AR', name: 'Ana Restrepo', meta: 'Comercial · 4 evaluadores' },
  { initials: 'CM', name: 'Carlos Medina', meta: 'Operaciones · 3 evaluadores' },
  { initials: 'LO', name: 'Lucía Ortega', meta: 'Tecnología · 5 evaluadores' },
]

export const ACTIVITY = [
  { when: 'Hace 2 horas', initials: 'MS', who: 'Marta Salas', what: 'creó la vacante de Ingeniero de datos' },
  { when: 'Ayer', initials: 'CB', who: 'Camila Bravo', what: 'cerró el ciclo de Cultura Ubits' },
  { when: 'Hace 2 días', initials: 'TH', who: 'Tomás Herrera', what: 'completó el plan de Liderazgo' },
  { when: 'Hace 3 días', initials: 'SD', who: 'Sofía Duarte', what: 'se sumó al equipo de Personas' },
]

// Solo hay datos para estos dos periodos.
export const RANGES = ['Últimos 7 días', 'Últimos 30 días']
