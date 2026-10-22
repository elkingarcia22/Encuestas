import { useMemo } from 'react'
import { COLABORADORES, CONTENIDOS, getResultadosContenido, type Contenido, type ResultadosColaborador, type ResultadosContenidoRecord, type ResultadosEvaluacionColaborador, type ResultadosEvaluacionDef } from '@/shared/bd'
import { enLista, generador } from '@/modules/design-system/patrones/formato'
import { BANCO_PREGUNTAS } from '../../crear-contenido/components/banco-preguntas'

// Lo que la pantalla de Resultados necesita saber de un contenido, en un solo sitio.
//
// La base compartida (`resultados-contenido.ts`) ya trae progreso, evaluaciones, bloqueos, descargas y asistencias.
// Aquí se le suman las dos cosas que no tiene —los intentos de roleplay y la lectura de la IA— y se derivan las cifras
// que encabezan cada pestaña, para que ninguna las calcule por su cuenta y digan todas lo mismo.

export type Lectura = 'positive' | 'warning' | 'negative'

/** Los cortes de siempre del playground: bien de 70 para arriba, regular hasta 40, mal por debajo. */
export const lecturaDe = (porcentaje: number): Lectura => (porcentaje >= 70 ? 'positive' : porcentaje >= 40 ? 'warning' : 'negative')

export const COLOR_LECTURA: Record<Lectura, string> = {
  positive: 'var(--success)',
  warning: 'var(--warning)',
  negative: 'var(--destructive)',
}

/** Las cantidades de la interfaz, con el separador de miles de la región. */
export const numero = (valor: number) => valor.toLocaleString('es-CO')

export const porcentaje = (valor: number) => `${Math.round(valor)}%`

/** «1 ene 2026», el formato de fecha de todo el playground. */
export const fecha = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })

/** La misma fecha con la hora, para lo que ocurre en un momento concreto (un intento, una confirmación). */
export const fechaHora = (iso: string) => {
  const momento = new Date(iso)
  if (Number.isNaN(momento.getTime())) return fecha(iso)
  return `${momento.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })} · ${momento.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
}

// ── Roleplay ─────────────────────────────────────────────────────────────────────────────────────────────────────

export type ObjetivoIntento = {
  titulo: string
  alcanzado: boolean
  positivos: readonly string[]
  mejoras: readonly string[]
}

export type MensajeIntento = { de: 'estudiante' | 'personaje'; texto: string; hora: string }

export type IntentoRoleplay = {
  id: string
  /** Quién lo hizo: el mismo nombre y correo que en Progreso. */
  nombre: string
  email: string
  /** Qué roleplay del contenido: un contenido puede tener varios. */
  roleplayId: string
  /** Número de intento de esa persona en ese roleplay. */
  intento: number
  fecha: string
  aprobado: boolean
  objetivos: readonly ObjetivoIntento[]
  conversacion: readonly MensajeIntento[]
}

export type Roleplay = { id: string; nombre: string; objetivos: number }

const ROLEPLAYS: readonly Roleplay[] = [{ id: 'rp-conversacion-dificil', nombre: 'Practica la conversación con tu equipo', objetivos: 4 }]

/**
 * Un contenido con **dos** roleplay, para ver cómo se elige entre ellos.
 *
 * Casi todos los contenidos tienen uno solo y ahí no hay nada que elegir; este es el caso de los que practican la
 * misma habilidad en dos situaciones distintas. Solo lo tiene «Creatividad e innovación» (`f009`), a propósito: así
 * queda un enlace para enseñar el selector sin cambiar el contenido de ejemplo (Dave, 14-oct).
 */
const ID_VARIOS_ROLEPLAY = 'f009'

const ROLEPLAYS_VARIOS: readonly Roleplay[] = [
  { id: 'rp-idea-al-equipo', nombre: 'Presenta una idea nueva a tu equipo', objetivos: 4 },
  { id: 'rp-idea-al-comite', nombre: 'Defiende la idea ante el comité', objetivos: 4 },
]

const roleplaysDe = (contenido: Contenido) => (contenido.id === ID_VARIOS_ROLEPLAY ? ROLEPLAYS_VARIOS : ROLEPLAYS)

const OBJETIVOS = [
  'Abrir la conversación sin culpar',
  'Escuchar la versión de la otra persona',
  'Proponer un acuerdo concreto',
  'Cerrar con un compromiso y una fecha',
] as const

const POSITIVOS: Record<string, readonly string[]> = {
  'Abrir la conversación sin culpar': ['Empezaste describiendo el hecho y no la intención de la otra persona.', 'Mantuviste un tono tranquilo desde la primera frase.'],
  'Escuchar la versión de la otra persona': ['Dejaste terminar sin interrumpir.', 'Repetiste con tus palabras lo que entendiste antes de responder.'],
  'Proponer un acuerdo concreto': ['Pusiste sobre la mesa una opción clara en vez de una queja.'],
  'Cerrar con un compromiso y una fecha': ['Dejaste por escrito quién hace qué.'],
}

const MEJORAS: Record<string, readonly string[]> = {
  'Abrir la conversación sin culpar': ['Evita empezar con «siempre» o «nunca»: la otra persona se defiende antes de oírte.'],
  'Escuchar la versión de la otra persona': ['Hiciste dos preguntas seguidas sin esperar respuesta; deja espacio entre una y otra.'],
  'Proponer un acuerdo concreto': ['La propuesta llegó muy sobre el final. Plantéala cuando todavía hay tiempo de ajustarla.', 'Falta decir qué pasa si el acuerdo no se cumple.'],
  'Cerrar con un compromiso y una fecha': ['Quedó el compromiso, pero no la fecha: sin fecha no hay seguimiento.'],
}

const CONVERSACION: readonly MensajeIntento[] = [
  { de: 'personaje', texto: 'Hola, me dijeron que querías hablar conmigo. ¿Pasa algo?', hora: '10:02' },
  { de: 'estudiante', texto: 'Sí, quería comentarte algo de las dos últimas entregas. Llegaron después de la fecha que habíamos acordado.', hora: '10:02' },
  { de: 'personaje', texto: 'Ya. La verdad es que vengo arrastrando el trabajo del cliente nuevo y no me ha dado la vida.', hora: '10:03' },
  { de: 'estudiante', texto: 'Entiendo. ¿Qué parte es la que más te está comiendo el tiempo?', hora: '10:03' },
  { de: 'personaje', texto: 'Las reuniones. Tengo tres al día y después no me queda bloque para producir.', hora: '10:04' },
  { de: 'estudiante', texto: 'Te propongo algo: dejamos dos mañanas sin reuniones y revisamos el viernes cómo te fue. ¿Te sirve?', hora: '10:05' },
  { de: 'personaje', texto: 'Me sirve. Lo intento esta semana y te cuento.', hora: '10:05' },
]

/** Un intento con tantos objetivos alcanzados como diga `logrados`, siempre los primeros. */
function intento(id: string, roleplayId: string, nombre: string, email: string, numeroIntento: number, dia: string, logrados: number): IntentoRoleplay {
  return {
    id,
    nombre,
    email,
    roleplayId,
    intento: numeroIntento,
    fecha: dia,
    aprobado: logrados >= 3,
    objetivos: OBJETIVOS.map((titulo, indice) => ({
      titulo,
      alcanzado: indice < logrados,
      positivos: indice < logrados ? (POSITIVOS[titulo] ?? []) : [],
      mejoras: indice < logrados ? [] : (MEJORAS[titulo] ?? []),
    })),
    conversacion: CONVERSACION,
  }
}

// ── Análisis con IA ──────────────────────────────────────────────────────────────────────────────────────────────

export type Confianza = 'alta' | 'media' | 'baja'

/**
 * Qué hacer con un hallazgo. **Es la parte que importa**: sin ella el análisis es una observación, y a esta pestaña
 * se viene a que te digan rápido qué tienes que hacer (Dave, 14-oct).
 *
 * Solo hay tres sitios a los que puede llevar, y los tres existen de verdad:
 *
 * - **Otra pestaña de Resultados**, cuando lo que toca es mirar (`pestana`).
 * - **El contenido en edición**, cuando lo que toca es cambiarlo (`editar`). Es el caso de una evaluación o un
 *   roleplay que no está funcionando: se arregla donde se escribió, no aquí.
 * - **Gestión de intentos**, que es una pestaña pero donde además se hace algo: desbloquear.
 *
 * Nada de acciones que solo sacan un aviso: si no se puede hacer todavía, no se ofrece.
 */
/** Los archivos que sabe preparar esta pantalla. Vive aquí porque lo usan el panel y las acciones del análisis. */
export type TipoReporte = 'progreso' | 'evaluaciones' | 'respuestas' | 'encuestas' | 'roleplay'

export type AccionHallazgo = {
  etiqueta: string
  /**
   * Abre este contenido en el asistente de creación, en el paso que dice el ancla (`#recursos`, los recursos).
   *
   * No lleva a **la página** concreta porque los resultados y el asistente no comparten los identificadores de
   * página: las evaluaciones de Resultados vienen de la base y las páginas del borrador, del editor. Enlazar la
   * página exacta pide primero esa correspondencia; hasta entonces, el paso correcto es mejor que un enlace que
   * falla en todo lo que no sea el curso de ejemplo.
   */
  editar?: string
  /** Lleva a esa pestaña de Resultados. */
  pestana?: PestanaId
  /** Lleva a otra pantalla del admin: un flujo que no es de Resultados, como crear un plan de formación. */
  ruta?: string
  /** Prepara y descarga ese reporte, sin abrir el panel ni volver a elegirlo. */
  descargar?: TipoReporte
}

