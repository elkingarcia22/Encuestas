import type { IconSvgElement } from '@hugeicons/react'
import {
  ChartAverageIcon,
  ChartLineData02Icon,
  Comment01Icon,
  Database01Icon,
  Edit02Icon,
  File01Icon,
  GitCompareIcon,
  Loading03Icon,
  MailSend01Icon,
  PencilEdit02Icon,
  TaskDone01Icon,
  TextSelectionIcon,
  UserGroupIcon,
  UserSearch01Icon,
} from '@hugeicons/core-free-icons'
import {
  FIELD_SHORTCUTS,
  FIRST_PROPOSAL_REPLY,
  FIRST_REQUEST,
  PROPOSALS,
  fieldDetailsFor,
} from '@/modules/admin/aprendizaje/lms-creator/components/agent-replies'
import type { ReplyDetails, ReplySource } from '@/modules/admin/suite-ai/shared/reply-details'
import type { PartInfo } from '../../../components/anatomy/anatomy-kit'

// Formas que puede tomar el resultado, todas con componentes reales del chat de Suite AI o del editor:
// solo texto, la propuesta «Actual / Propuesta» del editor, la tarjeta de propuesta editable, el plan de aprobación,
// la tarjeta de métricas o un slot que arma cada pantalla.
export type AgentResult = 'none' | 'field' | 'card' | 'plan' | 'metrics' | 'slot'

// Todo lo que se puede prender o apagar en el agente contextual.
export type AgentConfig = {
  state: 'open' | 'closed'
  // Con el panel cerrado: pastilla «Orbit» completa o solo el orbe.
  reopen: 'full' | 'orb'
  // Cabecera y contexto.
  close: boolean
  context: boolean
  // Conversación.
  request: boolean
  answer: boolean
  typing: boolean
  sources: boolean
  actions: boolean
  followups: boolean
  result: AgentResult
  shortcuts: boolean
  // Caja del chat.
  news: boolean
  chip: boolean
  attach: boolean
  voice: boolean
}

// Textos de ejemplo de cada caso.
export type AgentSample = {
  // Qué hay en la pantalla que el agente acompaña (texto del slot grande).
  screen: string
  // Botones propios de la pantalla (secundario y primario), que se ven con el panel cerrado; «Orbit» va después de
  // los dos, al final de la fila («⋯» · terciario · secundario · primario · IA).
  screenActions: [string, string]
  contextName: string
  contextDetail: string
  request: string
  answer: string
  // Fuentes, seguimientos y otras versiones de la respuesta.
  details: ReplyDetails
  // Propuesta «Actual / Propuesta»: lo de hoy, las versiones que propone y a qué se aplica.
  field: { current: string; proposals: string[]; applyLabel: string; appliedNote: string }
  // Qué arma la pantalla cuando el resultado es un slot libre.
  slot: string
  shortcuts: string[]
  // Pastilla de contexto en la caja del chat.
  chip: string
  placeholder: string
}

export type AgentCase = {
  id: string
  title: string
  summary: string
  icon: IconSvgElement
  // Pantalla real donde se ve este caso.
  route: string
  config: AgentConfig
  sample: AgentSample
}

// El panel del editor de LMS tal cual: de ahí sale la configuración base.
const BASE: AgentConfig = {
  state: 'open',
  reopen: 'full',
  close: true,
  context: true,
  request: true,
  answer: true,
  typing: false,
  sources: true,
  actions: true,
  followups: true,
  result: 'field',
  shortcuts: true,
  news: false,
  chip: true,
  attach: true,
  voice: true,
}

