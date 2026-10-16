// Reglas del editor de evaluación: los nueve tipos de pregunta, las ayudas que acompañan a cada uno y el armado de
// preguntas con IA a partir del banco de ejemplo (por dificultad, tipos y cantidad), como en el prototipo de referencia.

import type { IconSvgElement } from '@hugeicons/react'
import {
  AngryIcon,
  ArrowDown01Icon,
  ArrowLeftRightIcon,
  DashboardSpeed01Icon,
  CheckmarkSquare02Icon,
  Comment01Icon,
  KeyboardIcon,
  LaughingIcon,
  NeutralIcon,
  RadioButtonIcon,
  Sad01Icon,
  SmileIcon,
  StarHalfIcon,
  TextAlignLeftIcon,
  TextUnderlineIcon,
  ToggleOnIcon,
} from '@hugeicons/core-free-icons'
import { BANCO_PREGUNTAS, type PreguntaBanco, type TipoBanco } from '../banco-preguntas'
import { textoPlano, type Pregunta, type TipoPregunta } from '../borrador'
import { desdeBanco } from '../demo'

// ── Tipos de pregunta ────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Los tipos de pregunta, con el mismo nombre y el mismo orden que el Creator de producción.
 *
 * **Una evaluación y una encuesta no ofrecen lo mismo** (comprobado en el Creator real, 7-oct): la evaluación tiene
 * ocho tipos; la encuesta, esos ocho más **escala numérica** y **escala de calificación** (estrellas), que no tienen
 * respuesta correcta y por eso no caben en una evaluación. Y el mismo tipo cambia de nombre y de campos según dónde
 * esté: en evaluación es «Pregunta corta» y pide la respuesta correcta; en encuesta es «Texto abierto» y solo pregunta.
 */
export const TIPOS: {
  valor: TipoPregunta
  etiqueta: string
  /** El nombre que lleva en una encuesta, cuando cambia. */
  etiquetaEncuesta?: string
  icono: IconSvgElement
  /** No se ofrece en una evaluación: no hay respuesta correcta que calificar. */
  soloEncuesta?: boolean
}[] = [
  { valor: 'multiple_choice_multiple', etiqueta: 'Opción múltiple, múltiple respuesta', icono: CheckmarkSquare02Icon },
  { valor: 'multiple_choice_single', etiqueta: 'Opción múltiple, única respuesta', icono: RadioButtonIcon },
  { valor: 'true_false', etiqueta: 'Verdadero / Falso', icono: ToggleOnIcon },
  { valor: 'instruction', etiqueta: 'Instrucción', icono: TextAlignLeftIcon },
  { valor: 'short_answer', etiqueta: 'Pregunta corta', etiquetaEncuesta: 'Texto abierto', icono: KeyboardIcon },
  { valor: 'essay', etiqueta: 'Ensayo', icono: Comment01Icon },
  { valor: 'matching', etiqueta: 'Emparejamiento', icono: ArrowLeftRightIcon },
  { valor: 'fill_blank', etiqueta: 'Palabra faltante', icono: TextUnderlineIcon },
  { valor: 'rating_scale', etiqueta: 'Escala numérica', icono: ArrowLeftRightIcon, soloEncuesta: true },
  { valor: 'rating_stars', etiqueta: 'Escala de calificación', icono: StarHalfIcon, soloEncuesta: true },
  /* Los cuatro de abajo son los que ya usa el creador de encuestas de Desempeño y cultura. Se traen tal cual —mismos
     nombres y mismos pasos— para que una escala de acuerdo signifique lo mismo en los dos sitios y sus respuestas se
     puedan comparar (Dave, 8-oct). En una evaluación no caben: ninguna tiene respuesta correcta. */
  { valor: 'nps', etiqueta: 'Recomendabilidad (NPS)', icono: DashboardSpeed01Icon, soloEncuesta: true },
  { valor: 'emoji', etiqueta: 'Escala de emociones', icono: SmileIcon, soloEncuesta: true },
  { valor: 'dropdown', etiqueta: 'Lista desplegable', icono: ArrowDown01Icon, soloEncuesta: true },
]