export type Hallazgo = {
  id: string
  titulo: string
  /** Tres o cuatro palabras para la franja plegada, donde van todas seguidas separadas por «·». */
  resumen: string
  detalle: string
  confianza: Confianza
  /** Qué hacer con esto. */
  accion: AccionHallazgo
  /** La pestaña con los números que lo sostienen, cuando la acción lleva a otro sitio. */
  ir?: PestanaId
  tono: Lectura
}

export const CONFIANZA: Record<Confianza, { etiqueta: string; descripcion: string }> = {
  alta: { etiqueta: 'Confianza alta', descripcion: 'Se apoya en todas las personas inscritas.' },
  media: { etiqueta: 'Confianza media', descripcion: 'Se apoya en poco más de la mitad del grupo.' },
  baja: { etiqueta: 'Confianza baja', descripcion: 'Son pocos datos todavía: léelo como una señal, no como una conclusión.' },
}

// ── Cómo se lee una evaluación ───────────────────────────────────────────────────────────────────────────────────

export type EstadoEvaluacion = 'Aprobado' | 'Reprobado' | 'Pendiente'

export type LecturaEvaluacion = {
  estado: EstadoEvaluacion
  /** El porcentaje logrado, o `null` si no la ha presentado. */
  logrado: number | null
  /** «70 % · 4 de 5», o cadena vacía si no la ha presentado. */
  detalle: string
}

/**
 * Si alguien aprobó una evaluación y con cuánto. **Es la única forma de decidirlo en toda la pantalla.**
 *
 * Antes la tabla lo recalculaba contra el porcentaje de aprobación y el análisis con IA leía el estado que venía en
 * los datos, así que las dos daban cifras distintas del mismo dato a un clic de distancia: «3 reprobados» en una
 * pestaña y «5 reprobados» en la otra (13-oct). En una pantalla cuyo argumento es que puedes comprobar lo que te
 * dice, eso es lo más caro que puede pasar.
 */
export function leerEvaluacion(celda: ResultadosEvaluacionColaborador | undefined, evaluacion: ResultadosEvaluacionDef): LecturaEvaluacion {
  if (!celda || celda.estado === 'Pendiente' || celda.percent == null) return { estado: 'Pendiente', logrado: null, detalle: '' }
  const aprobada = evaluacion.porcentajeAprobar == null || celda.percent >= evaluacion.porcentajeAprobar
  return {
    estado: aprobada ? 'Aprobado' : 'Reprobado',
    logrado: celda.percent,
    detalle: celda.correctas != null && celda.total != null ? `${porcentaje(celda.percent)} · ${celda.correctas} de ${celda.total}` : porcentaje(celda.percent),
  }
}

// ── Satisfacción ─────────────────────────────────────────────────────────────────────────────────────────────────

export type Satisfaccion = {
  /** El promedio de 1 a 5 que dio la gente. */
  promedio: number
  /** Cuántas personas respondieron la encuesta. */
  respuestas: number
  /** Cuántas de cada nota, de 1 a 5. */
  reparto: readonly number[]
}

/**
 * Qué tan contenta quedó la gente con el contenido.
 *
 * Sale de la **encuesta de satisfacción**, que es un recurso que se añade al contenido como cualquier otro. Si el
 * contenido no la tiene, esta lectura no existe y su columna no se pinta: es la diferencia entre «nadie ha respondido
 * todavía» y «aquí no se preguntó nada» (Dave, 13-oct).
 */
function satisfaccionDe(contenidoId: string, datos: ResultadosContenidoRecord): Satisfaccion | null {
  if (!CON_ENCUESTA_SATISFACCION.has(contenidoId)) return null
  // Responden **todos** los que terminaron, no una parte: la encuesta es una página más del contenido y no se puede
  // finalizar sin pasar por ella. Si fueran menos, la cifra no cuadraría con la de finalización (Dave, 14-oct).
  const respuestas = datos.colaboradores.filter((persona) => persona.progresoPercent >= 100).length
  if (respuestas === 0) return { promedio: 0, respuestas: 0, reparto: [0, 0, 0, 0, 0] }
  // Un reparto cargado hacia el 4 y el 5, que es como salen casi todas las encuestas de satisfacción.
  const pesos = [0.03, 0.05, 0.12, 0.35, 0.45]
  const reparto = pesos.map((peso) => Math.round(respuestas * peso))
  const total = reparto.reduce((suma, cuantos) => suma + cuantos, 0)
  reparto[4] += respuestas - total
  const suma = reparto.reduce((acumulado, cuantos, indice) => acumulado + cuantos * (indice + 1), 0)
  return { promedio: suma / respuestas, respuestas, reparto }
}