const SRC = {
  cv: { label: 'Hoja de vida.pdf', detail: 'Subida el 2 sept · 2 páginas', icon: File01Icon },
  entrevista: { label: 'Entrevista técnica', detail: 'Notas de Carlos Peña · 9 sept', icon: Comment01Icon },
  sql: { label: 'Prueba de SQL', detail: '92 de 100 · 5 sept', icon: TaskDone01Icon },
  salida: { label: 'Encuesta de salida', detail: 'Marzo · 17 de 19 respondieron', icon: ChartAverageIcon },
  nomina: { label: 'Nómina · marzo', detail: 'Retiros de Logística · solo tu alcance', icon: Database01Icon },
  pruebas: { label: 'Pruebas técnicas', detail: '3 finalistas · del 5 al 9 sept', icon: TaskDone01Icon },
  entrevistas: { label: 'Entrevistas', detail: 'Notas del panel · 3 entrevistas', icon: Comment01Icon },
  catalogo: { label: 'Catálogo de cursos', detail: 'Actualizado el 10 sept · 214 cursos', icon: File01Icon },
  estructura: { label: 'Estructura organizacional', detail: 'Actualizada el 1 sept · 1.630 colaboradores', icon: UserGroupIcon },
  aviso: { label: 'Aviso «Horario de diciembre»', detail: 'Borrador · editado hace 5 min', icon: File01Icon },
  politica: { label: 'Política de vacaciones v3', detail: 'Borrador del 12 sept', icon: File01Icon },
  eval360: { label: 'Evaluaciones 360', detail: 'Ciclo 2026-1 · 312 evaluados', icon: File01Icon },
} satisfies Record<string, ReplySource>

const SAMPLE: AgentSample = {
  screen: 'La pantalla que la persona ya tenía abierta: una ficha, un tablero, un editor o una lista.',
  screenActions: ['Vista previa', 'Guardar'],
  contextName: 'Lo que está abierto',
  contextDetail: 'sección elegida',
  request: 'Resúmeme esto',
  answer: 'Leí lo que tienes abierto y esto es lo que encontré.',
  details: { sources: [], followups: [], alternates: ['Otra forma de decirlo: esto es lo que encontré en lo que tienes abierto.'] },
  field: {
    current: 'Lo que hay hoy en la pantalla.',
    proposals: ['Lo que el agente propone dejar en su lugar.', 'Otra forma de decirlo.', 'Una tercera versión.'],
    applyLabel: 'Aplicar',
    appliedNote: 'Aplicado a la pantalla',
  },
  slot: 'El resultado que arma esta pantalla: una tabla, un documento o una comparación.',
  shortcuts: ['Resumir en tres puntos', 'Explicar como si fuera nuevo'],
  chip: 'Lo que está abierto',
  placeholder: 'Pregunta o pide un cambio sobre esto',
}

