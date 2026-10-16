import type { RoleplayConfig } from '../borrador'
import { LIMITES, nuevoObjetivo } from './modelo'

// Evaluador roleplay (MLP): la IA propone el roleplay completo a partir de una idea y el creador lo refina. Es el
// mismo mock de playground-react (roleplayIaMock + roleplayIdeaPrompts): en producción lo resuelve el agente generador;
// aquí una plantilla por personaje más la idea del creador. Reglas de la integración de Selección (TAL-964): el
// resultado reemplaza los campos de contenido y el texto se recorta al tope en vez de rechazarse.

/** Cuánto tarda la «IA» en proponer. */
export const DURACION_GENERAR_MS = 3000

/** Tokens de volver a generar (la primera propuesta no cobra, como en playground-react). */
export const COSTO_REGENERAR = 120

export const IDEA_PERSONALIZADA = 'personalizada'

export const IDEAS_EJEMPLO = [
  {
    id: 'feedback',
    label: 'Feedback difícil',
    prompt:
      'Dar retroalimentación difícil a alguien del equipo sin romper la relación: señalar el problema con hechos, escuchar la reacción y cerrar con un acuerdo concreto.',
  },
  {
    id: 'cliente',
    label: 'Cliente molesto',
    prompt:
      'Atender a un cliente molesto por un incumplimiento: reconocer el problema sin excusas, explicar qué se va a hacer y comprometer una fecha realista.',
  },
  {
    id: 'direccion',
    label: 'Presentar a dirección',
    prompt:
      'Presentar avances ante la dirección en una reunión de ritmo ágil: responder preguntas puntuales de forma directa, sin divagar y sin dejar dudas abiertas.',
  },
  {
    id: 'negociacion',
    label: 'Negociar un plazo',
    prompt:
      'Negociar un cambio de plazo con una contraparte que presiona: explicar el motivo, proponer alternativas y sostener la posición sin romper el acuerdo.',
  },
  {
    id: 'venta',
    label: 'Objeción de venta',
    prompt: 'Responder una objeción de precio en una venta: entender la preocupación real, explicar el valor con ejemplos y proponer un siguiente paso.',
  },
]

/** Qué chip está aplicado según el texto de la idea. */
export const chipDeIdea = (idea: string) => IDEAS_EJEMPLO.find((i) => i.prompt === idea)?.id ?? IDEA_PERSONALIZADA

/** Corta en el último espacio para no partir una palabra. */
function recortar(texto: string, max: number) {
  const t = texto.trim()
  if (t.length <= max) return t
  const cortado = t.slice(0, max - 1)
  const espacio = cortado.lastIndexOf(' ')
  return `${(espacio > max * 0.6 ? cortado.slice(0, espacio) : cortado).trimEnd()}…`
}

/** La idea como primera oración del escenario: con mayúscula inicial y punto final. */
function ideaComoOracion(idea: string) {
  const limpia = idea.trim().replace(/\s+/g, ' ')
  if (!limpia) return 'Tienes una conversación difícil con alguien de tu equipo.'
  const conMayuscula = limpia.charAt(0).toUpperCase() + limpia.slice(1)
  return /[.!?]$/.test(conMayuscula) ? conMayuscula : `${conMayuscula}.`
}