/**
 * Cuántas personas gastaron 1, 2 o 3 o más intentos en una evaluación.
 *
 * Es la lectura que dice si una evaluación está bien calibrada: si casi todo el mundo la saca a la primera, sobra; si
 * la mayoría necesita tres, el problema es la evaluación o lo que la precede, no las personas (Dave, 14-oct).
 */
export function intentosPorPersona(datos: ResultadosContenidoRecord, evaluacion: ResultadosEvaluacionDef): { uno: number; dos: number; tresOMas: number; total: number } {
  let uno = 0
  let dos = 0
  let tresOMas = 0
  for (const persona of datos.colaboradores) {
    const lectura = leerEvaluacion(persona.evaluaciones[evaluacion.id], evaluacion)
    if (lectura.estado === 'Pendiente' || lectura.logrado == null) continue
    // Cuanto más lejos quedó del corte, más veces tuvo que volver: es lo que se ve en los datos reales.
    const corte = evaluacion.porcentajeAprobar ?? 60
    const distancia = corte - lectura.logrado
    if (distancia <= 0) uno += 1
    else if (distancia <= 20) dos += 1
    else tresOMas += 1
  }
  return { uno, dos, tresOMas, total: uno + dos + tresOMas }
}

// ── Lo que contestó cada persona ─────────────────────────────────────────────────────────────────────────────────

/**
 * Las preguntas y lo que marcó cada quien, tanto en una evaluación como en una encuesta.
 *
 * Es lo que pedía el PM para las dos pestañas: que el nombre de la tabla se abra y se vea la respuesta a cada
 * pregunta, igual que ya pasaba en Roleplay (Cristian Niño, 14-oct). Sin esto, una tabla de notas dice quién falló
 * pero no **en qué**, que es lo único que se puede arreglar.
 *
 * Se arma a partir de lo que sí hay en la base —cuántas acertó cada persona— y siempre sale igual para la misma
 * persona: lo que se vio ayer en pantalla tiene que seguir ahí hoy.
 */
export type Respuesta = {
  numero: number
  enunciado: string
  /** Lo que se podía elegir. Vacío en una pregunta abierta. */
  opciones: readonly string[]
  /** Cuáles eran las correctas. Vacío en una encuesta: ahí no hay respuesta buena. */
  correctas: readonly number[]
  /** Lo que marcó. Varias en una de selección múltiple. */
  elegidas: readonly number[]
  /** Lo que escribió, en una pregunta abierta. */
  texto?: string
  /** `null` cuando no se califica, que es todo lo de una encuesta. */
  acertada: boolean | null
}

const semillaDe = (texto: string) => {
  let valor = 7
  for (let indice = 0; indice < texto.length; indice += 1) valor = (valor * 31 + texto.charCodeAt(indice)) % 2_147_483_647
  return valor
}

// Solo las de opciones: una pregunta abierta o de emparejar no se puede enseñar como «marcó esta y era esa otra».
const CERRADAS = [...BANCO_PREGUNTAS.basic, ...BANCO_PREGUNTAS.intermediate, ...BANCO_PREGUNTAS.advanced].filter(
  (pregunta) => Array.isArray(pregunta.opts) && pregunta.opts.length > 0 && pregunta.correct != null,
)

/** Las preguntas de una evaluación: siempre las mismas para la misma evaluación, y distintas entre evaluaciones. */
function preguntasDe(evaluacion: ResultadosEvaluacionDef) {
  const inicio = semillaDe(evaluacion.id) % CERRADAS.length
  return Array.from({ length: evaluacion.totalPreguntas }, (_, indice) => CERRADAS[(inicio + indice) % CERRADAS.length])
}

/** Lo que contestó una persona en una evaluación. Vacío si no la ha presentado. */
export function respuestasDeEvaluacion(persona: ResultadosColaborador, evaluacion: ResultadosEvaluacionDef): Respuesta[] {
  const celda = persona.evaluaciones[evaluacion.id]
  const lectura = leerEvaluacion(celda, evaluacion)
  if (lectura.estado === 'Pendiente' || lectura.logrado == null) return []

  const preguntas = preguntasDe(evaluacion)
  const aciertos = celda?.correctas ?? Math.round((lectura.logrado / 100) * preguntas.length)
  // Cuáles falló se decide barajando: si fueran siempre las últimas, todo el mundo habría fallado las mismas y la
  // pestaña de la IA no podría decir cuál pregunta se atraganta de verdad.
  const azar = generador(semillaDe(`${persona.email}·${evaluacion.id}`))
  // Toda evaluación tiene **una pregunta que tumba**: la que está mal planteada o pregunta algo que el contenido no
  // explicó. Se le carga la mano para que exista, porque es justo lo que el análisis tiene que poder encontrar; no
  // siempre falla, pero es la primera que cae cuando alguien no lo saca todo.
  const dificil = semillaDe(`${evaluacion.id}·dura`) % preguntas.length
  const barajado = preguntas
    .map((_, indice) => ({ indice, orden: azar() + (indice === dificil ? 0.6 : 0) }))
    .sort((uno, otro) => uno.orden - otro.orden)
    .map((entrada) => entrada.indice)
  const falladas = new Set(barajado.slice(aciertos))

  return preguntas.map((pregunta, indice) => {
    const opciones = pregunta.opts ?? []
    const correctas = (Array.isArray(pregunta.correct) ? pregunta.correct : [pregunta.correct]).filter((uno): uno is number => typeof uno === 'number')
    const acertada = !falladas.has(indice)
    if (acertada) return { numero: indice + 1, enunciado: pregunta.stmt, opciones, correctas, elegidas: correctas, acertada: true }
    // Al fallar marcó otra cosa: la primera opción que no era correcta, contando desde un sitio distinto por persona.
    const posibles = opciones.map((_, posicion) => posicion).filter((posicion) => !correctas.includes(posicion))
    const elegida = posibles.length === 0 ? [] : [posibles[semillaDe(`${persona.email}${indice}`) % posibles.length]]
    return { numero: indice + 1, enunciado: pregunta.stmt, opciones, correctas, elegidas: elegida, acertada: false }
  })
}

// ── Las encuestas del contenido ──────────────────────────────────────────────────────────────────────────────────

/**
 * Una encuesta del contenido y sus preguntas.
 *
 * Son las mismas dos que existen en el Creator: la **de satisfacción**, que escribió UBITS y no se edita —por eso sus
 * respuestas se pueden comparar entre contenidos—, y la **libre**, que arma quien crea el contenido.
 *
 * Aquí no hay respuesta correcta, y eso cambia cómo se enseñan: ninguna opción se pinta de verde ni de rojo. Ponerle
 * color a una opinión la convierte en un examen.
 */
export type EncuestaDef = {
  id: string
  nombre: string
  tipo: 'satisfaccion' | 'libre'
  preguntas: readonly { enunciado: string; opciones: readonly string[]; multiple?: boolean; abierta?: boolean }[]
}

const ESCALA_UTIL = ['1 · Poco útil', '2', '3', '4', '5 · Muy útil']

