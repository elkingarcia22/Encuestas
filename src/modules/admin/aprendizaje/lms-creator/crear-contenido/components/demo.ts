// Contenido precreado para quien llega directo por una URL del asistente (#recursos, #certificado, #ajustes…) con el
// borrador vacío: así cualquier enlace de una HU abre la pantalla con algo que mirar. Es el mismo curso de ejemplo del
// prototipo de referencia: «Resolución efectiva de conflictos en equipos de trabajo».

import { CONTENIDOS } from '@/shared/bd'
import { BANCO_PREGUNTAS, type PreguntaBanco } from './banco-preguntas'
import { CONFIG_EVALUACION, borradorVacio, type Borrador, type Pregunta, type RoleplayConfig, type SesionAsistencia, type TipoPregunta, type Seccion } from './borrador'
import { preguntasDeSatisfaccion } from './encuestas'
import { aplanarPreguntas, type SeccionPreguntas } from './evaluacion/secciones'
import { POOL, type DatosDiapositiva, type DatosPresentacion } from './presentacion/datos'
import { VOZ_POR_DEFECTO, enlaceEmbebido } from './video/datos'

export const DEMO_TITULO = 'Resolución efectiva de conflictos en equipos de trabajo'
export const DEMO_PORTADA = '/images/cards-learn/portadas-ia/02-personas-en-oficina.jpg'
export const DEMO_DESCRIPCION = '<p>Aprende a gestionar conflictos de forma efectiva con técnicas comprobadas.</p>'
export const DEMO_VIDEO = '/videos/preview-video-generado.mp4'
export const DEMO_PDF = '/demo-assets/guia-mapa-conflicto.pdf'
export const DEMO_SCORM = '/demo-assets/simulador-scorm.html'

// ── Preguntas ────────────────────────────────────────────────────────────────────────────────────────────────────

const TIPO_BANCO: Record<PreguntaBanco['agentType'], TipoPregunta> = {
  multiple_choice_single_answer: 'multiple_choice_single',
  multiple_choice_multiple_answers: 'multiple_choice_multiple',
  binary: 'true_false',
  closed_text: 'short_answer',
  essay: 'essay',
  matching: 'matching',
}

let semilla = 0

export function preguntaVacia(tipo: TipoPregunta = 'multiple_choice_single'): Pregunta {
  semilla += 1
  return {
    id: `q-${Date.now().toString(36)}-${semilla}`,
    tipo,
    enunciado: '',
    instruccion: '',
    opciones: [
      { texto: '', correcta: false },
      { texto: '', correcta: false },
    ],
    verdaderoFalso: '',
    respuestaCorta: { respuesta: '', exactitud: 'exact' },
    ensayo: { minimoPalabras: '' },
    parejas: [
      { a: '', b: '' },
      { a: '', b: '' },
    ],
    palabraFaltante: { opciones: ['', ''] },
    escala: { minimo: '1', maximo: '5', etiquetaMinimo: '', etiquetaMaximo: '' },
  }
}

/** Convierte una pregunta del banco en una del editor (las marca como generadas con IA). */
export function desdeBanco(q: PreguntaBanco): Pregunta {
  const tipo = TIPO_BANCO[q.agentType] ?? 'multiple_choice_single'
  const p: Pregunta = { ...preguntaVacia(tipo), enunciado: q.stmt.trim(), generadaConIA: true }
  if (tipo === 'multiple_choice_single' || tipo === 'multiple_choice_multiple') {
    const correctas = Array.isArray(q.correct) ? q.correct : [q.correct]
    p.opciones = (q.opts ?? ['', '']).map((texto, i) => ({ texto, correcta: correctas.includes(i) }))
  }
  if (tipo === 'true_false') p.verdaderoFalso = q.correct === 0 ? 'true' : q.correct === 1 ? 'false' : ''
  if (tipo === 'short_answer') p.respuestaCorta = { respuesta: q.answer ?? '', exactitud: 'ignore_accents' }
  if (tipo === 'matching') p.parejas = q.pairs?.length ? q.pairs.map((par) => ({ ...par })) : p.parejas
  return p
}

