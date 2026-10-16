import type { IconSvgElement } from '@hugeicons/react'
import {
  BubbleChatAddIcon,
  ChartAverageIcon,
  Comment01Icon,
  MailSend01Icon,
  TaskDone01Icon,
} from '@hugeicons/core-free-icons'
import type { PartInfo } from '../../components/anatomy/anatomy-kit'

// Qué trae la respuesta del agente cuando además del texto hay un resultado con el que se puede trabajar.
// Todos existen en el chat real de Suite AI.
export type ChatResult = 'none' | 'proposal' | 'plan' | 'metrics' | 'slot'

// Todo lo que se puede prender o apagar en el chat.
export type ChatConfig = {
  // Conversación nueva: el saludo del día con el orbe grande, en vez de mensajes.
  greeting: boolean
  // Hilo.
  request: boolean
  answer: boolean
  typing: boolean
  sources: boolean
  actions: boolean
  followups: boolean
  feedback: boolean
  result: ChatResult
  // Atajos que propone el agente bajo un resultado.
  chips: boolean
  // Caja de escribir.
  composerChip: boolean
  attach: boolean
  voice: boolean
  // Panel de actividad del agente, en la derecha del marco.
  activity: 'open' | 'closed' | 'none'
}

// Textos de ejemplo de cada caso.
export type ChatSample = {
  greeting: string
  request: string
  answer: string
  sources: string[]
  followups: string[]
  chips: string[]
  composerChip: string
  placeholder: string
  // Qué arma la pantalla cuando el resultado es un slot libre.
  slot: string
}

export type ChatCase = {
  id: string
  title: string
  summary: string
  icon: IconSvgElement
  // Conversación real donde se ve este caso.
  route: string
  config: ChatConfig
  sample: ChatSample
}

// La conversación de «Política de vacaciones» tal cual: de ahí sale la configuración base.
const BASE: ChatConfig = {
  greeting: false,
  request: true,
  answer: true,
  typing: false,
  sources: true,
  actions: true,
  followups: true,
  feedback: true,
  result: 'plan',
  chips: false,
  composerChip: false,
  attach: true,
  voice: true,
  activity: 'open',
}

const MUESTRA_BASE: ChatSample = {
  greeting: 'Bienvenida de nuevo, Carolina',
  request: 'Publica el aviso de la nueva política de vacaciones para la sede Bogotá y asigna el curso de la política.',
  answer:
    'Son dos acciones con efecto real, así que las separé. Ya tengo la audiencia y el borrador; el envío del correo requiere tu confirmación antes de salir.',
  sources: ['Política de vacaciones', 'Audiencias activas'],
  followups: ['¿A quiénes les llega?', 'Cambia la fecha de envío'],
  chips: ['Plan de formación para Ventas', 'Evaluaciones vencidas', 'Riesgo de rotación Q3'],
  composerChip: 'Política de vacaciones',
  placeholder: 'Escribe una tarea o una pregunta',
  slot: 'Aquí la pantalla arma su propio resultado: una tabla, un documento o una comparación.',
}

export const CHAT_CASES: ChatCase[] = [
  {
    id: 'plan',
    title: 'Acción con impacto',
    summary:
      'El agente propone dos acciones que salen del producto (publicar un aviso y asignar un curso) y pide confirmación antes de ejecutarlas. El panel de actividad muestra en qué va.',
    icon: TaskDone01Icon,
    route: '/suite-ai/chat/vacaciones',
    config: BASE,
    sample: MUESTRA_BASE,
  },
  {
    id: 'metricas',
    title: 'Respuesta con números',
    summary:
      'La pregunta se contesta con datos: la tarjeta de métricas trae los números con su fuente y las acciones que salen de ellos, más atajos para seguir.',
    icon: ChartAverageIcon,
    route: '/suite-ai/chat/evaluaciones',
    config: { ...BASE, result: 'metrics', chips: true, activity: 'none' },
    sample: {
      ...MUESTRA_BASE,
      request: 'Prepárame un plan corto de feedback para los líderes de Ventas.',
      answer: 'La terminación de evaluaciones en Ventas cayó 6 puntos esta semana. Te dejo el detalle y un plan corto.',
      sources: ['Evaluaciones 360', 'Reportes de Ventas'],
      followups: ['¿Qué áreas bajaron más?', 'Mándales un recordatorio'],
    },
  },
  {
    id: 'propuesta',
    title: 'Propuesta editable',
    summary:
      'El resultado es un borrador que se ajusta ahí mismo (título, contenidos, audiencia y fechas) antes de confirmarlo. Nada se guarda hasta que lo apruebas.',
    icon: MailSend01Icon,
    route: '/suite-ai/chat/onboarding',
    config: { ...BASE, result: 'proposal', activity: 'none' },
    sample: {
      ...MUESTRA_BASE,
      request: 'Arma un plan de onboarding para los operarios que entran en octubre.',
      answer: 'Armé el plan con seis lecciones cortas. Revísalo y ajústalo antes de asignarlo; todavía no se lo mandé a nadie.',
      sources: ['Contenidos propios', 'Audiencias activas'],
      followups: ['Cambia la audiencia', 'Agrega una lección de seguridad'],
      composerChip: 'Onboarding operativo',
    },
  },
  {
    id: 'texto',
    title: 'Solo respuesta',
    summary:
      'La pregunta se resuelve con texto: la respuesta llega con sus fuentes, sus acciones y seguimientos, sin nada que confirmar. Es el caso más común.',
    icon: Comment01Icon,
    route: '/suite-ai/chat/clima',
    config: { ...BASE, result: 'none', activity: 'none' },
    sample: {
      ...MUESTRA_BASE,
      request: '¿Qué salió en la última encuesta de clima?',
      answer:
        'La encuesta cerró con 312 respuestas. Sube la percepción de liderazgo y baja la de carga de trabajo, sobre todo en Operaciones.',
      sources: ['Encuesta de clima', 'Resultados por área'],
      followups: ['Compáralo con el trimestre pasado', 'Muéstrame Operaciones'],
      composerChip: 'Encuesta de clima',
    },
  },
  {
    id: 'nueva',
    title: 'Conversación nueva',
    summary:
      'Todavía no hay nada escrito: el saludo del día con el orbe, los atajos de lo que quedó pendiente y la caja de escribir. Uno por día, sin animación que se repita.',
    // Icono del caso, no marca de IA: antes era la chispa (auditoría 5-oct, nada de estrellas). El selector de casos
    // solo admite iconos de Hugeicons, así que no puede llevar el orbe.
    icon: BubbleChatAddIcon,
    route: '/suite-ai',
    config: {
      ...BASE,
      greeting: true,
      request: false,
      answer: false,
      sources: false,
      actions: false,
      followups: false,
      feedback: false,
      result: 'none',
      chips: true,
      activity: 'none',
    },
    sample: MUESTRA_BASE,
  },
]