const FACTORES_SATISFACCION = [
  'No, todo estuvo bien.',
  'Tuve problemas técnicos (audio, video o acceso).',
  'El contenido no es útil o es muy superficial.',
  'El contenido es demasiado complejo.',
  'El contenido está desactualizado.',
  'El formato no fue de mi agrado (pódcast, libro, artículo, etc.).',
  'El contenido está en otro idioma o no tiene subtítulos.',
  'Otro motivo.',
]

const ENCUESTA_SATISFACCION: EncuestaDef = {
  id: 'satisfaccion',
  nombre: 'Encuesta de satisfacción',
  tipo: 'satisfaccion',
  preguntas: [
    { enunciado: '¿Cómo calificarías el contenido que acabas de ver?', opciones: ESCALA_UTIL },
    {
      enunciado: 'Si tu experiencia con este contenido no fue satisfactoria, ¿cuáles fueron los principales factores que la afectaron?',
      opciones: FACTORES_SATISFACCION,
      multiple: true,
    },
  ],
}

/** La encuesta libre del curso de ejemplo, la única con recursos de verdad en el playground. */
const ENCUESTA_LIBRE: EncuestaDef = {
  id: 'libre',
  nombre: '¿Cómo te fue con el curso?',
  tipo: 'libre',
  preguntas: [
    { enunciado: '¿Qué tan preparado te sientes para abordar un conflicto en tu equipo después de este contenido?', opciones: ['1 · Nada preparado', '2', '3', '4', '5 · Muy preparado'] },
    {
      enunciado: '¿Cuál de las herramientas del curso crees que vas a usar primero?',
      opciones: ['El mapa de conflicto', 'El modelo Thomas-Kilmann', 'La conversación de retroalimentación con hechos', 'Ninguna por ahora'],
    },
    {
      enunciado: '¿En qué situaciones te gustaría practicar más?',
      opciones: ['Dar retroalimentación difícil', 'Atender a un cliente molesto', 'Negociar plazos con otra área', 'Mediar entre dos personas del equipo'],
      multiple: true,
    },
    { enunciado: '¿Qué le falta a este contenido para serte más útil?', opciones: [], abierta: true },
  ],
}

const CON_ENCUESTA_LIBRE = new Set(['f007'])

export function encuestasDe(contenido: Contenido, satisfaccion: Satisfaccion | null): EncuestaDef[] {
  if (!satisfaccion) return []
  return CON_ENCUESTA_LIBRE.has(contenido.id) ? [ENCUESTA_SATISFACCION, ENCUESTA_LIBRE] : [ENCUESTA_SATISFACCION]
}

const ABIERTAS = [
  'Más ejemplos de conversaciones reales, con lo que sí se dice y lo que no.',
  'Me habría servido una plantilla para preparar la conversación antes de tenerla.',
  'Está bien así; lo que cuesta es practicarlo con gente de verdad.',
  'Un poco más corto. El bloque del medio se hace largo.',
  'Casos de equipos remotos, que es donde más se me complica.',
]

/**
 * Qué nota puso cada persona en la encuesta de satisfacción.
 *
 * Se reparte **exactamente** el reparto que ya enseña la pantalla, así que la suma de las notas del panel y el
 * promedio de la cabecera no se pueden contradecir. Quien no terminó el contenido no llegó a la encuesta y no sale.
 */
export function notasDeSatisfaccion(datos: ResultadosContenidoRecord, satisfaccion: Satisfaccion | null): Map<string, number> {
  const notas = new Map<string, number>()
  if (!satisfaccion) return notas
  const bolsa: number[] = []
  satisfaccion.reparto.forEach((cuantos, indice) => {
    for (let vez = 0; vez < cuantos; vez += 1) bolsa.push(indice + 1)
  })
  const quienes = datos.colaboradores.filter((persona) => persona.progresoPercent >= 100)
  // De la nota más baja a la más alta y repartidas al revés por la lista, para que las bajas no caigan siempre en las
  // mismas personas de arriba de la tabla.
  quienes.forEach((persona, indice) => {
    const nota = bolsa[(indice * 3) % Math.max(1, bolsa.length)]
    if (nota != null) notas.set(persona.email, nota)
  })
  return notas
}

/** Lo que contestó una persona en una encuesta. */
export function respuestasDeEncuesta(persona: ResultadosColaborador, encuesta: EncuestaDef, nota: number): Respuesta[] {
  const azar = generador(semillaDe(`${persona.email}·${encuesta.id}`))

  return encuesta.preguntas.map((pregunta, indice) => {
    const base = { numero: indice + 1, enunciado: pregunta.enunciado, opciones: pregunta.opciones, correctas: [] as number[], acertada: null }

    if (pregunta.abierta) return { ...base, elegidas: [], texto: ABIERTAS[semillaDe(persona.email) % ABIERTAS.length] }

    // La primera pregunta de las dos encuestas es la escala, y es la que tiene que cuadrar con la nota de la persona.
    if (indice === 0) return { ...base, elegidas: [nota - 1] }

    if (pregunta.multiple) {
      // En satisfacción, quien quedó contento marca «todo estuvo bien» y ya; quien no, señala uno o dos motivos.
      if (encuesta.tipo === 'satisfaccion' && nota >= 4) return { ...base, elegidas: [0] }
      const cuantas = encuesta.tipo === 'satisfaccion' ? (nota <= 2 ? 2 : 1) : 1 + Math.floor(azar() * 2)
      const desde = encuesta.tipo === 'satisfaccion' ? 1 : 0
      const elegidas: number[] = []
      while (elegidas.length < cuantas) {
        const cual = desde + Math.floor(azar() * (pregunta.opciones.length - desde))
        if (!elegidas.includes(cual)) elegidas.push(cual)
      }
      return { ...base, elegidas: elegidas.sort((uno, otro) => uno - otro) }
    }

    return { ...base, elegidas: [Math.floor(azar() * pregunta.opciones.length)] }
  })
}

// ── Alcance ──────────────────────────────────────────────────────────────────────────────────────────────────────

export type Alcance = {
  /** Cuánta gente **podría** haberlo iniciado. */
  total: number
  /** Por qué le llega a esa gente: es lo que hace entendible el denominador. */
  motivo: string
  /** Cuántos de ellos lo iniciaron. */
  iniciaron: number
}

/**
 * A cuánta gente le llega el contenido, y cuántos de ellos lo han abierto.
 *
 * Es la lectura que de verdad dice si un contenido está funcionando: saber que lo empezaron 22 personas no significa
 * nada sin saber **cuántas podían**. Veintidós de veinticinco es un éxito; veintidós de toda la empresa, un problema
 * de difusión (Cristian Niño, 14-oct).
 *
 * El denominador depende de la visibilidad: un contenido privado solo le llega a quien se le asignó, y uno público, a
 * toda la empresa.
 */
function alcanceDe(contenido: Contenido, iniciaron: number): Alcance {
  const empresa = COLABORADORES.length
  if (contenido.visibilidad === 'Publicado') return { total: empresa, motivo: 'Visible para toda la empresa', iniciaron }
  // Privado, oculto o archivado: llega a quien lo tenga asignado. Se toma como asignados a quienes lo iniciaron más
  // los que todavía no, en la misma proporción con la que se reparte un plan de formación.
  const asignados = Math.min(empresa, Math.max(iniciaron, Math.round(iniciaron * 1.35)))
  return { total: asignados, motivo: `Asignado a ${asignados} personas`, iniciaron }
}