const NIVEL = { B: 'basic', I: 'intermediate', A: 'advanced' } as const

/** «B-01» es la primera básica, «I-27» la 27.ª intermedia… (ids del banco del prototipo). */
/**
 * **La evaluación de la sección 2 viene con secciones**, para que la función se vea sin tener que armarla: es la
 * única de la demo que las trae. El reparto sigue el orden en que ocurre un conflicto —primero se detecta, después se
 * conversa—, y la segunda se abre en dos subsecciones para enseñar también ese nivel (Dave, 8-oct).
 */
function evaluacionConSecciones(): { secciones: SeccionPreguntas[]; preguntas: Pregunta[] } {
  const secciones: SeccionPreguntas[] = [
    {
      id: 'eval2-s1',
      title: 'Detectar el conflicto a tiempo',
      // Las secciones de ejemplo llevan descripción: sin ella no se veía para qué sirve el campo ni cómo queda la
      // portada de la parte en la vista del colaborador (Dave, 9-oct).
      description: 'Reconoce las señales tempranas antes de que el conflicto escale.',
      questions: preguntasDelBanco(['B-02', 'I-29']),
      children: [],
    },
    // Sin subsecciones (Dave, 9-oct): lo que antes colgaba de «Conducir la conversación» son ahora dos secciones
    // propias, que es como mejor se lee cuando solo hay un nivel.
    {
      id: 'eval2-s2',
      title: 'Elegir cómo responder',
      description: 'El estilo que conviene según lo que está en juego: cuándo ceder, cuándo sostener y cuándo buscar un punto medio.',
      questions: preguntasDelBanco(['B-30']),
      children: [],
    },
    {
      id: 'eval2-s3',
      title: 'Escuchar y retroalimentar',
      description: 'Entender a la otra parte y devolver algo que se pueda usar, sin que suene a reproche.',
      questions: preguntasDelBanco(['B-27', 'I-08']),
      children: [],
    },
  ]
  return { secciones, preguntas: aplanarPreguntas(secciones) }
}

export function preguntasDelBanco(ids: string[]) {
  return ids
    .map((id) => {
      const [letra, numero] = id.split('-')
      return BANCO_PREGUNTAS[NIVEL[letra as keyof typeof NIVEL]]?.[Number(numero) - 1]
    })
    .filter((q): q is PreguntaBanco => Boolean(q))
    .map(desdeBanco)
}

/** Las 80 del caso borde: básicas → intermedias → primeras avanzadas. */
export function ochentaPreguntas() {
  return [...BANCO_PREGUNTAS.basic, ...BANCO_PREGUNTAS.intermediate, ...BANCO_PREGUNTAS.advanced].slice(0, 80).map(desdeBanco)
}

// ── Presentación interactiva de ejemplo ──
//
// La página 2 es una presentación interactiva generada con IA (no un SCORM): se ve con el reproductor del playground,
// igual que una recién creada en «Agregar presentación interactiva». Es el deck de muestra «Conversaciones difíciles»
// (Thomas-Kilmann) en una selección corta que mezcla texto, visual y actividades.

const TIPOS_DEMO: DatosDiapositiva['type'][] = ['intro', 'agenda', 'main_point', 'steps', 'two_columns', 'quote', 'big_number', 'accordion', 'flashcards', 'quiz_mc', 'summary']

function presentacionDemo(): DatosPresentacion {
  const diapositivas = TIPOS_DEMO.map((tipo) => POOL.find((d) => d.type === tipo)).filter((d): d is DatosDiapositiva => Boolean(d))
  return {
    titulo: 'Conversaciones difíciles según Thomas-Kilmann',
    diapositivas: diapositivas.map((d, i) => ({ ...d, id: `demo-diapositiva-${i + 1}` })),
    acento: 'primary',
    logo: null,
    estilo: 'equilibrado',
  }
}


