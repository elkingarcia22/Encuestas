import { File01Icon, LibraryIcon, UserGroupIcon } from '@hugeicons/core-free-icons'
import type { ReplyDetails, ReplySource } from '@/modules/admin/suite-ai/shared/reply-details'

// Respuestas del agente contextual del editor, con el mismo formato que las del chat de Suite AI
// (texto + fuentes, sugerencias para seguir y otras versiones), pero sobre el contenido abierto.

export type FieldReply = {
  text: string
  // La respuesta trae una propuesta nueva para el campo Descripción (tarjeta «Actual / Propuesta»).
  proposal: boolean
}

// Versiones de la descripción que el agente propone (tarjeta «Propuesta 1/3»).
export const PROPOSALS = [
  'En seis lecciones cortas vas a reconocer los riesgos de tu área, aplicar el protocolo de seguridad y operar los equipos del turno sin supervisión. Al terminar recibes tu certificado de inducción.',
  'Seis lecciones de diez minutos para entrar a planta con criterio: qué puede fallar en tu línea, cómo se reporta y qué equipos puedes operar solo. Cierras con el certificado de inducción.',
  'Aprende, en seis lecciones, a identificar los riesgos de tu puesto, seguir el protocolo de seguridad y usar los equipos de tu turno. Al final validas todo con una práctica corta y tu certificado.',
]

// Pedido con el que abre el hilo.
export const FIRST_REQUEST = 'Mejora la descripción para que un operario entienda qué va a lograr.'

// Primera respuesta del hilo: acompaña la propuesta 1/3.
export const FIRST_PROPOSAL_REPLY =
  'Propuse un cambio en la descripción para que el operario sepa qué va a lograr en las seis lecciones. Nada se guarda hasta que lo apliques.'

// Atajos «Sobre este contenido» del panel.
export const FIELD_SHORTCUTS = ['Resumir en 3 puntos clave', 'Generar evaluación de 5 preguntas']

const SRC = {
  descripcion: { label: 'Descripción actual', detail: 'Campo del contenido · editado hace 3 min', icon: File01Icon },
  lecciones: { label: 'Lecciones del contenido', detail: '6 lecciones · 46 min y una práctica final', icon: LibraryIcon },
  audiencia: { label: 'Audiencias activas', detail: 'Operarios de planta y turno tarde · 174 personas', icon: UserGroupIcon },
} satisfies Record<string, ReplySource>

// Pedidos que piden reescribir el campo: la respuesta llega con una propuesta nueva.
const REWRITE_HINTS = [
  'mejora',
  'corta',
  'breve',
  'larga',
  'tono',
  'cercan',
  'direct',
  'formal',
  'clara',
  'simple',
  'reescrib',
  'redact',
  'cambia',
  'ajusta',
  'versión',
  'version',
  'certificado',
  'menciona',
  'descripción',
  'descripcion',
]

export function fieldReplyFor(prompt: string, contentName: string): FieldReply {
  const t = prompt.toLowerCase()

  if (t.includes('práctica') || t.includes('practica') || t.includes('opción múltiple')) {
    return {
      text: 'Listo: las preguntas quedan como borrador de la práctica final, en opción múltiple. No cambié las lecciones todavía; las agrego cuando me confirmes.',
      proposal: false,
    }
  }
  if (t.includes('evaluación') || t.includes('evaluacion') || t.includes('preguntas')) {
    return {
      text: 'Te propongo 5 preguntas para cerrar el contenido: ¿Qué haces si un equipo suena distinto al arrancar? ¿Cuándo se reporta un incidente menor? ¿Qué EPP exige la línea 3? ¿Quién autoriza operar sin supervisión? ¿Dónde queda el registro del turno?',
      proposal: false,
    }
  }
  if (t.includes('resum') || t.includes('puntos')) {
    return {
      text: `«${contentName}» en tres puntos: reconocer los riesgos de tu línea antes de operar, aplicar el protocolo de seguridad y reportar incidentes, y operar los equipos del turno sin supervisión.`,
      proposal: false,
    }
  }
  if (t.includes('lección') || t.includes('leccion')) {
    return {
      text: 'El contenido tiene 6 lecciones: 3 videos, 2 lecturas y una práctica final, unos 46 minutos en total. La más larga es «Protocolo de seguridad», con 12 minutos.',
      proposal: false,
    }
  }
  if (REWRITE_HINTS.some((hint) => t.includes(hint))) {
    return {
      text: 'Preparé otra versión de la descripción con ese ajuste. Revísala aquí abajo y aplícala al campo cuando quieras; nada se guarda hasta entonces.',
      proposal: true,
    }
  }
  return {
    text: `Puedo ayudarte con la descripción de «${contentName}»: hacerla más corta, cambiarle el tono o destacar el certificado. Dime qué prefieres y preparo una versión para aplicar al campo.`,
    proposal: false,
  }
}

const GENERIC: ReplyDetails = {
  sources: [SRC.descripcion],
  followups: ['Hazla más corta', 'Usa un tono más cercano'],
  alternates: [
    'Sobre este campo puedo proponerte otra redacción, resumir el contenido o armar preguntas de evaluación. ¿Por cuál empezamos?',
  ],
}

// Fuentes, sugerencias y versiones de una respuesta del agente contextual según su texto.
export function fieldDetailsFor(text: string): ReplyDetails {
  const t = text.toLowerCase()

  if (t.includes('borrador de la práctica')) {
    return {
      sources: [SRC.lecciones],
      followups: [],
      alternates: ['Las preguntas quedaron listas para la práctica final. Antes de sumarlas a las lecciones te pido confirmación.'],
    }
  }
  if (t.includes('5 preguntas')) {
    return {
      sources: [SRC.lecciones, SRC.descripcion],
      followups: ['Agrégalas como práctica final', 'Hazlas de opción múltiple'],
      alternates: [
        'Cinco preguntas para validar el contenido: qué hacer si un equipo falla al arrancar, cuándo reportar un incidente menor, qué EPP pide la línea 3, quién autoriza operar solo y dónde se registra el turno.',
      ],
    }
  }
  if (t.includes('tres puntos')) {
    return {
      sources: [SRC.lecciones, SRC.descripcion],
      followups: ['Genera una evaluación de 5 preguntas', 'Úsalo como descripción'],
      alternates: [
        'En tres puntos, el contenido enseña a identificar los riesgos del puesto, seguir el protocolo de seguridad y usar los equipos del turno sin ayuda.',
      ],
    }
  }
  if (t.includes('6 lecciones')) {
    return {
      sources: [SRC.lecciones],
      followups: ['Resume el contenido en 3 puntos'],
      alternates: [
        'Son 6 lecciones que suman unos 46 minutos, más una práctica final con evidencia. Tres son video, dos lectura; la de protocolo de seguridad es la más larga.',
      ],
    }
  }
  if (t.includes('nada se guarda')) {
    return {
      sources: [SRC.descripcion, SRC.lecciones, SRC.audiencia],
      followups: ['Hazla más corta', 'Usa un tono más cercano', 'Menciona el certificado al inicio'],
      alternates: [
        'Reescribí la descripción desde lo que el operario va a poder hacer al terminar. Revisa la propuesta; nada cambia en el campo hasta que la apliques.',
        'La propuesta dice qué logra el operario, en cuánto tiempo y con qué cierra. Puedes aplicarla tal cual o pedirme otro ajuste.',
      ],
    }
  }
  return GENERIC
}
