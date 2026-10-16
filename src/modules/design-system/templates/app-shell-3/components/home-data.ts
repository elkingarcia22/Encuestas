import type { IconSvgElement } from '@hugeicons/react'
import {
  Alert02Icon,
  Briefcase01Icon,
  Calendar03Icon,
  Mortarboard01Icon,
  TaskDone01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'

export type Indicador = {
  id: string
  etiqueta: string
  valor: string
  contexto: string
  tendencia: number
  icono: IconSvgElement
}

export const INDICADORES: Indicador[] = [
  {
    id: 'vacantes',
    etiqueta: 'Vacantes abiertas',
    valor: '8',
    contexto: '3 con entrevistas esta semana',
    tendencia: 2,
    icono: Briefcase01Icon,
  },
  {
    id: 'formacion',
    etiqueta: 'Formación al día',
    valor: '74%',
    contexto: '12 personas sin iniciar el curso obligatorio',
    tendencia: 6,
    icono: Mortarboard01Icon,
  },
  {
    id: 'evaluaciones',
    etiqueta: 'Evaluaciones pendientes',
    valor: '23',
    contexto: 'El ciclo cierra el 30 de septiembre',
    tendencia: -9,
    icono: UserGroupIcon,
  },
]

// Avance de formación de los últimos seis meses.
export const FORMACION_POR_MES = [
  { mes: 'Abr', iniciado: 210, completado: 132 },
  { mes: 'May', iniciado: 245, completado: 168 },
  { mes: 'Jun', iniciado: 232, completado: 181 },
  { mes: 'Jul', iniciado: 268, completado: 205 },
  { mes: 'Ago', iniciado: 291, completado: 238 },
  { mes: 'Sep', iniciado: 274, completado: 249 },
]

export type Pendiente = {
  id: string
  titulo: string
  detalle: string
  icono: IconSvgElement
  urgencia?: 'alta' | 'media'
}

export const PENDIENTES: Pendiente[] = [
  {
    id: 'calibracion',
    titulo: 'Calibrar el equipo de Producto',
    detalle: 'Las 14 autoevaluaciones ya están completas.',
    icono: UserGroupIcon,
    urgencia: 'alta',
  },
  {
    id: 'vacante',
    titulo: 'Aprobar la vacante de Ingeniero de datos',
    detalle: 'La creó Marta Salas hace 2 días.',
    icono: Briefcase01Icon,
    urgencia: 'alta',
  },
  {
    id: 'recordatorio',
    titulo: 'Enviar recordatorio del curso de seguridad',
    detalle: '12 personas no lo han iniciado y el plazo vence en 5 días.',
    icono: Alert02Icon,
    urgencia: 'media',
  },
  {
    id: 'onboarding',
    titulo: 'Revisar el onboarding de Diego Ferrer',
    detalle: 'Entró el 6 de julio y va por el 18% del plan.',
    icono: TaskDone01Icon,
  },
  {
    id: 'encuesta',
    titulo: 'Programar la encuesta de clima',
    detalle: 'La última se envió hace 6 meses.',
    icono: Calendar03Icon,
  },
]

export type Actividad = {
  id: string
  quien: string
  que: string
  cuando: string
}

export const ACTIVIDAD: Actividad[] = [
  {
    id: 'a1',
    quien: 'Marta Salas',
    que: 'creó la vacante de Ingeniero de datos',
    cuando: 'Hace 2 horas',
  },
  {
    id: 'a2',
    quien: 'Camila Bravo',
    que: 'cerró el ciclo de Cultura Ubits',
    cuando: 'Ayer',
  },
  {
    id: 'a3',
    quien: 'Tomás Herrera',
    que: 'completó el plan de Liderazgo',
    cuando: 'Hace 2 días',
  },
  {
    id: 'a4',
    quien: 'Sofía Duarte',
    que: 'se sumó al equipo de Personas',
    cuando: 'Hace 3 días',
  },
]