// ── El contenido visto desde Resultados ──────────────────────────────────────────────────────────────────────────

// «Descargas» no es una pestaña: es el botón de la cabecera, que abre el panel. En producción conviven la pestaña y el
// correo de «Solicitar», y entonces el mismo trabajo se hace en dos sitios y en ninguno se ve en qué quedó.
/**
 * El periodo que se está mirando, tal como lo deja el filtro de arriba.
 *
 * Se declara aquí, con su forma y no con su import, para que los datos no dependan de la pieza que los filtra: la
 * pantalla podría cambiar el filtro entero y esto seguiría valiendo.
 */
export type PeriodoVisto = {
  /** «Últimos 30 días» o «Del 1 al 14 de octubre»: lo que se escribe en los archivos que se descargan. */
  etiqueta: string
  /** Si de verdad recorta algo; con «Todo el histórico» no hay nada que advertir. */
  activo: boolean
  dentro: (iso?: string | null) => boolean
}

export type PestanaId = 'progreso' | 'evaluaciones' | 'intentos' | 'asistencias' | 'roleplay' | 'encuestas'

export type Resultados = {
  contenido: Contenido
  datos: ResultadosContenidoRecord
  /** Qué pestañas tiene este contenido. Una pestaña que el contenido puede tener se muestra aunque esté vacía. */
  pestanas: readonly PestanaId[]
  roleplays: readonly Roleplay[]
  intentos: readonly IntentoRoleplay[]
  hallazgos: readonly Hallazgo[]
  /**
   * Cuántas personas **han iniciado** el contenido.
   *
   * No se dice «inscritas»: a un contenido educativo nadie se inscribe, simplemente se entra y se empieza. El término
   * viene de los eventos y colarlo aquí promete una lista de apuntados que no existe (Cristian Niño, 14-oct).
   */
  iniciaron: number
  /** Cuántas terminaron el contenido entero. */
  completaron: number
  /** El porcentaje de finalización: completaron ÷ quienes lo iniciaron. */
  finalizacion: number
  /** A cuánta gente le llega el contenido y cuántos de ellos lo han abierto. */
  alcance: Alcance
  /** La satisfacción, o `null` si el contenido no tiene encuesta. */
  satisfaccion: Satisfaccion | null
  /** Desde cuándo se está mirando. Viaja con los datos para que lo que se descarga lo diga también. */
  periodo: PeriodoVisto
}

/**
 * Qué contenidos traen roleplay: los **cursos**, salvo los que vienen del LMS anterior.
 *
 * Lo heredado se migró tal cual y el roleplay no existía entonces, así que esos contenidos no lo tienen ni lo van a
 * tener hasta que alguien los rehaga. Los eventos tampoco: ahí lo que hay son sesiones (Dave, 13-oct).
 */
const conRoleplay = (contenido: Contenido) => contenido.tipo === 'Curso' && !contenido.antiguoLms
/** Las asistencias viven en los eventos. */
const CON_ASISTENCIA = new Set(['f021'])
/**
 * Quién lleva encuesta de satisfacción. La tienen todos **menos el evento**, a propósito: así queda un enlace para
 * enseñarle a desarrollo cómo se ve la pestaña cuando el contenido no preguntó nada (Dave, 13-oct).
 */
const SIN_ENCUESTA_SATISFACCION = new Set(['f021'])
const CON_ENCUESTA_SATISFACCION = { has: (id: string) => !SIN_ENCUESTA_SATISFACCION.has(id) }

function intentosDe(contenido: Contenido, datos: ResultadosContenidoRecord): IntentoRoleplay[] {
  if (!conRoleplay(contenido)) return []
  // Una fila por intento, no por persona: quien repitió sale dos veces, que es justo lo que se quiere comparar.
  const quienes = datos.colaboradores.slice(0, 6)
  const lista: IntentoRoleplay[] = []
  // Cada roleplay tiene sus propios intentos: elegir uno u otro cambia la tabla entera, que es para lo que sirve el
  // selector. Si todos compartieran intentos, cambiar de roleplay no se notaría.
  roleplaysDe(contenido).forEach((roleplay, orden) => {
    quienes.forEach((persona, indice) => {
      const logradosPrimero = [1, 4, 2, 3, 0, 4][(indice + orden) % 6] ?? 2
      lista.push(intento(`${roleplay.id}-${indice}-1`, roleplay.id, persona.nombre, persona.email, 1, `${persona.fechaInicio}T15:20:00`, logradosPrimero))
      // Quien no aprobó a la primera vuelve a intentarlo, y casi siempre mejora: es el valor de repetir.
      if (logradosPrimero < 3) lista.push(intento(`${roleplay.id}-${indice}-2`, roleplay.id, persona.nombre, persona.email, 2, `${persona.fechaInicio}T16:45:00`, Math.min(4, logradosPrimero + 2)))
    })
  })
  return lista
}

/**
 * Qué habría que hacer con este contenido, leído de sus propios números.
 *
 * El mapa de lo que se puede decir, y de lo que se ofrece hacer con cada cosa. Son trece situaciones y cada una tiene
 * **un** sitio al que ir: si no hay adónde, no se dice, porque un aviso sin salida solo preocupa (Dave, 14-oct).
 *
 * | Lo que se mira | Cuándo salta | Qué se ofrece |
 * | --- | --- | --- |
 * | Difusión | Lo abrió menos de la mitad de quien podía | Revisar la visibilidad, en la edición |
 * | Finalización | Por debajo del 70 % | Según si hay una evaluación detrás: revisarla o ver el recorrido |
 * | Evaluación más dura | Alguien la reprueba | Revisarla en la edición |
 * | Pregunta más fallada | La falla más de la mitad | Revisarla en la edición |
 * | Intentos por persona | Media de 2 o más | Revisar la evaluación en la edición |
 * | Bloqueos | Alguien se quedó sin intentos | Dar más intentos |
 * | Gente a medias | Alguien empezó y no terminó | Enviar un recordatorio |
 * | Satisfacción | Por debajo de 3,5, o con un motivo repetido | Ver las encuestas |
 * | Asistencia | Confirmó menos de la mitad | Cargar asistencias |
 * | Roleplay | Un objetivo se queda sin alcanzar | Ver los intentos |
 *
 * Y las dos buenas, que también cuentan: la finalización alta y la satisfacción alta. Una pantalla que solo dice lo
 * que está mal no se abre dos veces.
 */
/** La pantalla a la que lleva «Crear plan de contenidos»: el flujo de planes de formación, en su tipo por defecto. */
const RUTA_CREAR_PLAN = '/admin/aprendizaje/planes-de-formacion/planes/crear?tipo=contenidos'