// Nombre exacto de cada parte, el mismo que se dibuja en la vista previa.
export const PART = {
  greeting: 'Saludo del día',
  request: 'Mensaje de la persona',
  answer: 'Respuesta del agente',
  typing: 'Razonando',
  sources: 'Fuentes',
  actions: 'Acciones de la respuesta',
  followups: 'Seguimientos',
  feedback: 'Le sirvió o no',
  result: 'Resultado',
  chips: 'Atajos',
  composer: 'Caja de escribir',
  composerChip: 'Contexto de la caja',
  attach: 'Adjuntar',
  voice: 'Voz',
  send: 'Enviar',
  activity: 'Actividad del agente',
  reopen: 'Volver a abrir la actividad',
} as const

const RESULT_PART: Record<Exclude<ChatResult, 'none'>, string> = {
  proposal: 'Propuesta editable',
  plan: 'Plan con impacto',
  metrics: 'Métricas',
  slot: 'Contenido',
}

const TEXT: Record<string, string> = {
  [PART.greeting]: 'Solo en una conversación nueva: el orbe y una frase que cambia una vez al día.',
  [PART.request]: 'Lo que pidió la persona. Se puede editar y volver a enviar.',
  [PART.answer]: 'Lo que contesta el agente. Llega escribiéndose, no de golpe.',
  [PART.typing]: 'Mientras el agente trabaja: el orbe respira, «Razonando…» brilla y al lado corren los segundos. Sustituye a la respuesta, no se muestran las dos.',
  [PART.sources]: 'De dónde sacó la respuesta. Se puede abrir cada una.',
  [PART.actions]: 'Copiar, rehacer y las acciones propias de la respuesta.',
  [PART.followups]: 'Preguntas que propone el agente para seguir sin escribir de cero.',
  [PART.feedback]: 'Pulgar arriba o abajo sobre la respuesta.',
  [PART.chips]: 'Atajos a lo que quedó pendiente o a lo que se suele preguntar.',
  [PART.composer]: 'La caja de escribir, siempre abajo y a la vista.',
  [PART.composerChip]: 'Sobre qué va la conversación. Se puede quitar.',
  [PART.attach]: 'Sumar un archivo o una pantalla como contexto.',
  [PART.voice]: 'Dictar en vez de escribir.',
  [PART.send]: 'Manda el mensaje. También con Enter.',
  [PART.activity]: 'En qué va el agente: pasos, lo que ya hizo y lo que está esperando.',
  [PART.reopen]: 'Con la actividad cerrada, la pastilla que la vuelve a abrir.',
  'Propuesta editable': 'Un borrador que se ajusta ahí mismo antes de confirmarlo.',
  'Plan con impacto': 'Los pasos, a quién le llega y qué no se puede deshacer, antes de confirmar.',
  Métricas: 'Números con su fuente y las acciones que salen de ellos.',
}

// Las partes que se ven con la configuración actual, en el orden en que aparecen en pantalla.
export function chatParts(config: ChatConfig): PartInfo[] {
  const parts: PartInfo[] = []
  const add = (name: string) => parts.push({ name, text: TEXT[name] ?? '' })

  if (config.greeting) add(PART.greeting)
  if (config.request) add(PART.request)
  if (config.typing) add(PART.typing)
  else if (config.answer) add(PART.answer)

  if (config.result !== 'none') {
    const name = RESULT_PART[config.result]
    // El slot no es parte del componente: lo arma cada pantalla.
    if (config.result === 'slot') parts.push({ name, text: 'Lo que la conversación necesite mostrar.', slot: true })
    else add(name)
  }

  if (config.answer && !config.typing) {
    if (config.sources) add(PART.sources)
    if (config.actions) add(PART.actions)
    if (config.feedback) add(PART.feedback)
    if (config.followups) add(PART.followups)
  }
  if (config.chips) add(PART.chips)

  add(PART.composer)
  if (config.composerChip) add(PART.composerChip)
  if (config.attach) add(PART.attach)
  if (config.voice) add(PART.voice)
  add(PART.send)

  if (config.activity === 'open') add(PART.activity)
  if (config.activity === 'closed') add(PART.reopen)

  return parts
}