export const AGENT_CASES: AgentCase[] = [
  {
    id: 'editor',
    title: 'Mejorar un campo del editor',
    summary: 'El panel del editor de LMS tal cual: la respuesta trae la propuesta para el campo, que se aplica, se cambia por otra versión o se deshace.',
    // El lápiz sin la chispa: el icono del caso no marca IA (auditoría 5-oct, nada de estrellas).
    icon: Edit02Icon,
    route: '/admin/aprendizaje/lms-creator/contenidos/onboarding-operativo',
    config: { ...BASE },
    sample: {
      ...SAMPLE,
      screen: 'El editor del contenido: título, pestañas y el formulario con el campo Descripción.',
      screenActions: ['Previsualizar', 'Publicar'],
      contextName: 'Onboarding operativo',
      contextDetail: 'campo Descripción',
      request: FIRST_REQUEST,
      answer: FIRST_PROPOSAL_REPLY,
      details: fieldDetailsFor(FIRST_PROPOSAL_REPLY),
      field: {
        // La misma descripción con la que abre el editor.
        current: 'Curso de inducción para el área operativa. Incluye normas de seguridad y uso de equipos.',
        proposals: PROPOSALS,
        applyLabel: 'Aplicar al campo',
        appliedNote: 'Aplicado al campo Descripción',
      },
      shortcuts: FIELD_SHORTCUTS,
      chip: 'Onboarding operativo · Descripción',
      placeholder: 'Pide un cambio sobre este campo',
    },
  },
  {
    id: 'resumen',
    title: 'Resumen de un registro',
    summary: 'El agente lee la ficha y responde en texto, con la fuente de lo que dice y preguntas para seguir.',
    icon: UserSearch01Icon,
    route: '/design-system/agente-contextual/resumen-registro',
    config: { ...BASE, reopen: 'orb', result: 'none' },
    sample: {
      ...SAMPLE,
      screen: 'La ficha de la candidata: pestañas, hoja de vida, entrevista y notas.',
      screenActions: ['Mover de etapa', 'Agendar entrevista'],
      contextName: 'Hoja de vida de Laura Méndez',
      contextDetail: 'Analista de datos',
      request: 'Resúmeme a esta candidata para el comité.',
      answer:
        'Laura tiene cinco años en analítica, tres liderando un equipo pequeño. Su prueba de SQL quedó en 92 sobre 100, la mejor del proceso. El riesgo: no ha trabajado en retail y el sector le va a tomar tiempo.',
      details: {
        sources: [SRC.cv, SRC.entrevista, SRC.sql],
        followups: ['Hazlo más corto para el correo', 'Resalta los riesgos'],
        alternates: [
          'Para el comité: cinco años en analítica y tres liderando, la mejor prueba de SQL del proceso (92 sobre 100) y una sola alerta, que nunca ha trabajado en retail.',
        ],
      },
      shortcuts: ['¿Qué preguntar en la segunda entrevista?', 'Comparar con el perfil del cargo'],
      chip: 'Laura Méndez · Hoja de vida',
      placeholder: 'Pregunta sobre esta candidata',
    },
  },
  {
    id: 'dato',
    title: 'Explicar un dato',
    summary: 'Se toca una barra del tablero: la franja de contexto cambia y el agente explica ese número en texto, con sus fuentes.',
    icon: ChartLineData02Icon,
    route: '/design-system/agente-contextual/explicar-dato',
    config: { ...BASE, result: 'none' },
    sample: {
      ...SAMPLE,
      screen: 'El tablero de rotación con su fila de cifras y sus gráficos.',
      screenActions: ['Descargar', 'Cambiar periodo'],
      contextName: 'Rotación en Logística',
      contextDetail: 'marzo',
      request: '¿Por qué subió la rotación en marzo?',
      answer:
        'Pasó de 4,1 % a 7,3 %. Casi todo viene del turno de noche en Planta Funza: 14 de las 19 salidas. En la encuesta de salida se repiten tres razones: horario, transporte y salario.',
      details: {
        sources: [SRC.salida, SRC.nomina],
        followups: ['¿Cómo va contra el año pasado?', 'Arma un plan para el turno de noche'],
        alternates: [
          'La rotación de Logística saltó a 7,3 % en marzo. El turno de noche de Planta Funza explica 14 de las 19 salidas, y en la encuesta de salida pesan el horario, el transporte y el salario.',
        ],
      },
      shortcuts: ['Ver solo el turno de noche', '¿Qué área le sigue?'],
      chip: 'Rotación · marzo',
      placeholder: 'Pregunta sobre este dato',
    },
  },
  {
    id: 'comparar',
    title: 'Comparar opciones',
    summary: 'La pantalla arma su propia tabla dentro del resultado; el agente la presenta y dice qué no sabe.',
    icon: GitCompareIcon,
    route: '/design-system/agente-contextual/comparar',
    config: { ...BASE, result: 'slot', shortcuts: false },
    sample: {
      ...SAMPLE,
      screen: 'Los tres finalistas, uno al lado del otro.',
      screenActions: ['Ver los 42 candidatos', 'Avanzar finalista'],
      contextName: 'Tres finalistas',
      contextDetail: 'Analista de datos',
      request: 'Compáralos y dime con cuál seguir.',
      answer: 'Los tres cumplen lo básico. Armé la tabla con lo que sí se puede comparar y dejé abajo lo que no sé.',
      details: {
        sources: [SRC.pruebas, SRC.entrevistas],
        followups: ['Compara solo la parte técnica', '¿Qué me falta para decidir?'],
        alternates: ['Puse a los tres finalistas en una tabla con lo comparable y separé lo que todavía no sé de cada uno.'],
      },
      slot: 'La tabla de comparación, la recomendación y lo que el agente no sabe.',
      shortcuts: ['Resumir la recomendación', 'Preparar el correo al comité'],
      chip: 'Finalistas · Analista de datos',
      placeholder: 'Pide otra comparación',
    },
  },
  {
    id: 'formulario',
    title: 'Completar un formulario',
    summary: 'El agente llena la propuesta (título, contenidos, audiencia y fechas) y la persona la edita ahí mismo antes de confirmar.',
    icon: PencilEdit02Icon,
    route: '/design-system/agente-contextual/completar-formulario',
    config: { ...BASE, result: 'card' },
    sample: {
      ...SAMPLE,
      screen: 'El formulario del plan de formación, con sus campos todavía vacíos.',
      screenActions: ['Guardar borrador', 'Asignar plan'],
      contextName: 'Plan de formación nuevo',
      contextDetail: 'Ventas',
      request: 'Llena el plan con lo que hablamos: feedback para los líderes de Ventas.',
      answer: 'Llené el título, tres contenidos, la audiencia y las fechas. Puedes editar todo aquí mismo; nada se asigna hasta que lo confirmes.',
      details: {
        sources: [SRC.catalogo, SRC.estructura],
        followups: ['Cambia las fechas a octubre', 'Suma un curso de liderazgo'],
        alternates: ['El plan quedó con título, tres contenidos, audiencia y fechas. Edita lo que haga falta: se asigna solo cuando confirmes.'],
      },
      shortcuts: ['Escribir el objetivo del plan', 'Proponer una evaluación final'],
      chip: 'Plan · Feedback efectivo',
      placeholder: 'Pide un cambio sobre el plan',
    },
  },
  {
    id: 'reescribir',
    title: 'Reescribir una selección',
    summary: 'Sobre el párrafo elegido: lo de hoy arriba y la propuesta abajo; se reemplaza, se pide otra versión o se deshace.',
    icon: TextSelectionIcon,
    route: '/design-system/agente-contextual/reescribir-seleccion',
    config: { ...BASE, result: 'field', shortcuts: false },
    sample: {
      ...SAMPLE,
      screen: 'El aviso interno con sus párrafos y la barra flotante sobre el texto elegido.',
      screenActions: ['Vista previa', 'Enviar aviso'],
      contextName: 'Aviso «Horario de diciembre»',
      contextDetail: 'párrafo 2',
      request: 'Hazlo más corto y más cálido.',
      answer: 'Propuse un cambio para el párrafo 2. El aviso no cambia hasta que lo reemplaces.',
      details: {
        sources: [SRC.aviso],
        followups: ['Hazlo más formal', 'Agrega el horario del 26'],
        alternates: ['Dejé una versión más corta y cercana del párrafo 2. El aviso sigue igual hasta que la reemplaces.'],
      },
      field: {
        current:
          'Se informa a todos los colaboradores que, debido a la temporada, los días 24 y 31 de diciembre la jornada laboral finalizará a las 2:00 p. m.',
        proposals: [
          'El 24 y el 31 de diciembre salimos a las 2:00 p. m. para que alcances a estar con los tuyos.',
          'Este 24 y 31 de diciembre la jornada termina a las 2:00 p. m. Disfruta la tarde con tu gente.',
          'Buenas noticias: el 24 y el 31 de diciembre salimos a las 2:00 p. m.',
        ],
        applyLabel: 'Reemplazar',
        appliedNote: 'Reemplazado en el párrafo 2',
      },
      shortcuts: ['Revisar la ortografía del aviso', 'Acortar todo el aviso'],
      chip: 'Horario de diciembre · Párrafo 2',
      placeholder: 'Pide un cambio sobre este párrafo',
    },
  },
  {
    id: 'revision',
    title: 'Revisar antes de publicar',
    summary: 'Antes de publicar: los pasos del agente, a quién le llega y lo que no se puede deshacer, con la confirmación a la vista.',
    icon: TaskDone01Icon,
    route: '/design-system/agente-contextual/revision',
    config: { ...BASE, reopen: 'orb', result: 'plan', shortcuts: false },
    sample: {
      ...SAMPLE,
      screen: 'El aviso de la política por publicar, con su audiencia y el borrador.',
      screenActions: ['Vista previa', 'Publicar'],
      contextName: 'Aviso «Política de vacaciones»',
      contextDetail: 'sede Bogotá',
      request: 'Revisa el aviso de la nueva política de vacaciones antes de publicarlo y asigna el curso.',
      answer:
        'Son dos acciones con efecto real, así que las separé. Ya tengo la audiencia y el borrador; el envío del correo requiere tu confirmación antes de salir.',
      details: {
        sources: [SRC.politica, SRC.estructura],
        followups: ['Muéstrame el borrador completo', '¿Quiénes no tienen correo?'],
        alternates: [
          'Separé la tarea en dos pasos porque ambos tienen efecto real: publicar el aviso y asignar el curso. La audiencia y el borrador están listos; el correo no sale sin tu confirmación.',
        ],
      },
      shortcuts: ['Revisar el tono del aviso', '¿Qué pasa si no publico hoy?'],
      chip: 'Política de vacaciones v3',
      placeholder: 'Pregunta sobre la revisión',
    },
  },
  {
    id: 'accion',
    title: 'Actuar sobre una selección',
    summary: 'Con 24 personas en la mira: los números, quiénes son y la confirmación antes de enviar el recordatorio.',
    icon: MailSend01Icon,
    route: '/design-system/agente-contextual/accion-masiva',
    config: { ...BASE, result: 'metrics', shortcuts: false },
    sample: {
      ...SAMPLE,
      screen: 'La lista de evaluaciones vencidas, con las personas seleccionadas.',
      screenActions: ['Descargar', 'Enviar recordatorio'],
      contextName: 'Evaluaciones vencidas',
      contextDetail: '24 personas de Ventas',
      request: 'Mándales un recordatorio a quienes tienen la evaluación vencida.',
      answer:
        'Son 24 evaluaciones vencidas de 80 asignadas en Ventas, y el ciclo cierra el 18 de septiembre. Revisa a quién le llega antes de enviar: el correo no se puede deshacer.',
      details: {
        sources: [SRC.eval360, SRC.estructura],
        followups: ['Programa el recordatorio para mañana', 'Compara con Operaciones'],
        alternates: [
          'En Ventas quedan 24 evaluaciones vencidas y el ciclo cierra el 18 de septiembre. El recordatorio sale solo cuando lo confirmes.',
        ],
      },
      shortcuts: ['Ver solo las que no tienen líder', 'Cambiar la fecha límite'],
      chip: 'Evaluaciones vencidas · Ventas',
      placeholder: 'Pide un cambio sobre este envío',
    },
  },
  {
    id: 'estados',
    title: 'Estados y límites',
    summary: 'Mientras el agente prepara la respuesta se ve «Razonando…» junto al orbe. Los límites (sin permiso, error, sin créditos) están en el caso completo.',
    icon: Loading03Icon,
    route: '/design-system/agente-contextual/estados',
    config: { ...BASE, answer: false, typing: true, result: 'none' },
    sample: {
      ...SAMPLE,
      screen: 'El plan de inducción en borrador, con sus lecciones.',
      screenActions: ['Vista previa', 'Guardar plan'],
      contextName: 'Inducción para operarios de planta',
      contextDetail: 'lecciones',
      request: 'Arma un plan de inducción para los operarios nuevos.',
      answer:
        'Armé una propuesta con los cursos de seguridad que ya están en el catálogo: bienvenida y recorrido por la línea 3, seguridad en planta y una práctica corta con certificado.',
      details: {
        sources: [SRC.catalogo],
        followups: ['Agrega una evaluación final', '¿Cuánto dura en total?'],
        alternates: ['Con el catálogo de seguridad armé tres pasos: bienvenida en la línea 3, seguridad en planta y una práctica con certificado.'],
      },
      shortcuts: ['Ver los cursos de seguridad', 'Ajustar para el turno de noche'],
      chip: 'Inducción · Lecciones',
      placeholder: 'Pide un cambio sobre el plan',
    },
  },
]