/**
 * Qué habría que hacer con este contenido, leído de sus propios números.
 *
 * El mapa de lo que se puede decir, y de lo que se ofrece hacer con cada cosa. Cada situación tiene **un** sitio al
 * que ir: si no hay adónde, no se dice, porque un aviso sin salida solo preocupa (Dave, 14-oct).
 *
 * | Lo que se mira | Cuándo salta | Qué se ofrece |
 * | --- | --- | --- |
 * | Bloqueos | Alguien se quedó sin intentos | **Gestionar intentos** — y va primero: es lo único que deja a alguien parado |
 * | Evaluación | Se reprueba | Editar recurso, con **qué preguntas** se contestan mal |
 * | Difusión | Lo abrió menos de la mitad de quien podía | Crear plan de contenidos |
 * | Finalización | Por debajo del 70 %, sin evaluación detrás | Ver dónde se detienen |
 * | Intentos por persona | Media de 2 o más, y ninguna evaluación saltó ya | Editar recurso |
 * | Gente a medias | Alguien empezó y no terminó | Enviar recordatorio |
 * | Asistencia | Confirmó menos de la mitad (solo eventos) | Cargar asistencias |
 * | Roleplay | Un objetivo se queda sin alcanzar | Editar roleplay |
 * | Encuesta | Hay comentarios de mejora | Descargar el reporte de encuestas |
 *
 * Y la buena, que también cuenta: la finalización alta. Una pantalla que solo dice lo que está mal no se abre dos
 * veces.
 */
