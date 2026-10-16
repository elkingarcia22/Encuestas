import {
  countQuestions,
  findQuestionOwner,
  findSection,
  flattenSections,
  moveDestinationsForQuestion,
  moveQuestionTo,
  patchSection,
  removeSection,
  type SectionTreeEntry,
} from '@/modules/admin/desempeno-cultura/encuestas/modelo/sectionTree'
import type { SurveySection } from '@/modules/admin/desempeno-cultura/encuestas/modelo/surveyBuilderTypes'
import type { Pregunta } from '../borrador'

/**
 * **Las preguntas viven dentro de secciones, con la misma forma y la misma lógica que el creador de encuestas de
 * Desempeño y cultura.** La estructura es su `SurveySection` —mismos campos y mismos nombres— y quien mueve, ordena,
 * numera y cuenta es **su** `sectionTree`, que son funciones puras: se usan tal cual, sin tocar ni una línea de sus
 * archivos (Dave, 8-oct: «tenemos prohibido tocar los archivos de otros»).
 *
 * Lo único que cambia es **qué es una pregunta**: la suya es de encuesta y la nuestra tiene ocho tipos más. Sus
 * funciones no miran dentro de la pregunta —solo su `id`—, así que aquí se les pasa la nuestra con un cast en el
 * borde. Es la costura, y vive solo en este archivo.
 */
/**
 * **Un solo nivel: secciones, sin subsecciones** (Dave, 9-oct).
 *
 * Las de tres niveles son las del creador de encuestas de Desempeño y cultura, que es donde viven las encuestas de
 * verdad —clima, pulso— con sus dimensiones. Una evaluación o una encuesta **dentro de un contenido** es otra cosa:
 * cinco, diez o veinte preguntas sobre un tema. Anidarlas era cargar a quien crea con numeración 2.1.1, migas y dos
 * formas de mover, a cambio de una estructura que casi nadie iba a usar. Quien necesite agrupar de verdad puede
 * partirlo en varias páginas de evaluación, que además le da un respiro a quien responde.
 */
export const NOMBRE_NIVEL: Record<number, string> = { 1: 'Sección' }

export type SeccionPreguntas = Omit<SurveySection, 'questions' | 'children'> & {
  questions: readonly Pregunta[]
  children: readonly SeccionPreguntas[]
}
export type EntradaSeccion = Omit<SectionTreeEntry, 'section'> & { section: SeccionPreguntas }

/** La costura: sus funciones trabajan la estructura y nunca miran dentro de una pregunta. */
const comoSuyas = (secciones: readonly SeccionPreguntas[]) => secciones as unknown as SurveySection[]
const comoNuestras = (secciones: SurveySection[]) => secciones as unknown as SeccionPreguntas[]

const id = () => `sec-${Math.random().toString(36).slice(2, 9)}`

export const seccionVacia = (title = ''): SeccionPreguntas => ({ id: id(), title, description: '', questions: [], children: [] })

/**
 * Las secciones de una página, siempre. Una página que todavía guarda su lista plana —las de antes de que esto
 * existiera— se lee como **una sección sin título** con esas preguntas dentro, así que ninguna pantalla tiene que
 * preguntarse si la página «usa secciones».
 */
export function seccionesDe(recurso: { secciones?: SeccionPreguntas[]; preguntas?: Pregunta[] } | undefined): SeccionPreguntas[] {
  if (recurso?.secciones?.length) return aplanar(recurso.secciones)
  return [{ id: 'sec-unica', title: '', description: '', questions: recurso?.preguntas ?? [], children: [] }]
}

/**
 * **Sin subsecciones.** Lo que venga anidado de antes sube: las preguntas de una hija pasan al final de su madre, en
 * orden, y la hija desaparece. Nadie pierde preguntas y la numeración queda plana (Dave, 9-oct).
 */
function aplanar(secciones: readonly SeccionPreguntas[]): SeccionPreguntas[] {
  const preguntasDe = (seccion: SeccionPreguntas): Pregunta[] => [...seccion.questions, ...seccion.children.flatMap(preguntasDe)]
  return secciones.map((seccion) =>
    seccion.children.length === 0 ? seccion : { ...seccion, questions: preguntasDe(seccion), children: [] },
  )
}

/** Las preguntas de todas las secciones, en el orden en que se responden. */
export function aplanarPreguntas(secciones: readonly SeccionPreguntas[]): Pregunta[] {
  return entradasDe(secciones).flatMap((entrada) => [...entrada.section.questions])
}

