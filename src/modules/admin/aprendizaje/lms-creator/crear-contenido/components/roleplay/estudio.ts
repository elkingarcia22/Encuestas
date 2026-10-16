import type { RoleplayConfig } from '../borrador'
import { objetivosConTexto } from './modelo'

// ── La llamada vista desde el colaborador ─────────────────────────────────────────────────────────────────────────
//
// El roleplay no se consume mirando: se hace hablando, cuesta créditos, tiene intentos contados y —en modo
// Evaluación— puede dejar al colaborador sin avanzar. Por eso la página tiene un **antes** (con quién se habla y si
// el micrófono sirve), un **durante** (la llamada) y un **después** (qué logró), y no un reproductor.
//
// Aquí vive lo que no es interfaz: en qué fase va, qué dice el personaje y cómo sale el veredicto. La conversación
// es un guion derivado de los objetivos —no hay agente de voz de verdad—, pero todo lo demás se comporta como el
// producto: los intentos se gastan, el umbral no se enseña y el resultado llega objetivo por objetivo.

export type FaseRoleplay = 'intro' | 'llamada' | 'evaluando' | 'resultado'

/** Por dónde transcurre la llamada. Lo decide la prueba de micrófono y **no cambia a mitad** (RN-17). */
export type CanalRoleplay = 'voz' | 'texto'

export type ObjetivoEvaluado = {
  texto: string
  alcanzado: boolean
  /** Qué hizo bien, en segunda persona. */
  fortalezas: string
  /** Qué le faltó, en segunda persona. */
  mejora: string
}

export type ResultadoRoleplay = {
  aprobado: boolean
  alcanzados: number
  objetivos: ObjetivoEvaluado[]
}

/** Lo que el colaborador lleva hecho en esta página: intentos gastados y el último veredicto. */
export type EstadoRoleplay = {
  intentosUsados: number
  resultado: ResultadoRoleplay | null
}

export const ESTADO_INICIAL: EstadoRoleplay = { intentosUsados: 0, resultado: null }

/** Segundos de la muestra de micrófono: lo justo para que dé tiempo a decir una frase. */
export const SEGUNDOS_PRUEBA = 4

/**
 * Cuántos objetivos alcanza este intento. Sube con cada reintento: el primero se queda corto, el segundo aprueba.
 * Es un prototipo, así que el veredicto se simula; lo que no se simula es la consecuencia —gastar intento, quedar
 * bloqueado— que es justo lo que hay que poder enseñar.
 */
function alcanzadosDe(total: number, intento: number): number {
  if (total <= 0) return 0
  if (intento <= 0) return Math.max(1, Math.ceil(total / 2) - 1)
  return Math.min(total, Math.ceil(total / 2) + intento)
}

/** Lo que se le dice de cada objetivo. Genérico pero en segunda persona, como pide la HU. */
const BIEN = [
  'Entraste al tema sin rodeos y con un ejemplo concreto.',
  'Mantuviste el tono tranquilo cuando la conversación se puso tensa.',
  'Escuchaste hasta el final antes de responder.',
  'Cerraste con un acuerdo claro y una fecha.',
  'Usaste datos para sostener lo que dijiste.',
]

const FALTO = [
  'Te faltó cerrar con un compromiso concreto: quedó en buenas intenciones.',
  'Llegaste al punto tarde; la otra persona ya había cambiado de tema.',
  'Te quedaste en la queja sin proponer qué hacer distinto.',
  'Interrumpiste un par de veces y perdiste lo que te estaban contando.',
  'Diste una respuesta general cuando te pedían un caso concreto.',
]

/** El veredicto del intento: qué objetivos alcanzó y si eso basta para aprobar. */
export function evaluarIntento(config: RoleplayConfig, intento: number): ResultadoRoleplay {
  const objetivos = objetivosConTexto(config)
  const alcanzados = alcanzadosDe(objetivos.length, intento)
  return {
    alcanzados,
    // En Práctica no hay aprobado ni reprobado: el intento siempre completa la página (RN-11).
    aprobado: config.modo === 'practica' || alcanzados >= config.objetivosParaAprobar,
    objetivos: objetivos.map((o, i) => ({
      texto: o.texto.trim(),
      alcanzado: i < alcanzados,
      fortalezas: BIEN[i % BIEN.length],
      mejora: FALTO[i % FALTO.length],
    })),
  }
}

/**
 * Lo que dice el personaje, turno a turno. Arranca siempre con el **mensaje de bienvenida** que escribió el creador
 * (RN-18) y sigue con preguntas derivadas de los objetivos: así la conversación se parece a lo que se evalúa.
 */
export function libretoDe(config: RoleplayConfig): string[] {
  const objetivos = objetivosConTexto(config)
  const bienvenida = config.mensajeBienvenida.trim() || 'Hola, gracias por sacar el tiempo. ¿Empezamos?'
  const seguimiento = objetivos.map((o) => `Cuéntame más sobre eso. ¿Cómo lo harías en este caso: ${o.texto.trim().toLowerCase()}?`)
  return [bienvenida, ...seguimiento, 'Entiendo. ¿Y con qué nos quedamos entonces?', 'Vale, lo dejamos ahí. Gracias por el tiempo.']
}

/** «3:05». El cronómetro de la llamada y lo que queda. */
export function reloj(segundos: number): string {
  const s = Math.max(0, Math.round(segundos))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