function hallazgosDe(
  datos: ResultadosContenidoRecord,
  finalizacion: number,
  intentos: readonly IntentoRoleplay[],
  alcance: Alcance,
  satisfaccion: Satisfaccion | null,
  contenido: Contenido,
  sinFiltrar: ResultadosContenidoRecord,
): Hallazgo[] {
  const lista: Hallazgo[] = []
  const iniciaron = datos.colaboradores.length
  if (iniciaron === 0) return lista

  // ── Quien no puede avanzar ────────────────────────────────────────────────────────────────────────────────────
  // **Va primero**: es el único hallazgo que deja a alguien parado esperando a que tú hagas algo. Todo lo demás es
  // mejorar el contenido; esto es desbloquear a una persona (Dave, 15-oct).
  if (datos.bloqueos.length > 0) {
    const una = datos.bloqueos.length === 1
    lista.push({
      id: 'bloqueos',
      resumen: `${numero(datos.bloqueos.length)} sin intentos`,
      titulo: `${numero(datos.bloqueos.length)} ${una ? 'persona se quedó' : 'personas se quedaron'} sin intentos`,
      // El cuerpo concuerda con el título: con una sola persona, hablar de «varias» deja el texto contradiciéndose.
      detalle: una
        ? 'No puede continuar hasta recibir un intento adicional.'
        : 'No pueden continuar hasta recibir un intento adicional. Si coinciden en la misma evaluación, revisa la evaluación antes que los casos individuales.',
      confianza: 'alta',
      accion: { etiqueta: 'Gestionar intentos', pestana: 'intentos' },
      tono: 'negative',
    })
  }

  // ── Asistencia, si es un evento ───────────────────────────────────────────────────────────────────────────────
  //
  // **Se lee sobre los datos sin filtrar, no sobre el periodo.** Quién asistió y quién no es un estado de hoy, no una
  // cifra del mes que se esté mirando: con el último mes puesto, las confirmaciones de agosto quedaban fuera y nueve
  // personas que sí fueron salían como si no hubieran ido nunca.
  //
  // Son **dos cosas distintas y nunca salen juntas**, que es lo que las separa de ser la misma dicha dos veces:
  // si no hay ninguna confirmación, lo que falta es cargarlas; si las hay y aun así alguien no aparece en ninguna
  // sesión, a esa persona le falta una sesión a la que ir.
  if (contenido.tipo === 'Evento') {
    const asistieron = new Set((sinFiltrar.asistencias ?? []).map((asistencia) => asistencia.username || asistencia.usuario))
    const totales = sinFiltrar.colaboradores.length

    if (asistieron.size === 0) {
      lista.push({
        id: 'asistencia',
        resumen: 'Asistencia sin registrar',
        titulo: 'La asistencia está sin confirmar',
        detalle: `Ninguna de las ${numero(totales)} personas que iniciaron el evento tiene su asistencia registrada. Si la sesión ya ocurrió, carga las asistencias antes de revisar otros indicadores.`,
        confianza: 'alta',
        accion: { etiqueta: 'Cargar asistencias', pestana: 'asistencias' },
        tono: 'negative',
      })
    } else {
      // Sin asistir a **ninguna** sesión y sin terminar el evento: para esas personas no queda nada a lo que entrar.
      const sinSesion = sinFiltrar.colaboradores.filter(
        (persona) => persona.progresoPercent < 100 && !asistieron.has(persona.email) && !asistieron.has(persona.nombre),
      ).length
      if (sinSesion > 0) {
        const una = sinSesion === 1
        lista.push({
          id: 'sin-sesion',
          resumen: `${numero(sinSesion)} sin sesión`,
          titulo: `${numero(sinSesion)} ${una ? 'persona no pudo asistir' : 'personas no pudieron asistir'} a ninguna sesión`,
          detalle: `${una ? 'No podrá completar' : 'No podrán completar'} el evento mientras no haya una sesión a la que entrar. Agrega otra al recurso de asistencia para ${una ? 'desbloquearla' : 'desbloquearlas'}.`,
          confianza: 'alta',
          accion: { etiqueta: 'Editar recurso', editar: '#recursos' },
          tono: 'negative',
        })
      }
    }
  }

  // ── La evaluación que se atraganta, y **qué preguntas** ───────────────────────────────────────────────────────
  // Un solo hallazgo, no dos. Antes salían «el avance se detiene en X» y «la pregunta 2 de X concentra los errores»
  // seguidos, y eran la misma cosa contada dos veces. Lo útil es el cruce: **dónde** se detiene y **qué preguntas**
  // se contestan mal, que es lo que se va a reescribir (Dave, 15-oct).
  const porEvaluacion = datos.evaluaciones.map((evaluacion) => {
    const lecturas = datos.colaboradores.map((persona) => leerEvaluacion(persona.evaluaciones[evaluacion.id], evaluacion)).filter((lectura) => lectura.estado !== 'Pendiente')
    return { evaluacion, intentadas: lecturas.length, fallidas: lecturas.filter((lectura) => lectura.estado === 'Reprobado').length }
  })
  const peor = [...porEvaluacion].sort((uno, otro) => otro.fallidas - uno.fallidas).at(0)
  const atasco = peor && peor.fallidas > 0 ? peor : null

  if (atasco) {
    const fallosPorPregunta = new Map<number, { fallos: number; total: number }>()
    for (const persona of datos.colaboradores) {
      for (const respuesta of respuestasDeEvaluacion(persona, atasco.evaluacion)) {
        const previo = fallosPorPregunta.get(respuesta.numero) ?? { fallos: 0, total: 0 }
        fallosPorPregunta.set(respuesta.numero, { fallos: previo.fallos + (respuesta.acertada ? 0 : 1), total: previo.total + 1 })
      }
    }
    // Las que falla más de la mitad, de peor a mejor y como mucho tres: con más, deja de ser una indicación y pasa a
    // ser otra tabla.
    const duras = [...fallosPorPregunta.entries()]
      .filter(([, cuenta]) => cuenta.total > 0 && cuenta.fallos / cuenta.total > 0.5)
      .sort((uno, otro) => otro[1].fallos - uno[1].fallos)
      .slice(0, 3)
      .map(([numeroPregunta]) => numeroPregunta)
      .sort((uno, otro) => uno - otro)

    lista.push({
      id: 'atasco',
      resumen: `Se traba «${atasco.evaluacion.nombre}»`,
      titulo: `El avance se detiene en «${atasco.evaluacion.nombre}»`,
      detalle:
        duras.length > 0
          ? `La mayoría contesta mal ${duras.length === 1 ? `la pregunta ${duras[0]}` : `las preguntas ${enLista(duras.map(String))}`}. Revisa su redacción o si el contenido cubre lo que ${duras.length === 1 ? 'evalúa' : 'evalúan'}.`
          : `${numero(atasco.fallidas)} de ${numero(atasco.intentadas)} personas que la presentaron no la aprueban. Revisa si el recurso anterior entrega lo necesario para responderla.`,
      confianza: atasco.intentadas >= 10 ? 'alta' : 'media',
      accion: { etiqueta: 'Editar recurso', editar: '#recursos' },
      tono: 'negative',
    })
  }

  // ── Difusión: a cuánta gente le llega y cuánta lo abre ────────────────────────────────────────────────────────
  const cobertura = alcance.total === 0 ? 100 : (alcance.iniciaron / alcance.total) * 100
  if (cobertura < 50) {
    lista.push({
      id: 'difusion',
      resumen: `Lo abre ${porcentaje(cobertura)} de quien puede`,
      titulo: 'El contenido llega a más personas de las que lo inician',
      detalle: `Está disponible para ${numero(alcance.total)} ${alcance.total === 1 ? 'persona' : 'personas'} y lo han iniciado ${numero(alcance.iniciaron)}. Considera añadirlo a un plan de formación para aumentar su cobertura.`,
      confianza: 'alta',
      // Dejarlo disponible no es difundirlo: lo que mueve la aguja es asignarlo en un plan (Dave, 15-oct).
      accion: { etiqueta: 'Crear plan de contenidos', ruta: RUTA_CREAR_PLAN },
      tono: 'warning',
    })
  }

  // ── Finalización ──────────────────────────────────────────────────────────────────────────────────────────────
  if (finalizacion >= 70) {
    lista.push({
      id: 'finalizacion',
      resumen: `Finalización ${porcentaje(finalizacion)}`,
      titulo: 'La tasa de finalización es alta',
      detalle: `El ${porcentaje(finalizacion)} de quienes lo iniciaron lo completaron. No hay un punto de abandono concentrado.`,
      confianza: iniciaron >= 10 ? 'alta' : 'media',
      accion: { etiqueta: 'Ver el recorrido', pestana: 'progreso' },
      tono: 'positive',
    })
  } else if (!atasco) {
    // Con una evaluación atascada ya está dicho dónde se cae: repetirlo aquí serían dos filas para lo mismo.
    lista.push({
      id: 'finalizacion',
      resumen: `Finalización ${porcentaje(finalizacion)}`,
      titulo: 'La mayoría no completa el contenido',
      detalle: `Solo el ${porcentaje(finalizacion)} lo completó, y ninguna evaluación concentra reprobados. Revisa en qué recurso se detiene el avance.`,
      confianza: iniciaron >= 10 ? 'alta' : 'media',
      accion: { etiqueta: 'Ver dónde se detienen', pestana: 'progreso' },
      tono: 'negative',
    })
  }

  // ── Cuántas vueltas le da la gente ────────────────────────────────────────────────────────────────────────────
  // Solo si no saltó ya lo de la evaluación: si no, serían dos formas de decir que esa evaluación cuesta.
  if (!atasco && datos.evaluaciones.length > 0) {
    const suma = datos.evaluaciones.reduce(
      (acumulado, evaluacion) => {
        const suyos = intentosPorPersona(datos, evaluacion)
        return { uno: acumulado.uno + suyos.uno, dos: acumulado.dos + suyos.dos, tresOMas: acumulado.tresOMas + suyos.tresOMas, total: acumulado.total + suyos.total }
      },
      { uno: 0, dos: 0, tresOMas: 0, total: 0 },
    )
    const media = suma.total === 0 ? 0 : (suma.uno + suma.dos * 2 + suma.tresOMas * 3) / suma.total
    if (media >= 2) {
      lista.push({
        id: 'intentos-media',
        resumen: 'Varios intentos por persona',
        titulo: 'La mayoría necesita más de un intento',
        detalle: `Se necesitan ${media.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} intentos en promedio. Revisa el nivel de exigencia de la evaluación o el recurso que la precede.`,
        confianza: suma.total >= 10 ? 'alta' : 'media',
        accion: { etiqueta: 'Editar recurso', editar: '#recursos' },
        tono: 'warning',
      })
    }
  }

  // ── Quien lo dejó sin terminar ────────────────────────────────────────────────────────────────────────────────
  // No es lo mismo que la finalización: aquella es el porcentaje, esta son **personas concretas** a las que se les
  // puede escribir hoy. Por eso tiene una acción y la otra no.
  const aMedias = datos.colaboradores.filter((persona) => persona.progresoPercent > 0 && persona.progresoPercent < 100).length
  if (aMedias > 0) {
    const una = aMedias === 1
    lista.push({
      id: 'a-medias',
      resumen: `${numero(aMedias)} sin finalizar`,
      titulo: `${numero(aMedias)} ${una ? 'persona tiene' : 'personas tienen'} el contenido sin finalizar`,
      detalle: `Lo ${una ? 'inició' : 'iniciaron'} y no ${una ? 'ha' : 'han'} vuelto a ingresar. Un recordatorio puede reactivar su avance.`,
      confianza: 'alta',
      accion: { etiqueta: 'Enviar recordatorio', pestana: 'progreso' },
      tono: 'warning',
    })
  }

  // ── Roleplay ──────────────────────────────────────────────────────────────────────────────────────────────────
  if (intentos.length > 0) {
    const objetivoFlojo = OBJETIVOS.map((titulo) => ({
      titulo,
      fallos: intentos.filter((uno) => uno.objetivos.some((objetivo) => objetivo.titulo === titulo && !objetivo.alcanzado)).length,
    })).sort((uno, otro) => otro.fallos - uno.fallos)[0]
    if (objetivoFlojo && objetivoFlojo.fallos > 0) {
      lista.push({
        id: 'roleplay',
        resumen: 'Un objetivo flojo en el roleplay',
        titulo: `«${objetivoFlojo.titulo}» es el objetivo menos alcanzado del roleplay`,
        detalle: `No se alcanza en ${numero(objetivoFlojo.fallos)} de ${numero(intentos.length)} intentos. Quienes repiten el roleplay suelen lograrlo en el segundo.`,
        confianza: intentos.length >= 8 ? 'media' : 'baja',
        // Lo que se arregla es el roleplay, no la tabla: se abre donde se escribió. Cuando exista su edición propia,
        // este enlace apunta ahí.
        accion: { etiqueta: 'Editar roleplay', editar: '#recursos' },
        tono: 'warning',
      })
    }
  }

  // ── Lo que escribieron en la encuesta ─────────────────────────────────────────────────────────────────────────
  // Una sola lectura, y lo que ofrece es **llevarse lo que dijeron**: lo valioso de una encuesta no es la media, son
  // los comentarios, y esos no caben en una fila (Dave, 15-oct).
  if (satisfaccion && satisfaccion.respuestas > 0) {
    const notas = notasDeSatisfaccion(datos, satisfaccion)
    let conComentario = 0
    for (const persona of datos.colaboradores) {
      const nota = notas.get(persona.email)
      if (nota == null) continue
      const segunda = respuestasDeEncuesta(persona, ENCUESTA_SATISFACCION, nota)[1]
      // «Todo estuvo bien» no es un comentario de mejora: solo cuentan los motivos de verdad y las notas bajas.
      const senalo = (segunda?.elegidas ?? []).some((indice) => indice !== 0)
      if (senalo || nota <= 3) conComentario += 1
    }
    if (conComentario > 0) {
      lista.push({
        id: 'encuesta-comentarios',
        resumen: 'Comentarios en la encuesta',
        titulo: 'Tienes comentarios de mejora en la encuesta de satisfacción',
        detalle: `${numero(conComentario)} ${conComentario === 1 ? 'persona señaló algo' : 'personas señalaron algo'} que mejorar. El reporte trae lo que contestaron, incluidas las preguntas abiertas.`,
        confianza: satisfaccion.respuestas >= 10 ? 'alta' : 'media',
        accion: { etiqueta: 'Descargar reporte', descargar: 'encuestas' },
        tono: 'warning',
      })
    }
  }

  // Lo urgente arriba, y dentro de cada tono se respeta el orden en que se añadieron: por eso los bloqueos, que van
  // los primeros de la lista, se quedan los primeros.
  const PESO: Record<Lectura, number> = { negative: 0, warning: 1, positive: 2 }
  return lista.sort((uno, otro) => PESO[uno.tono] - PESO[otro.tono])
}

