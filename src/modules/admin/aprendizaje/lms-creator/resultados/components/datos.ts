import { useMemo } from 'react'
import { CONTENIDOS, getResultadosContenido, type Contenido, type ResultadosContenidoRecord, type ResultadosEvaluacionColaborador, type ResultadosEvaluacionDef } from '@/shared/bd'

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

export type Hallazgo = {
  id: string
  titulo: string
  detalle: string
  confianza: Confianza
  /** La pestaña que enseña la evidencia de este hallazgo. */
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

// ── El contenido visto desde Resultados ──────────────────────────────────────────────────────────────────────────

// «Descargas» no es una pestaña: es el botón de la cabecera, que abre el panel. En producción conviven la pestaña y el
// correo de «Solicitar», y entonces el mismo trabajo se hace en dos sitios y en ninguno se ve en qué quedó.
export type PestanaId = 'progreso' | 'evaluaciones' | 'intentos' | 'asistencias' | 'roleplay' | 'ia'

export type Resultados = {
  contenido: Contenido
  datos: ResultadosContenidoRecord
  /** Qué pestañas tiene este contenido. Una pestaña que el contenido puede tener se muestra aunque esté vacía. */
  pestanas: readonly PestanaId[]
  roleplays: readonly Roleplay[]
  intentos: readonly IntentoRoleplay[]
  hallazgos: readonly Hallazgo[]
  /** Cuántas personas están inscritas. */
  inscritos: number
  /** Cuántas terminaron el contenido entero. */
  completaron: number
  /** El porcentaje de finalización: completaron ÷ inscritos. */
  finalizacion: number
  /** La satisfacción, o `null` si el contenido no tiene encuesta. */
  satisfaccion: Satisfaccion | null
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

function hallazgosDe(datos: ResultadosContenidoRecord, finalizacion: number, intentos: readonly IntentoRoleplay[]): Hallazgo[] {
  const lista: Hallazgo[] = []
  const inscritos = datos.colaboradores.length

  lista.push({
    id: 'finalizacion',
    titulo: finalizacion >= 70 ? 'El contenido se está terminando' : 'La mayoría empieza y no termina',
    detalle:
      finalizacion >= 70
        ? `${porcentaje(finalizacion)} de quienes se inscribieron llegaron al final. No hay un punto donde la gente se caiga.`
        : `Solo ${porcentaje(finalizacion)} llegó al final. La caída se concentra después de la primera evaluación: quien la reprueba no vuelve a entrar.`,
    confianza: inscritos >= 10 ? 'alta' : 'media',
    ir: 'progreso',
    tono: lecturaDe(finalizacion),
  })

  // La evaluación que más gente reprueba: lo primero que hay que mirar cuando el contenido no funciona.
  const porEvaluacion = datos.evaluaciones.map((evaluacion) => {
    const lecturas = datos.colaboradores.map((persona) => leerEvaluacion(persona.evaluaciones[evaluacion.id], evaluacion)).filter((lectura) => lectura.estado !== 'Pendiente')
    return { evaluacion, intentadas: lecturas.length, fallidas: lecturas.filter((lectura) => lectura.estado === 'Reprobado').length }
  })
  const peor = [...porEvaluacion].sort((a, b) => b.fallidas - a.fallidas).at(0)
  if (peor && peor.fallidas > 0) {
    lista.push({
      id: 'evaluacion',
      titulo: `«${peor.evaluacion.nombre}» es donde más se traba la gente`,
      detalle: `${numero(peor.fallidas)} de ${numero(peor.intentadas)} personas que la presentaron no la aprobaron. Revisa si el recurso anterior alcanza para responderla.`,
      confianza: peor.intentadas >= 10 ? 'alta' : 'media',
      ir: 'evaluaciones',
      tono: 'negative',
    })
  }

  if (datos.bloqueos.length > 0) {
    const una = datos.bloqueos.length === 1
    lista.push({
      id: 'bloqueos',
      titulo: `${numero(datos.bloqueos.length)} ${una ? 'persona se quedó' : 'personas se quedaron'} sin intentos`,
      // El cuerpo concuerda con el título: con una sola persona, hablar de «varias» deja el texto contradiciéndose.
      detalle: una
        ? 'No puede avanzar hasta que le des un intento más.'
        : 'No pueden avanzar hasta que les des un intento más. Si son varias en la misma evaluación, suele ser la evaluación y no las personas.',
      confianza: 'alta',
      ir: 'intentos',
      tono: 'warning',
    })
  }

  if (intentos.length > 0) {
    const objetivoFlojo = OBJETIVOS.map((titulo) => ({
      titulo,
      fallos: intentos.filter((uno) => uno.objetivos.some((objetivo) => objetivo.titulo === titulo && !objetivo.alcanzado)).length,
    })).sort((a, b) => b.fallos - a.fallos)[0]
    if (objetivoFlojo && objetivoFlojo.fallos > 0) {
      lista.push({
        id: 'roleplay',
        titulo: `En el roleplay cuesta «${objetivoFlojo.titulo.toLowerCase()}»`,
        detalle: `Es el objetivo que más se queda sin alcanzar: ${numero(objetivoFlojo.fallos)} de ${numero(intentos.length)} intentos. Quien repite el roleplay suele lograrlo en el segundo.`,
        confianza: intentos.length >= 8 ? 'media' : 'baja',
        ir: 'roleplay',
        tono: 'warning',
      })
    }
  }

  return lista
}

/** Todo lo que la pantalla sabe de un contenido. Devuelve `null` si el id no existe en el catálogo. */
export function useResultados(id: string): Resultados | null {
  return useMemo(() => {
    const contenido = CONTENIDOS.find((uno) => uno.id === id)
    if (!contenido) return null

    const datos = getResultadosContenido(id)
    const inscritos = datos.colaboradores.length
    const completaron = datos.colaboradores.filter((persona) => persona.progresoPercent >= 100).length
    const finalizacion = inscritos === 0 ? 0 : (completaron / inscritos) * 100
    const intentos = intentosDe(contenido, datos)

    // Se muestran las pestañas que este contenido **puede** tener, aunque estén vacías: una pestaña que aparece y
    // desaparece entre contenidos hace que nadie sepa dónde buscar. Vacía, explica qué falta para llenarla.
    const pestanas: PestanaId[] = ['progreso']
    if (datos.evaluaciones.length > 0) pestanas.push('evaluaciones', 'intentos')
    if (CON_ASISTENCIA.has(id) || (datos.asistencias?.length ?? 0) > 0) pestanas.push('asistencias')
    if (conRoleplay(contenido)) pestanas.push('roleplay')
    pestanas.push('ia')

    return {
      contenido,
      datos,
      pestanas,
      roleplays: intentos.length > 0 ? roleplaysDe(contenido) : [],
      intentos,
      hallazgos: hallazgosDe(datos, finalizacion, intentos),
      inscritos,
      completaron,
      finalizacion,
      satisfaccion: satisfaccionDe(id, datos),
    }
  }, [id])
}