/**
 * Las cinco caras, de peor a mejor, con el tono que toma cada una al elegirse: del rojo del enfado al verde de la
 * risa. Son iconos de Hugeicons, no emojis del sistema —un emoji se dibuja distinto en cada equipo y no hereda el
 * color— y el texto es el que oye un lector de pantalla. Las mismas cinco y el mismo reparto que en el creador de
 * encuestas de Desempeño y cultura, para que una cara signifique lo mismo en los dos sitios (Dave, 9-oct).
 */
export const CARAS: { icono: IconSvgElement; etiqueta: string; tono: string }[] = [
  { icono: AngryIcon, etiqueta: 'Muy mal', tono: 'data-pressed:border-destructive! data-pressed:bg-destructive/10! data-pressed:text-destructive!' },
  { icono: Sad01Icon, etiqueta: 'Mal', tono: 'data-pressed:border-warning! data-pressed:bg-warning/10! data-pressed:text-warning!' },
  { icono: NeutralIcon, etiqueta: 'Normal', tono: 'data-pressed:border-border! data-pressed:bg-muted! data-pressed:text-foreground!' },
  { icono: SmileIcon, etiqueta: 'Bien', tono: 'data-pressed:border-info! data-pressed:bg-info/10! data-pressed:text-info!' },
  { icono: LaughingIcon, etiqueta: 'Muy bien', tono: 'data-pressed:border-success! data-pressed:bg-success/10! data-pressed:text-success!' },
]

/** De 0 a 10, como manda el NPS. */
export const NPS_MINIMO = 0
export const NPS_MAXIMO = 10

/** Los que se ofrecen en cada sitio, con el nombre que les toca. */
export function tiposDe(encuesta: boolean) {
  return TIPOS.filter((t) => encuesta || !t.soloEncuesta).map((t) => ({
    ...t,
    etiqueta: encuesta && t.etiquetaEncuesta ? t.etiquetaEncuesta : t.etiqueta,
  }))
}

export const tipoDe = (valor: TipoPregunta) => TIPOS.find((t) => t.valor === valor) ?? TIPOS[0]

/** Cómo se llama ese tipo donde está: «Pregunta corta» en una evaluación, «Texto abierto» en una encuesta. */
export function etiquetaDe(valor: TipoPregunta, encuesta = false) {
  const t = tipoDe(valor)
  return encuesta && t.etiquetaEncuesta ? t.etiquetaEncuesta : t.etiqueta
}

/** Máximo de opciones de respuesta en las de opción múltiple. */
export const MAX_OPCIONES = 6

/** Al cambiar de tipo se conservan los datos y se completan los mínimos del nuevo (dos opciones, dos parejas…). */
export function cambiarTipo(p: Pregunta, tipo: TipoPregunta): Pregunta {
  const siguiente: Pregunta = { ...p, tipo }
  if (tipo === 'multiple_choice_single' || tipo === 'multiple_choice_multiple') {
    let opciones = p.opciones.length >= 2 ? p.opciones : [...p.opciones, ...Array(2 - p.opciones.length).fill({ texto: '', correcta: false })]
    // Única respuesta: si venía con varias correctas, queda solo la primera.
    if (tipo === 'multiple_choice_single') {
      const primera = opciones.findIndex((o) => o.correcta)
      opciones = opciones.map((o, i) => ({ ...o, correcta: i === primera }))
    }
    siguiente.opciones = opciones
  }
  if (tipo === 'matching' && p.parejas.length < 2)
    siguiente.parejas = [...p.parejas, ...Array(2 - p.parejas.length).fill({ a: '', b: '' })]
  // Las escalas nacen con la medida de siempre: 1 a 5, y 5 estrellas.
  if (tipo === 'rating_scale' && !p.escala.maximo) siguiente.escala = { ...p.escala, minimo: p.escala.minimo || '1', maximo: '5' }
  if (tipo === 'rating_stars') siguiente.escala = { ...p.escala, minimo: '1', maximo: p.escala.maximo || '5' }
  // La escala de preferencias nace midiendo grado de acuerdo, que es la que más se usa.
  // El NPS siempre va de 0 a 10: no es ajustable, es lo que lo hace comparable con cualquier otro NPS.
  if (tipo === 'nps') siguiente.escala = { ...p.escala, minimo: String(NPS_MINIMO), maximo: String(NPS_MAXIMO) }
  if (tipo === 'dropdown' && p.opciones.length < 2)
    siguiente.opciones = [...p.opciones, ...Array(2 - p.opciones.length).fill({ texto: '', correcta: false })]
  if (tipo === 'fill_blank' && p.palabraFaltante.opciones.length < 2)
    siguiente.palabraFaltante = { opciones: [...p.palabraFaltante.opciones, ...Array(2 - p.palabraFaltante.opciones.length).fill('')] }
  return siguiente
}