// ── Sección 3: lo que se responde al final ───────────────────────────────────────────────────────────────────────

/** El roleplay de ejemplo: la conversación difícil que el curso venía preparando. */
function roleplayDemo(): RoleplayConfig {
  return {
    titulo: 'Feedback a un colaborador',
    escenario:
      'Andrea lleva un mes entregando tarde y el equipo ya lo nota. Tienes la reunión de seguimiento: te toca señalar el problema con hechos, escuchar su versión y cerrar con un acuerdo concreto, sin romper la relación.',
    nombrePersonaje: 'Andrea Guzmán',
    identidadPersonaje: 'Integrante de tu equipo',
    voz: VOZ_POR_DEFECTO,
    imagen: '',
    personalidad:
      'Se pone a la defensiva cuando siente que la acusan y se cierra si no la escuchan. Si recibe hechos concretos y espacio para explicarse, colabora y propone salidas.',
    mensajeBienvenida: 'Hola, gracias por sacar el tiempo. ¿De qué querías que habláramos?',
    papelColaborador: 'Lideras el equipo y debes dar la retroalimentación sin que la conversación se rompa.',
    objetivos: [
      { id: 'rp-obj-1', texto: 'Plantear el tema con hechos, no con juicios' },
      { id: 'rp-obj-2', texto: 'Escuchar su versión sin interrumpir' },
      { id: 'rp-obj-3', texto: 'Cuidar el tono para que no se cierre' },
      { id: 'rp-obj-4', texto: 'Acordar un compromiso concreto con fecha' },
    ],
    modo: 'evaluacion',
    objetivosParaAprobar: 3,
    duracionMin: 5,
    intentos: 3,
    modoTexto: true,
  }
}

/** La encuesta libre de ejemplo: sobre el tema del curso, con los tipos que solo existen en una encuesta. */
function encuestaLibreDemo(): Pregunta[] {
  const escala: Pregunta = {
    ...preguntaVacia('rating_scale'),
    id: 'enc-1',
    enunciado: '¿Qué tan preparado te sientes para abordar un conflicto en tu equipo después de este contenido?',
    escala: { minimo: '1', maximo: '5', etiquetaMinimo: 'Nada preparado', etiquetaMaximo: 'Muy preparado' },
  }
  const cual: Pregunta = {
    ...preguntaVacia('multiple_choice_single'),
    id: 'enc-2',
    enunciado: '¿Cuál de las herramientas del curso crees que vas a usar primero?',
    opciones: [
      { texto: 'El mapa de conflicto', correcta: false },
      { texto: 'El modelo Thomas-Kilmann', correcta: false },
      { texto: 'La conversación de retroalimentación con hechos', correcta: false },
      { texto: 'Ninguna por ahora', correcta: false },
    ],
  }
  const cuando: Pregunta = {
    ...preguntaVacia('multiple_choice_multiple'),
    id: 'enc-3',
    enunciado: '¿En qué situaciones te gustaría practicar más? (Selecciona todas las que apliquen)',
    opciones: [
      { texto: 'Dar retroalimentación difícil', correcta: false },
      { texto: 'Atender a un cliente molesto', correcta: false },
      { texto: 'Negociar plazos con otra área', correcta: false },
      { texto: 'Mediar entre dos personas del equipo', correcta: false },
    ],
  }
  const abierta: Pregunta = {
    ...preguntaVacia('short_answer'),
    id: 'enc-4',
    enunciado: '¿Qué le falta a este contenido para serte más útil?',
  }
  return [escala, cual, cuando, abierta]
}

// ── Índice demo ──────────────────────────────────────────────────────────────────────────────────────────────────

