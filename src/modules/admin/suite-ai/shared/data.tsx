import type { IconSvgElement } from '@hugeicons/react'
import {
  Analytics01Icon,
  Briefcase01Icon,
  GoogleDriveIcon,
  Mail02Icon,
  Mortarboard01Icon,
  SlackIcon,
  UserWarning01Icon,
} from '@hugeicons/core-free-icons'

export type ConvoId = 'new' | 'evaluaciones' | 'vacaciones' | 'onboarding' | 'libre' | 'clima' | 'cursos' | 'matriz'

export type ChatMessage = {
  id: number
  role: 'user' | 'agent'
  text: string
  // Respuesta recién llegada: se escribe palabra por palabra la primera vez que se muestra.
  stream?: boolean
}

export const CONVO_TITLES: Record<ConvoId, string> = {
  new: 'Nuevo chat',
  evaluaciones: 'Evaluaciones vencidas en Ventas',
  vacaciones: 'Política de vacaciones',
  onboarding: 'Plan de onboarding para operarios',
  libre: 'Riesgo de rotación Q3',
  clima: 'Resumen encuesta de clima',
  cursos: 'Cursos con baja satisfacción',
  matriz: 'Matriz de talento de liderazgo',
}

export function isConvoId(value: string | undefined): value is ConvoId {
  return Boolean(value && value in CONVO_TITLES)
}

// Primer intercambio de las conversaciones "libres" del historial.
export const SEED_MESSAGES: Partial<Record<ConvoId, ChatMessage[]>> = {
  onboarding: [
    { id: 1, role: 'user', text: 'Prepárame un plan de onboarding para los operarios de planta.' },
    {
      id: 2,
      role: 'agent',
      text: 'Armé un plan de onboarding de 4 semanas para operarios de planta: seguridad en sitio, protocolos del turno, manejo de equipos y una evaluación final. Nada se asigna hasta que lo apruebes.',
    },
  ],
  libre: [
    { id: 1, role: 'user', text: '¿Dónde está el mayor riesgo de rotación este trimestre?' },
    {
      id: 2,
      role: 'agent',
      text: 'El riesgo de rotación Q3 se concentra en Ventas Bogotá: 18 personas con dos señales o más. Puedo preparar un plan de retención con foco en liderazgo.',
    },
  ],
  clima: [
    { id: 1, role: 'user', text: 'Resúmeme la encuesta de clima.' },
    {
      id: 2,
      role: 'agent',
      text: 'La encuesta de clima cerró con 76 % de participación. El puntaje más bajo es «reconocimiento» (3,1 de 5) en operaciones.',
    },
  ],
  cursos: [
    { id: 1, role: 'user', text: '¿Qué cursos tienen la satisfacción más baja?' },
    {
      id: 2,
      role: 'agent',
      text: 'Tres cursos están por debajo de 3,5: «Excel intermedio» (3,1), «Atención al cliente» (3,3) y «Normativa laboral» (3,4). Los tres tienen más de 40 respuestas, así que el dato es confiable.',
    },
  ],
  matriz: [
    { id: 1, role: 'user', text: 'Muéstrame la matriz de talento de liderazgo.' },
    {
      id: 2,
      role: 'agent',
      text: 'De 32 líderes, 9 están en el cuadrante de alto desempeño y alto potencial. Hay 4 con desempeño alto pero potencial bajo que conviene revisar antes del ciclo de sucesión.',
    },
  ],
}

// Respuesta del agente según palabras clave del mensaje (igual que en el prototipo).
export function replyFor(text: string, org = 'Meta Colombia') {
  const t = text.toLowerCase()
  // Respuestas de las sugerencias para seguir que aparecen bajo cada respuesta.
  if (t.includes('retención') || t.includes('retencion')) {
    return 'Armé un borrador de plan de retención para Ventas Bogotá: conversación 1:1 con cada líder en dos semanas, revisión salarial de los 6 casos con más señales y un curso de liderazgo cercano. Nada se asigna hasta que lo apruebes.'
  }
  if (t.includes('18 personas')) {
    return 'Las 18 personas están en 4 equipos: Cuentas clave (7), Canal (5), Televentas (4) y Retail (2). 11 llevan más de 18 meses sin movimiento de cargo. ¿Te muestro la lista con sus señales?'
  }
  if (t.includes('q2')) {
    return 'Frente al Q2, el riesgo en Ventas Bogotá subió de 11 a 18 personas. El resto de la compañía se mantuvo estable: pasó de 23 a 25.'
  }
  if (t.includes('reconocimiento')) {
    return 'En reconocimiento, los comentarios que más se repiten en Operaciones son «nadie nota el esfuerzo del turno noche» y «solo se habla cuando algo sale mal». Son 64 comentarios en total.'
  }
  if (t.includes('sucesión') || t.includes('sucesion')) {
    return 'Con la matriz actual, 5 líderes pueden cubrir posiciones clave en menos de un año. Preparé un plan de sucesión con un mentor para cada uno; falta tu revisión.'
  }
  if (t.includes('excel')) {
    return 'Para Excel intermedio propongo «Análisis de datos con hojas de cálculo»: 4,6 de satisfacción y 38 minutos. Lo puedo reemplazar en las 3 rutas donde aparece.'
  }
  // Respuestas de las acciones del modo voz.
  if (t.includes('aviso para el turno tarde')) {
    return 'Listo el borrador: recuerda el cierre del ciclo el 18 de septiembre y ofrece dos franjas de 20 minutos dentro del turno. Nada sale hasta que lo apruebes.'
  }
  if (t.includes('participación') || t.includes('participacion')) {
    return 'Ventas Bogotá está en 58 % de participación, nueve puntos por debajo del promedio. La caída está en el turno de la tarde: 46 % frente a 71 % de la mañana.'
  }
  if (t.includes('recordatorio')) {
    return 'Preparé el recordatorio para las 24 evaluaciones vencidas. Se envía a los líderes, no a los evaluados. ¿Lo programo para mañana 8:00?'
  }
  if (t.includes('líder') || t.includes('lider')) {
    return 'Los 5 casos sin líder quedaron asignados al jefe de área. Actualicé la matriz y no envié notificaciones todavía.'
  }
  if (t.includes('operaciones')) {
    return 'Operaciones va en 84 % de terminación con 12 vencidas. Ventas está 14 puntos abajo, concentrado en la sede Bogotá.'
  }
  if (t.includes('rotación') || t.includes('rotacion')) {
    return 'El riesgo de rotación Q3 se concentra en Ventas Bogotá: 18 personas con dos señales o más. Puedo preparar un plan de retención con foco en liderazgo.'
  }
  if (t.includes('clima')) {
    return 'La encuesta de clima cerró con 76 % de participación. El puntaje más bajo es «reconocimiento» (3,1 de 5) en operaciones.'
  }
  if (t.includes('analista') || t.includes('vacante')) {
    return 'Hay 3 vacantes de analista abiertas: Analista de datos en entrevistas (12 candidatos), Analista financiero en filtro inicial (28) y Analista de calidad en borrador.'
  }
  return `Listo. Revisé los datos de ${org} dentro de tus permisos y preparé una respuesta corta. Puedo convertirlo en un plan asignable si lo necesitas.`
}