// ── Ayudas ───────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * La ayuda que va entre el enunciado y las respuestas mientras se edita (null si no toca).
 *
 * **En una encuesta no se pide respuesta correcta**: no hay nada que calificar, así que no se avisa de que falte
 * marcarla (comprobado en el Creator real, 7-oct).
 */
/**
 * **Lo que pide el formulario**, dicho antes de que falte nada: es el aviso azul, y si al intentar guardar falta
 * algo, ese mismo aviso se vuelve rojo con el detalle (`faltaEnPregunta`).
 *
 * Es **generalista a propósito**. Cuando decía solo una parte —«escribe al menos dos opciones y marca la correcta»—
 * uno hacía justo eso, pulsaba «Agregar» y se encontraba con que faltaba el enunciado. El aviso de entrada dice qué
 * hay que hacer en conjunto; el rojo, ya con nombres, dice qué quedó suelto (Dave, 9-oct).
 */
export function ayudaDe(p: Pregunta, encuesta = false): string | null {
  // La de completar es la única que explica **cómo se escribe**, no qué falta: sin el marcador no hay hueco.
  if (p.tipo === 'fill_blank')
    return 'Reemplaza cada palabra faltante con un marcador de doble llave y número. Usa el número de la opción correcta. Por ejemplo: {{2}}.'
  // Una instrucción no tiene nada que completar más que su propio texto.
  if (p.tipo === 'instruction') return null
  // **En una encuesta no hay respuesta correcta**, así que lo único que se pide es rellenar.
  if (encuesta) return 'Completa todos los campos.'
  // Donde la respuesta correcta **se marca**, se dice; donde se escribe —respuesta corta, parejas, la palabra del
  // hueco— ya entra en «todos los campos».
  if (p.tipo === 'multiple_choice_multiple') return 'Completa todos los campos y marca las respuestas correctas.'
  if (p.tipo === 'multiple_choice_single' || p.tipo === 'true_false') return 'Completa todos los campos y marca la respuesta correcta.'
  return 'Completa todos los campos.'
}

/** Texto principal en modo lectura: el enunciado, o el texto de la instrucción. */
/**
 * **Qué le falta a una pregunta para poder guardarse**, en el lenguaje de quien la escribe. Vacío quiere decir que
 * está completa.
 *
 * Es la misma idea del creador de encuestas: «Agregar» y «Guardar» piden la pregunta entera, y si falta algo el
 * formulario **no se cierra**, sino que marca lo que falta. Así no nacen preguntas a medias que luego nadie sabe
 * quién dejó así (Dave, 9-oct).
 */