// Nombres de las partes: los mismos en la vista previa (data-region) y en la lista de abajo.
export const PART = {
  screen: 'Pantalla de trabajo',
  screenActions: 'Botones de la pantalla',
  reopen: 'Orbit',
  panel: 'Panel · 452px',
  header: 'Cabecera',
  orb: 'Orbe',
  close: 'Cerrar',
  context: 'Contexto',
  request: 'Pedido',
  answer: 'Respuesta',
  sources: 'Fuentes',
  actions: 'Acciones del mensaje',
  followups: 'Seguimientos',
  field: 'Actual / Propuesta',
  fieldActions: 'Aplicar u otra versión',
  undo: 'Deshacer',
  card: 'Tarjeta de propuesta',
  plan: 'Plan de aprobación',
  metrics: 'Tarjeta de métricas',
  slot: 'Contenido de la respuesta',
  typing: 'Razonando…',
  shortcuts: 'Atajos',
  tray: 'Bandeja del chat',
  news: 'Novedad',
  chip: 'Pastilla de contexto',
  input: 'Caja de texto',
  attach: 'Menú «+»',
  voice: 'Voz',
  send: 'Enviar',
} as const

const TEXT: Record<string, string> = {
  [PART.screen]: 'La pantalla que el agente acompaña. No es parte del componente: sigue viva y se puede seguir usando.',
  [PART.screenActions]: 'Los botones propios de la pantalla. No son del agente, pero deciden cómo va «Orbit».',
  [PART.panel]: 'El panel pegado al borde derecho, debajo del header, que no se mueve ni se acorta. Corre la pantalla de trabajo, no la tapa.',
  [PART.header]: 'Franja de 58px con el orbe, el nombre «Orbit» y el botón de cerrar.',
  [PART.orb]: 'La marca del agente: la misma del chat de Orbit.',
  [PART.close]: 'Cierra el panel; Esc también, con el foco dentro. La conversación sigue: al volver a abrirlo está todo. En la pantalla queda «Orbit» para volver a abrirlo.',
  [PART.context]: 'Franja gris que dice qué está mirando el agente: el registro y, si aplica, la parte elegida.',
  [PART.request]: 'Lo que pidió la persona, en burbuja gris a la derecha. Al pasar el cursor se copia o se edita; al editarlo, el agente responde de nuevo desde ahí.',
  [PART.answer]: 'Lo que responde el agente, con el orbe al lado y sin burbuja. Es el mismo mensaje del chat de Orbit.',
  [PART.sources]: 'De dónde salió lo que dice. Al pasar el cursor por cada una se ve el detalle.',
  [PART.actions]: 'Copiar, útil, no útil, regenerar, leer en voz alta y más. «No útil» abre un comentario con motivos y «Regenerar» deja pasar entre versiones.',
  [PART.followups]: 'Preguntas sugeridas para seguir, solo bajo la última respuesta. Al tocar una se envía como pedido.',
  [PART.field]: 'Lo de hoy arriba y lo que propone el agente abajo, con el número de versión. Nada cambia hasta aplicarlo.',
  [PART.fieldActions]: 'Aplicar lleva el cambio a la pantalla; «Otra versión» trae la siguiente propuesta. Pruébalos en la vista previa.',
  [PART.undo]: 'Después de aplicar, esta fila dice dónde quedó el cambio y deja devolverlo.',
  [PART.card]: 'Propuesta que se edita ahí mismo: título, contenidos que se reordenan, audiencia y fechas. Asignar pide confirmación.',
  [PART.plan]: 'Los pasos del agente con su estado, a quién le llega, qué no se puede deshacer y la confirmación antes de publicar.',
  [PART.metrics]: 'Los números clave con su fuente y las acciones que salen de ellos. Enviar pide confirmación.',
  [PART.slot]: 'Lo que arma cada pantalla dentro del hilo: una tabla, un documento o una comparación. No es parte del componente.',
  [PART.typing]: '«Razonando…» con brillo y los segundos junto al orbe, mientras el agente prepara la respuesta. Al lado, «Detener» la corta.',
  [PART.shortcuts]: '«Sobre este contenido»: dos pedidos frecuentes para esta pantalla, para no empezar de cero.',
  [PART.tray]: 'La bandeja gris de abajo que envuelve la caja del chat, igual que en Orbit.',
  [PART.news]: 'Franja para contar algo nuevo del agente, con «Ver qué cambió» y su botón para cerrarla.',
  [PART.chip]: 'Sobre qué responde el agente. Con la «x» se quita y el agente responde sobre todo lo abierto.',
  [PART.input]: 'Donde se escribe el pedido. Enter envía y Shift+Enter hace un salto de línea.',
  [PART.attach]: 'Abre Conectores (Gmail, Slack y Google Drive) y Agregar archivos. Una pantalla puede poner aquí lo suyo: en una vacante, «Agregar hojas de vida».',
  [PART.voice]: 'Abre el modo voz de Orbit. Una pantalla puede usarlo para dictar el pedido en la caja, como la vacante.',
  [PART.send]: 'Manda el pedido. Se enciende cuando hay algo escrito.',
}