// Sugerencias de un chat nuevo (15 oct, Carlos: tarjetas con icono, título y bajada debajo de la caja, como la
// referencia de Brain²). La bajada dice qué hace el agente con ella.
export type Starter = {
  label: string
  description: string
  icon: IconSvgElement
  draft?: string
  convo?: ConvoId
}

export const STARTERS: Starter[] = [
  {
    label: 'Plan de formación',
    description: 'Feedback para líderes de Ventas',
    icon: Mortarboard01Icon,
    draft: 'Prepárame un plan corto de feedback para los líderes de Ventas.',
  },
  { label: 'Evaluaciones', description: 'Las 360 que siguen vencidas', icon: Analytics01Icon, convo: 'evaluaciones' },
  {
    label: 'Riesgo de rotación',
    description: 'Dónde está el riesgo del Q3',
    icon: UserWarning01Icon,
    draft: '¿Qué equipos tienen más riesgo de rotación en el Q3?',
  },
  {
    label: 'Vacantes abiertas',
    description: 'En qué etapa va cada una',
    icon: Briefcase01Icon,
    draft: '¿En qué etapa van las vacantes de analista abiertas?',
  },
]

export type Connector = {
  name: string
  icon: IconSvgElement
}

// Conectores del menú "+" del composer (igual que en el prototipo).
export const CONNECTORS: Connector[] = [
  { name: 'Gmail', icon: Mail02Icon },
  { name: 'Slack', icon: SlackIcon },
  { name: 'Google Drive', icon: GoogleDriveIcon },
]

// Personas de ejemplo para las listas de las ventanas de acción (las mismas del prototipo).
export const PEOPLE = [
  'Ana Ruiz',
  'Carlos Peña',
  'Diana Mora',
  'Esteban Ríos',
  'Felipe Cano',
  'Gina Salas',
  'Hugo Vélez',
  'Irene Prada',
  'Jorge Amaya',
  'Karen Ospina',
  'Luis Tapia',
  'Marta Quintero',
  'Nicolás Ferro',
  'Olga Bermúdez',
]

export const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('')

export const AUDIENCES = ['14 líderes de Ventas', '32 líderes de toda la empresa', 'Selección manual · 0 personas']
export const DATE_RANGES = ['15 sept → 10 oct', '22 sept → 31 oct', '1 oct → 30 nov']

export type PlanRow = {
  id: number
  title: string
  meta: string
}

export const PLAN_ROWS: PlanRow[] = [
  { id: 1, title: 'Conversaciones difíciles con el equipo', meta: 'Curso · 45 min' },
  { id: 2, title: 'Retroalimentación basada en evidencia', meta: 'Ruta · 2 h' },
  { id: 3, title: 'Taller práctico: sesión 1 a 1', meta: 'Tarea · evidencia' },
]

export type StepState = 'done' | 'now' | 'wait'

export type PlanStep = {
  title: string
  meta: string
  state: StepState
  link?: boolean
}

export const APPROVAL_STEPS: PlanStep[] = [
  { title: 'Identificar la audiencia autorizada', meta: '312 personas · sede Bogotá', state: 'done' },
  { title: 'Redactar el aviso interno', meta: 'Ver borrador', state: 'done', link: true },
  { title: 'Publicar y notificar por correo', meta: 'Requiere tu confirmación', state: 'now' },
  { title: 'Asignar el curso «Política de vacaciones»', meta: 'En espera', state: 'wait' },
]

export type ActivityEntry = {
  title: string
  detail: string
  time?: string
  state: StepState
}

export const AGENT_ACTIVITY: ActivityEntry[] = [
  { title: 'Buscó la audiencia', detail: 'Usuarios · filtro sede = Bogotá · 312 resultados', time: '9:41 · 1,2 s', state: 'done' },
  { title: 'Redactó el aviso', detail: 'Tomó la política v3 del repositorio de la empresa', time: '9:41 · 3,4 s', state: 'done' },
  { title: 'Esperando confirmación', detail: 'Publicar envía correo a 312 personas', state: 'now' },
  { title: 'Asignación del curso', detail: 'Se ejecuta después de publicar', state: 'wait' },
]