export function seccionesDemo(): Seccion[] {
  return [
    { id: 'default', titulo: '', descripcion: '', paginas: [] },
    {
      id: 's1',
      titulo: 'Sección 1: Fundamentos',
      descripcion: '<p>Qué es un conflicto, cómo se reconoce a tiempo y qué estilo de respuesta conviene en cada caso.</p>',
      paginas: [
        { id: 'p1', titulo: 'Comunicación para desescalar un conflicto', recurso: { tipo: 'video', src: DEMO_VIDEO, generadoConIA: true, origenVideo: 'ia' } },
        {
          id: 'p2',
          titulo: 'Conversaciones difíciles según Thomas-Kilmann',
          recurso: { tipo: 'presentacion-interactiva', generadoConIA: true, presentacion: presentacionDemo() },
        },
        {
          id: 'p3',
          titulo: 'Evaluación Sección 1',
          // Con intentos y reloj a propósito: es la evaluación donde se mira cómo se ven las condiciones arriba y
          // cómo cambia el chip del intento cuando llega el último (Dave, 13-oct).
          recurso: {
            tipo: 'evaluacion-final',
            preguntas: preguntasDelBanco(['B-01', 'I-27', 'B-31', 'I-20', 'I-24']),
            config: { ...CONFIG_EVALUACION, limitarIntentos: true, intentos: 3, tiempoLimite: true, minutos: 5 },
          },
        },
      ],
    },
    {
      id: 's2',
      titulo: 'Sección 2: Herramientas para resolver conflictos',
      descripcion:
        '<p>Simulaciones, marcos de referencia y evaluación para aplicar lo aprendido en situaciones reales de conflicto en el trabajo.</p>',
      paginas: [
        { id: 'p4', titulo: 'Simulador de conversación difícil', recurso: { tipo: 'scorm', src: DEMO_SCORM } },
        { id: 'p5', titulo: 'Guía mapa de conflicto', recurso: { tipo: 'pdf', src: DEMO_PDF, archivo: 'guia-mapa-conflicto.pdf', permitirDescarga: true } },
        {
          id: 'p6',
          titulo: 'Evaluación Sección 2',
          recurso: { tipo: 'evaluacion-final', ...evaluacionConSecciones() },
        },
      ],
    },
    {
      // Lo que se responde al cerrar el curso: practicar la conversación, contar qué se llevó y calificar el contenido.
      // Están aquí para que quien entra por `#recursos` vea de una los tres recursos que más cuesta imaginarse sin
      // ejemplo: el roleplay, la encuesta libre y la de satisfacción (Dave, 7-oct).
      id: 's3',
      titulo: 'Sección 3: Practica y cuéntanos',
      descripcion: '<p>Pon a prueba lo aprendido en una conversación real y déjanos saber cómo te fue.</p>',
      paginas: [
        { id: 'p7', titulo: 'Roleplay: feedback a un colaborador', recurso: { tipo: 'roleplay', roleplay: roleplayDemo() } },
        { id: 'p8', titulo: '¿Cómo te fue con el curso?', recurso: { tipo: 'encuesta-libre', preguntas: encuestaLibreDemo() } },
        { id: 'p9', titulo: 'Encuesta de satisfacción', recurso: { tipo: 'encuesta-satisfaccion', preguntas: preguntasDeSatisfaccion() } },
      ],
    },
  ]
}

/**
 * El evento de ejemplo: **las asistencias lo vertebran**, que es de lo que trata un evento. Es el mismo contenido que
 * el playground React trae en `crear-evento` —«Protocolos de Supervivencia», f021—, copiado de su semilla: los mismos
 * cinco títulos, las mismas sesiones, las mismas instrucciones y el mismo video. Antes el ejemplo de Crear evento era
 * el de Crear contenido y no tenía ni una asistencia: quien entraba por `#recursos` no veía el recurso que da sentido
 * al tipo (Dave, 2-oct).
 *
 * Lo único que no se copió literal son las fechas: en React son de agosto y septiembre porque allá el contenido ya
 * está publicado, y aquí se está **creando** el evento, así que montar sesiones que ya pasaron no se entiende.
 */