/** La página no tiene secciones de verdad: una sola, sin título. Se ve como la lista de siempre. */
export const esListaSimple = (secciones: readonly SeccionPreguntas[]) =>
  secciones.length === 1 && !secciones[0].title.trim() && secciones[0].children.length === 0

/** Secciones y subsecciones en el orden en que se ven, con su numeración. */
export const entradasDe = (secciones: readonly SeccionPreguntas[]): EntradaSeccion[] =>
  flattenSections(comoSuyas(secciones)) as unknown as EntradaSeccion[]

export const cambiarSeccion = (
  secciones: readonly SeccionPreguntas[],
  seccionId: string,
  cambio: Partial<Omit<SeccionPreguntas, 'id'>>,
): SeccionPreguntas[] => comoNuestras(patchSection(comoSuyas(secciones), seccionId, cambio as never))

export const quitarSeccion = (secciones: readonly SeccionPreguntas[], seccionId: string): SeccionPreguntas[] =>
  comoNuestras(removeSection(comoSuyas(secciones), seccionId))

/** Dónde está una pregunta. */
export const duenoDe = (secciones: readonly SeccionPreguntas[], preguntaId: string): SeccionPreguntas | null =>
  (findQuestionOwner(comoSuyas(secciones), preguntaId)?.section as unknown as SeccionPreguntas) ?? null

/** Reemplaza una pregunta esté en la sección que esté. */
export function cambiarPregunta(secciones: readonly SeccionPreguntas[], pregunta: Pregunta): SeccionPreguntas[] {
  const dueno = findQuestionOwner(comoSuyas(secciones), pregunta.id)
  if (!dueno) return [...secciones]
  return cambiarSeccion(secciones, dueno.section.id, {
    questions: (dueno.section.questions as unknown as Pregunta[]).map((p) => (p.id === pregunta.id ? pregunta : p)),
  })
}

/** Quita una pregunta esté donde esté. */
export function quitarPregunta(secciones: readonly SeccionPreguntas[], preguntaId: string): SeccionPreguntas[] {
  const dueno = findQuestionOwner(comoSuyas(secciones), preguntaId)
  if (!dueno) return [...secciones]
  return cambiarSeccion(secciones, dueno.section.id, {
    questions: (dueno.section.questions as unknown as Pregunta[]).filter((p) => p.id !== preguntaId),
  })
}

/** Mete una pregunta al final de una sección. */
export function meterPregunta(secciones: readonly SeccionPreguntas[], seccionId: string, pregunta: Pregunta): SeccionPreguntas[] {
  const destino = entradasDe(secciones).find((e) => e.section.id === seccionId)
  if (!destino) return [...secciones]
  return cambiarSeccion(secciones, seccionId, { questions: [...destino.section.questions, pregunta] })
}

/** Cuántas preguntas cuelgan de una sección, contando las de sus subsecciones. */
export const contarPreguntas = (seccion: SeccionPreguntas): number => countQuestions(comoSuyas([seccion]))

/**
 * **Mover a otra sección**, con las mismas funciones puras del creador de encuestas. Arrastrar solo reordena entre
 * hermanas: para sacar una pregunta de su sección y llevarla a otra, el camino es este menú (Dave, 9-oct).
 */
export const destinosDePregunta = (secciones: readonly SeccionPreguntas[], seccionId: string): EntradaSeccion[] =>
  moveDestinationsForQuestion(comoSuyas(secciones), seccionId) as unknown as EntradaSeccion[]

export const moverPregunta = (secciones: readonly SeccionPreguntas[], preguntaId: string, destinoId: string): SeccionPreguntas[] =>
  comoNuestras(moveQuestionTo(comoSuyas(secciones), preguntaId, destinoId))


/** Una sección en cualquier nivel del árbol, no solo en la raíz. */
export const buscarSeccion = (secciones: readonly SeccionPreguntas[], seccionId: string): SeccionPreguntas | null =>
  (findSection(comoSuyas(secciones), seccionId)?.section as unknown as SeccionPreguntas) ?? null

/** Todo lo que cuelga de una sección, en el orden en que se ve. */
export const descendientesDe = (secciones: readonly SeccionPreguntas[], seccionId: string): EntradaSeccion[] => {
  const todas = entradasDe(secciones)
  const dentro = new Set<string>()
  const marcar = (id: string) => {
    for (const e of todas)
      if (e.parentId === id && !dentro.has(e.section.id)) {
        dentro.add(e.section.id)
        marcar(e.section.id)
      }
  }
  marcar(seccionId)
  return todas.filter((e) => dentro.has(e.section.id))
}