export function faltaEnPregunta(p: Pregunta): string[] {
  const falta: string[] = []
  // Una instrucción no es una pregunta: lo único que tiene que traer es su texto.
  if (p.tipo === 'instruction') {
    if (!textoPlano(p.instruccion).trim()) falta.push('el texto de la instrucción')
    return falta
  }
  if (!p.enunciado.trim()) falta.push('el enunciado')

  const conOpciones = ['multiple_choice_single', 'multiple_choice_multiple', 'dropdown'].includes(p.tipo)
  if (conOpciones) {
    const escritas = p.opciones.filter((o) => o.texto.trim())
    if (escritas.length < 2) falta.push('al menos dos opciones')
    else if (p.opciones.some((o) => !o.texto.trim())) falta.push('el texto de todas las opciones')
    // En una encuesta no hay respuesta correcta; en una evaluación, sí (regla del 7-oct).
    if (!encuestaPura(p.tipo) && escritas.length >= 2 && !p.opciones.some((o) => o.correcta)) falta.push('cuál es la respuesta correcta')
  }
  if (p.tipo === 'true_false' && !p.verdaderoFalso) falta.push('si es verdadero o falso')
  if (p.tipo === 'short_answer' && !p.respuestaCorta.respuesta.trim()) falta.push('la respuesta correcta')
  if (p.tipo === 'matching') {
    const completas = p.parejas.filter((x) => x.a.trim() && x.b.trim())
    if (completas.length < 2) falta.push('al menos dos parejas completas')
    else if (p.parejas.some((x) => Boolean(x.a.trim()) !== Boolean(x.b.trim()))) falta.push('los dos lados de cada pareja')
  }
  if (p.tipo === 'fill_blank') {
    if (!p.enunciado.includes('___')) falta.push('marcar el hueco con ___ en el enunciado')
    if (!p.palabraFaltante.opciones.some((o) => o.trim())) falta.push('la palabra que va en el hueco')
  }
  if (p.tipo === 'rating_scale' && (!p.escala.etiquetaMinimo.trim() || !p.escala.etiquetaMaximo.trim())) falta.push('las etiquetas de los extremos')
  return falta
}

/** Los tipos que solo existen en encuestas: ahí nunca hay respuesta correcta. */
const encuestaPura = (tipo: TipoPregunta) => ['nps', 'emoji', 'rating_stars', 'dropdown'].includes(tipo)

/** ¿Se puede guardar ya? */
export const preguntaCompleta = (p: Pregunta) => faltaEnPregunta(p).length === 0

export const enunciadoDe = (p: Pregunta) => (p.tipo === 'instruction' ? textoPlano(p.instruccion) : p.enunciado.trim())

// ── Generación con IA ────────────────────────────────────────────────────────────────────────────────────────────

export type Dificultad = 'basic' | 'intermediate' | 'advanced'

export const ETIQUETA_DIFICULTAD: Record<Dificultad, string> = { basic: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }

export const TEMA_IA = 'Resolución efectiva de conflictos en equipos de trabajo'

function barajar<T>(lista: T[]): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

/**
 * Toma preguntas del banco al azar para una dificultad: si se pidieron varios tipos, los va alternando; si un tipo se
 * agota, completa con lo que quede del resto. Sin coincidencias, usa el banco entero de esa dificultad.
 */
export function generarPreguntas(dificultad: Dificultad, cantidad: number, tipos: TipoBanco[]): Pregunta[] {
  const banco = BANCO_PREGUNTAS[dificultad] ?? BANCO_PREGUNTAS.intermediate
  const pedidos: TipoBanco[] = tipos.length ? tipos : ['multiple_choice_single_answer']
  let filtradas = banco.filter((q) => pedidos.includes(q.agentType))
  if (!filtradas.length) filtradas = [...banco]
  const total = Math.min(Math.max(1, cantidad), filtradas.length)

  let elegidas: PreguntaBanco[]
  if (pedidos.length <= 1) {
    elegidas = barajar(filtradas).slice(0, total)
  } else {
    const cubetas = new Map(pedidos.map((t) => [t, barajar(filtradas.filter((q) => q.agentType === t))]))
    elegidas = []
    let avanzo = true
    while (elegidas.length < total && avanzo) {
      avanzo = false
      for (const t of pedidos) {
        const siguiente = cubetas.get(t)?.shift()
        if (siguiente && elegidas.length < total) {
          elegidas.push(siguiente)
          avanzo = true
        }
      }
    }
    if (elegidas.length < total) {
      const usadas = new Set(elegidas.map((q) => q.stmt))
      elegidas.push(...barajar(filtradas.filter((q) => !usadas.has(q.stmt))).slice(0, total - elegidas.length))
    }
  }
  return elegidas.map(desdeBanco)
}