/**
 * Todo lo que la pantalla sabe de un contenido. Devuelve `null` si el id no existe en el catálogo.
 *
 * `dentro` es el periodo elegido arriba. Se aplica **aquí y una sola vez**, sobre los datos crudos: si cada pestaña
 * filtrara lo suyo, bastaría que una se olvidara para que la misma pantalla diera dos cifras distintas de lo mismo.
 */
export function useResultados(id: string, periodo?: PeriodoVisto): Resultados | null {
  const dentro = periodo?.dentro
  return useMemo(() => {
    const contenido = CONTENIDOS.find((uno) => uno.id === id)
    if (!contenido) return null

    const crudo = getResultadosContenido(id)
    // Cada cosa entra por **su** fecha: una persona por el día que empezó, un bloqueo por el día que se bloqueó y una
    // asistencia por el día que se confirmó.
    const datos: ResultadosContenidoRecord = dentro
      ? {
          ...crudo,
          colaboradores: crudo.colaboradores.filter((persona) => dentro(persona.fechaInicio)),
          bloqueos: crudo.bloqueos.filter((bloqueo) => dentro(bloqueo.fechaBloqueo)),
          asistencias: crudo.asistencias?.filter((asistencia) => dentro(asistencia.confirmadoAt)),
        }
      : crudo
    // Los que están en la tabla son los que lo iniciaron: quien no lo ha abierto no tiene progreso que enseñar.
    const iniciaron = datos.colaboradores.length
    const completaron = datos.colaboradores.filter((persona) => persona.progresoPercent >= 100).length
    const finalizacion = iniciaron === 0 ? 0 : (completaron / iniciaron) * 100
    const intentos = intentosDe(contenido, datos)
    const satisfaccion = satisfaccionDe(id, datos)

    // **Lo que necesita tu atención se lee sobre TODO, no sobre el periodo.** El bloque vive encima del filtro de
    // fechas, así que no puede depender de él: un contenido con gente bloqueada la tiene bloqueada hoy, se esté
    // mirando el último mes o el último año, y esconder el aviso por haber elegido una semana sería lo peor que
    // podría hacer esta pantalla (Dave, 15-oct).
    const completaronTodo = crudo.colaboradores.filter((persona) => persona.progresoPercent >= 100).length
    const finalizacionTotal = crudo.colaboradores.length === 0 ? 0 : (completaronTodo / crudo.colaboradores.length) * 100
    const alcanceTotal = alcanceDe(contenido, crudo.colaboradores.length)
    // A cuánta gente le llega no depende de las fechas que se estén mirando: el denominador se calcula con todo y
    // solo se cambia el numerador. Si no, filtrar a un mes encogía también «de cuántos», y el porcentaje no se movía.
    const alcanceVisto: Alcance = { ...alcanceDe(contenido, crudo.colaboradores.length), iniciaron }

    // Se muestran las pestañas que este contenido **puede** tener, aunque estén vacías: una pestaña que aparece y
    // desaparece entre contenidos hace que nadie sepa dónde buscar. Vacía, explica qué falta para llenarla.
    // Las pestañas salen de los datos **crudos**: un periodo corto no puede hacer desaparecer la pestaña de
    // asistencias, porque entonces cambiar de fechas cambiaría el mapa de la pantalla.
    // El análisis dejó de ser una pestaña: ahora es la franja de «lo que necesita tu atención», encima del filtro de
    // fechas (Dave, 15-oct).
    //
    // **El orden sigue el recorrido del contenido** (Dave, 15-oct): primero cuánto se avanzó, después lo que se
    // practicó y al final lo que se midió. Por eso **Roleplay va antes que Evaluaciones**, y Gestión de intentos
    // pegada a Evaluaciones, que es de lo que habla.
    //
    // **En un evento, Asistencias sube justo detrás de Progreso**: la asistencia es de lo que trata un evento, no un
    // detalle al final. En un contenido que no es evento —si alguna vez trae asistencias— se queda donde estaba.
    const esEvento = contenido.tipo === 'Evento'
    const conAsistencias = CON_ASISTENCIA.has(id) || (crudo.asistencias?.length ?? 0) > 0

    const pestanas: PestanaId[] = ['progreso']
    if (conAsistencias && esEvento) pestanas.push('asistencias')
    if (conRoleplay(contenido)) pestanas.push('roleplay')
    if (crudo.evaluaciones.length > 0) pestanas.push('evaluaciones', 'intentos')
    if (conAsistencias && !esEvento) pestanas.push('asistencias')
    // Encuestas solo si el contenido pregunta algo: una pestaña vacía aquí no explica nada que no diga ya su ausencia.
    if (satisfaccion) pestanas.push('encuestas')

    return {
      contenido,
      datos,
      pestanas,
      roleplays: intentos.length > 0 ? roleplaysDe(contenido) : [],
      intentos,
      hallazgos: hallazgosDe(crudo, finalizacionTotal, intentosDe(contenido, crudo), alcanceTotal, satisfaccionDe(id, crudo), contenido, crudo),
      iniciaron,
      completaron,
      finalizacion,
      alcance: alcanceVisto,
      satisfaccion,
      periodo: periodo ?? { etiqueta: 'Todo el histórico', activo: false, dentro: () => true },
    }
  }, [id, periodo, dentro])
}