function sesion(id: string, nombre: string, fecha: string, inicio: string, fin: string, descripcion = ''): SesionAsistencia {
  return { id, nombre, fecha, inicio, fin, descripcion }
}

/** Las instrucciones de las tres asistencias, con la misma plantilla que usa el playground React. */
function instruccionesAsistencia(actividad: string, siguiente: string) {
  return (
    `<p>Nos vemos en la <strong>Sala de Capacitación Norte</strong> (piso 2, Torre A) para ${actividad}. Esta actividad es ` +
    'promovida por el área de Recursos Humanos, con el acompañamiento del ingeniero <strong>Andrés Camilo Rueda</strong>, ' +
    'instructor del Cuerpo de Bomberos de la ciudad.</p>' +
    '<p>Llega puntual, con tu documento de identidad y ropa cómoda. Confirma tu asistencia dentro de la ventana de la ' +
    `sesión asignada; ${siguiente}</p>`
  )
}

/**
 * Las cinco preguntas de la evaluación del evento, copiadas del playground React (f021). No son del banco genérico:
 * preguntan por el contenido del video de sismos —qué hacer dentro de un edificio, el marco de la puerta, el coche,
 * el «triángulo de la vida» y el tsunami—. Con las del banco, la evaluación del ejemplo hablaba de otra cosa que el
 * resto del evento (Dave, 2-oct).
 *
 * En React cada pregunta lleva además el **minuto del video** donde está la respuesta, en un campo de instrucción
 * que aquí no existe: en este editor `instruccion` es el cuerpo del tipo de pregunta «Instrucción», no un campo de
 * todas. Guardarlo igual habría dejado un dato que ninguna pantalla enseña.
 */
function preguntasEventoDemo(): Pregunta[] {
  const fichas: { enunciado: string; opciones: string[]; correcta: number }[] = [
    {
      enunciado: '¿Qué es lo más recomendable hacer si te encuentras en el interior de un edificio al comenzar un sismo?',
      opciones: [
        'Correr inmediatamente hacia la salida más cercana.',
        'Ubicarse bajo una mesa robusta, agacharse, cubrirse y aferrarse.',
        'Correr hacia el marco de una puerta porque es la parte más fuerte.',
        'Utilizar el ascensor para evacuar rápidamente.',
      ],
      correcta: 1,
    },
    {
      enunciado: '¿Por qué se desaconseja buscar refugio en el marco de una puerta durante un sismo?',
      opciones: [
        'Porque los marcos de las puertas suelen ser la parte más débil de los edificios modernos.',
        'Porque impide que otras personas evacúen el edificio.',
        'Porque te deja expuesto a escombros y vidrios rotos que caen.',
        'Tanto A como C son correctas.',
      ],
      correcta: 3,
    },
    {
      enunciado: 'Si te encuentras conduciendo un vehículo durante un terremoto, ¿cuál es la acción correcta?',
      opciones: [
        'Salir del coche inmediatamente y correr a un espacio abierto.',
        'Detenerse en un lugar seguro (lejos de edificios y puentes) y permanecer dentro.',
        'Continuar conduciendo a alta velocidad para alejarse de la zona de peligro.',
        'Estacionarse debajo de un puente o paso elevado para protegerse de objetos caídos.',
      ],
      correcta: 1,
    },
    {
      enunciado: '¿Cuál es la recomendación principal respecto a la teoría del «Triángulo de la vida»?',
      opciones: [
        'Es la técnica más efectiva recomendada por organizaciones como la Cruz Roja.',
        'Se recomienda solo en edificios de madera antiguos.',
        'Es rechazada por expertos, ya que es impredecible y puede ser peligrosa.',
        'Es la mejor opción si no hay mesas o escritorios cerca.',
      ],
      correcta: 2,
    },
    {
      enunciado:
        'Si estás en una zona costera y el sismo ha cesado, ¿cuándo deberías alejarte hacia un terreno elevado o tierra adentro?',
      opciones: [
        'Solo cuando las autoridades emitan una alerta oficial por radio.',
        'Inmediatamente, para evitar la posible llegada de un tsunami.',
        'Después de esperar 30 minutos para ver si hay réplicas.',
        'Solo si ves que el mar retrocede de forma inusual.',
      ],
      correcta: 1,
    },
  ]

  return fichas.map((f) => ({
    ...preguntaVacia('multiple_choice_single'),
    enunciado: f.enunciado,
    opciones: f.opciones.map((texto, i) => ({ texto, correcta: i === f.correcta })),
  }))
}