// Cada personaje trae su contexto completo: cómo abre la llamada, qué papel cumple el colaborador y qué se le evalúa.
const PERSONAJES = [
  {
    nombre: 'Andrea Guzmán',
    identidad: 'Directora del área',
    voz: 'co-f-cercano',
    personalidad:
      'Es directa y práctica. Hace preguntas claras y espera respuestas en el mismo tono. No tiene paciencia para respuestas largas o poco concretas. Si algo no queda claro, vuelve a preguntar y pide precisión.',
    contexto:
      'La conversación es con la directora de tu área, que va al grano y tiene poco tiempo. Hace preguntas puntuales y espera respuestas breves; si algo queda vago, vuelve a preguntar.',
    mensajeBienvenida: 'Hola, tengo veinte minutos. Cuéntame cómo vamos y qué necesitas de mí.',
    papelColaborador: 'Debes explicar la situación con hechos, responder sus preguntas sin rodeos y salir con los siguientes pasos claros.',
    objetivos: [
      'Responder de forma directa a lo que pregunta',
      'Sostener lo que afirma con datos concretos',
      'Reconocer lo que no está resuelto sin justificarse',
      'Cerrar con próximos pasos y responsables',
    ],
  },
  {
    nombre: 'Daniel Restrepo',
    identidad: 'Cliente corporativo',
    voz: 'mx-m-cercano',
    personalidad:
      'Es exigente pero respetuoso. Presiona con preguntas de detalle y busca compromisos concretos. Reacciona mal a las respuestas evasivas y agradece que le hablen con franqueza.',
    contexto:
      'La conversación es con un cliente que llega molesto y con argumentos. Presiona por detalles y no se conforma con buenas intenciones: quiere saber qué va a pasar y cuándo.',
    mensajeBienvenida: 'Gracias por atenderme. Necesito entender qué pasó y qué van a hacer, porque así no podemos seguir.',
    papelColaborador: 'Representas a la empresa. Debes hacerte cargo de la situación sin excusas y dejarle un compromiso que puedas cumplir.',
    objetivos: [
      'Reconocer el problema sin poner excusas',
      'Explicar qué se va a hacer, en concreto',
      'Comprometer una fecha realista',
      'Cerrar verificando que quedó conforme',
    ],
  },
  {
    nombre: 'Camila Ortiz',
    identidad: 'Integrante de tu equipo',
    voz: 'cl-f-cercano',
    personalidad:
      'Es cercana y conversadora, pero se desanima con facilidad. Necesita que le hablen con claridad y empatía. Si percibe un tono duro, se cierra y responde con monosílabos.',
    contexto:
      'La conversación es con alguien de tu equipo que no espera esta charla. Si siente que la atacan se cierra; si la escuchan, colabora y propone salidas.',
    mensajeBienvenida: 'Hola, me dijeron que querías hablar conmigo. ¿Pasó algo?',
    papelColaborador: 'Lideras el equipo. Debes abordar el tema con franqueza, escuchar su versión y salir con un acuerdo, sin romper la relación.',
    objetivos: [
      'Plantear el tema con hechos, no con juicios',
      'Escuchar su versión sin interrumpir',
      'Cuidar el tono para que no se cierre',
      'Acordar un compromiso concreto con fecha',
    ],
  },
]

// El personaje sale de lo que dice la idea; «Volver a generar» rota desde ahí para proponer a alguien distinto.
const PISTAS = [
  /jefe|jefa|director|direcci[oó]n|gerente|comit[eé]|junta/i,
  /cliente|usuario|venta|vender|objeci[oó]n|proveedor|cuenta/i,
  /equipo|colaborador|reporta|retroalimenta|feedback|desempe[ñn]o/i,
]

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i += 1) h = (h << 5) - h + s.charCodeAt(i)
  return h
}

/** Propone el roleplay completo sobre `base`: reemplaza el contenido y deja la sesión (duración, intentos, modo texto). */
export function proponerRoleplay(idea: string, base: RoleplayConfig, modo: RoleplayConfig['modo'], intento = 0): RoleplayConfig {
  const sugerido = PISTAS.findIndex((re) => re.test(idea))
  const inicio = sugerido >= 0 ? sugerido : Math.abs(hash(idea)) % PERSONAJES.length
  const p = PERSONAJES[(inicio + intento) % PERSONAJES.length]
  const objetivos = p.objetivos.map((o) => nuevoObjetivo(recortar(o, LIMITES.objetivo)))
  return {
    ...base,
    titulo: recortar(`Conversación con ${p.nombre}`, LIMITES.titulo),
    escenario: recortar(`${ideaComoOracion(idea)} ${p.contexto}`, LIMITES.escenario),
    nombrePersonaje: p.nombre,
    identidadPersonaje: p.identidad,
    personalidad: recortar(p.personalidad, LIMITES.personalidad),
    mensajeBienvenida: recortar(p.mensajeBienvenida, LIMITES.mensajeBienvenida),
    papelColaborador: recortar(p.papelColaborador, LIMITES.papelColaborador),
    objetivos,
    voz: p.voz,
    modo,
    // Umbral por defecto: todos menos uno.
    objetivosParaAprobar: Math.max(1, objetivos.length - 1),
  }
}