const REOPEN_TEXT: Record<AgentConfig['reopen'], string> = {
  full: 'Con el panel cerrado, la pastilla con el orbe lo vuelve a abrir. Va al final de la fila de acciones, a la derecha del botón primario de la pantalla. Si el agente tiene algo urgente que contar, trae un punto azul hasta abrirlo.',
  orb: 'Solo el orbe, porque la pantalla ya viene muy cargada (cabecera larga o botones con mucho texto). El nombre «Orbit» sale al pasar el cursor.',
}

// Nombre de la forma del resultado en la anatomía (la propuesta del editor y el slot tienen partes propias).
const RESULT_PART: Record<Exclude<AgentResult, 'none' | 'field' | 'slot'>, string> = {
  card: PART.card,
  plan: PART.plan,
  metrics: PART.metrics,
}

// Partes visibles con la configuración actual, de afuera hacia adentro y de arriba abajo. `applied`: la propuesta
// del editor ya se aplicó y se ve la fila para deshacer.
export function agentParts(c: AgentConfig, applied: boolean): PartInfo[] {
  const parts: PartInfo[] = []
  const add = (name: string, text?: string) => parts.push({ name, text: text ?? TEXT[name] })
  const slot = (name: string) => parts.push({ name, text: TEXT[name], slot: true })

  if (c.state === 'closed') {
    slot(PART.screen)
    slot(PART.screenActions)
    add(PART.reopen, REOPEN_TEXT[c.reopen])
    return parts
  }

  slot(PART.screen)
  add(PART.panel)
  add(PART.header)
  add(PART.orb)
  if (c.close) add(PART.close)
  if (c.context) add(PART.context)
  if (c.request) add(PART.request)
  if (c.answer) {
    add(PART.answer)
    if (c.result === 'field') {
      add(PART.field)
      add(PART.fieldActions)
      if (applied) add(PART.undo)
    }
    if (c.sources) add(PART.sources)
    if (c.actions) {
      add(PART.actions, c.typing ? `${TEXT[PART.actions]} Mientras llega otra respuesta, salen al pasar el cursor.` : undefined)
    }
    if (c.followups && !c.typing) add(PART.followups)
  }
  if (c.result === 'card' || c.result === 'plan' || c.result === 'metrics') add(RESULT_PART[c.result])
  if (c.result === 'slot') slot(PART.slot)
  if (c.typing) add(PART.typing)
  if (c.shortcuts) add(PART.shortcuts)
  add(PART.tray)
  if (c.news) add(PART.news)
  if (c.chip) add(PART.chip)
  add(PART.input)
  if (c.attach) add(PART.attach)
  if (c.voice) add(PART.voice)
  add(PART.send)
  return parts
}