export function seccionesEventoDemo(): Seccion[] {
  return [
    {
      id: 'default',
      titulo: '',
      descripcion: '',
      paginas: [
        {
          id: 'e1',
          titulo: 'Fundamentos — actividad práctica',
          recurso: {
            tipo: 'asistencia',
            asistencia: {
              instrucciones: instruccionesAsistencia(
                'la jornada presencial de <strong>fundamentos y actividad práctica</strong> ante sismos',
                'sin confirmación no podrás continuar con el video ni el resto del contenido.',
              ),
              autoasistencia: false,
              sesiones: [
                sesion('e1-s1', 'Jornada de fundamentos — turno mañana', '2026-10-13', '09:00', '11:00'),
                sesion('e1-s2', 'Jornada de fundamentos — turno tarde', '2026-10-13', '14:00', '16:00'),
                sesion('e1-s3', 'Jornada de fundamentos — refuerzo', '2026-10-20', '09:00', '11:00'),
                sesion('e1-s4', 'Jornada de fundamentos — sede norte', '2026-10-27', '09:00', '11:00'),
              ],
            },
          },
        },
        // Un video de YouTube pegado como enlace: ni se generó con IA ni se subió, y marcarlo como de IA era mentir
        // sobre el ejemplo. Es el mismo enlace que trae el evento en el playground React (Dave, 2-oct).
        {
          id: 'e2',
          titulo: 'Video de tips básicos',
          recurso: { tipo: 'video', src: enlaceEmbebido('https://youtu.be/MYDorLRRC_o'), origenVideo: 'enlace' },
        },
        {
          id: 'e3',
          titulo: 'Simulacro de evacuación',
          recurso: {
            tipo: 'asistencia',
            asistencia: {
              instrucciones: instruccionesAsistencia(
                'el <strong>simulacro de evacuación</strong> del edificio',
                'sin confirmación no podrás continuar con la evaluación.',
              ),
              autoasistencia: false,
              sesiones: [
                sesion('e3-s1', 'Simulacro Torre A — ensayo previo', '2026-10-15', '09:00', '11:00'),
                sesion('e3-s2', 'Simulacro Torre A', '2026-10-22', '14:00', '16:00'),
                sesion('e3-s3', 'Simulacro Torre B', '2026-10-29', '09:00', '11:00'),
                sesion('e3-s4', 'Simulacro torre completa', '2026-11-05', '09:00', '11:00'),
              ],
            },
          },
        },
        {
          id: 'e4',
          titulo: 'Evaluación',
          recurso: { tipo: 'evaluacion-final', preguntas: preguntasEventoDemo() },
        },
        {
          id: 'e5',
          titulo: 'Taller de primeros auxilios',
          recurso: {
            tipo: 'asistencia',
            asistencia: {
              instrucciones: instruccionesAsistencia(
                'el <strong>taller de primeros auxilios</strong> aplicado a emergencias sísmicas',
                'sin confirmación no podrás cerrar el contenido.',
              ),
              autoasistencia: false,
              sesiones: [
                sesion('e5-s1', 'Taller RCP — grupo piloto', '2026-10-16', '09:00', '12:00'),
                sesion('e5-s2', 'Taller RCP y heridas — grupo 1', '2026-10-23', '09:00', '12:00'),
                sesion('e5-s3', 'Taller RCP y heridas — grupo 2', '2026-10-30', '09:00', '12:00'),
                sesion('e5-s4', 'Taller RCP — instructores', '2026-11-06', '09:00', '12:00'),
              ],
            },
          },
        },
      ],
    },
  ]
}

export function borradorDemo(evento = false, variante: 'normal' | 'eval-80' = 'normal', paginaPedida?: string): Borrador {
  const base = borradorVacio(evento ? 'evento' : 'contenido')
  // Un evento trae su propio ejemplo: sin secciones y con las asistencias de por medio.
  if (evento && variante === 'normal') {
    const secciones = seccionesEventoDemo()
    const ids = secciones.flatMap((s) => s.paginas.map((p) => p.id))
    return {
      ...base,
      portada: {
        ...base.portada,
        titulo: 'Protocolos de supervivencia y seguridad ante sismos',
        imagen: '/images/cards-learn/U-Corporativa/protocolos-de-supervivencia-y-seguridad-ante-sismos.jpg',
        descripcion:
          '<p>Jornada presencial para actuar antes, durante y después de un sismo en el trabajo: protección personal, evacuación y primeros auxilios.</p>',
        categoria: 'cfq-003',
        tiempo: '8',
        unidad: 'h',
      },
      secciones,
      paginaActiva: paginaPedida && ids.includes(paginaPedida) ? paginaPedida : ids[0],
      pesos: { e4: 100 },
    }
  }

  const secciones: Seccion[] =
    variante === 'eval-80'
      ? [
          { id: 'default', titulo: '', descripcion: '', paginas: [] },
          {
            id: 's-eval-80',
            titulo: 'Sección 1: Caso borde',
            descripcion: '',
            paginas: [{ id: 'p-eval-80', titulo: 'Evaluación — 80 preguntas', recurso: { tipo: 'evaluacion-final', preguntas: ochentaPreguntas() } }],
          },
        ]
      : seccionesDemo()
  const ids = secciones.flatMap((s) => s.paginas.map((p) => p.id))
  return {
    ...base,
    portada: {
      ...base.portada,
      titulo: DEMO_TITULO,
      imagen: DEMO_PORTADA,
      descripcion: DEMO_DESCRIPCION,
      categoria: 'cfq-006',
    },
    seccionesHabilitadas: true,
    secciones,
    paginaActiva: paginaPedida && ids.includes(paginaPedida) ? paginaPedida : ids[0],
    pesos: variante === 'eval-80' ? { 'p-eval-80': 100 } : { p3: 50, p6: 50 },
  }
}

/**
 * La ruta de ejemplo, para poder entrar directo a `#contenidos`, `#certificado` o `#ajustes` y ver la pantalla con algo
 * dentro. Igual que el contenido de ejemplo: solo se siembra si el borrador está en blanco y no se pidió el paso 1.
 *
 * Los contenidos son reales del catálogo —publicados, que es lo que una ruta admite (HU-LMS-013 · RN-10)— y en un
 * orden que se lee como un recorrido: primero la inducción, después lo de fondo.
 */
export function rutaDemo(): Borrador {
  const base = borradorVacio('ruta')
  return {
    ...base,
    portada: {
      ...base.portada,
      titulo: 'Ruta de liderazgo para nuevos jefes',
      imagen: DEMO_PORTADA,
      descripcion: '<p>Un recorrido para quien acaba de asumir un equipo: lo primero que hay que saber, en orden.</p>',
      nivel: 'niv-001',
      idioma: 'es',
      categoria: 'cfq-006',
    },
    contenidos: ['f001', 'f021', 'f003'].filter((id) => CONTENIDOS.some((c) => c.id === id && ELEGIBLES_DEMO.has(c.visibilidad))),
  }
}

const ELEGIBLES_DEMO = new Set(['Publicado', 'Privado'])

/** ¿El borrador está en blanco? (sin título, sin portada y sin páginas): solo así se siembra el demo. */
export function estaVacio(b: Borrador) {
  return !b.portada.titulo.trim() && !b.portada.imagen && !b.secciones.some((s) => s.paginas.length)
}
